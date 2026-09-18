import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';
import * as path from 'path';
import ossConfig from '@infrastructure/config/oss.config';

// 客户端的注入 token：同一进程里可能有很多第三方客户端（Redis、MySQL...），
// 用字符串 token 区分，避免和别的类/标识符撞名（写法和 RedisModule 的 'REDIS_CLIENT' 一致）
export const OSS_CLIENT = 'OSS_CLIENT';

// 上传结果：key 存数据库（与访问地址解耦，换域名/HTTPS/CDN 都不用改历史数据），
// url 只是给前端"上传后立即预览"用的 conveniences 字段
export interface UploadOssResult {
  key: string;
  url: string;
}

// 对象 Key 的统一前缀。S3 没有"目录"的概念，所谓目录就是 Key 里的 "/" 前缀，
// Key = avatars/1737-abc.png 就相当于 avatars 目录下的一个文件
const AVATAR_PREFIX = 'avatars/';

// 核心概念速记：
//   桶 bucket   = 顶层存储空间（本服务用 "meeting-room" 一个桶）
//   对象 object = 一个文件，由 Key（路径）+ 内容 + 元数据（ContentType 等）组成
//   桶策略      = 挂在桶上的 JSON 权限规则，决定"谁可以对什么前缀做什么操作"
@Injectable()
export class OssService implements OnModuleInit {
  private readonly logger = new Logger(OssService.name);
  private ensureBucketPromise?: Promise<void>;

  constructor(
    @Inject(OSS_CLIENT) private readonly client: S3Client,
    @Inject(ossConfig.KEY) private readonly config: ConfigType<typeof ossConfig>,
  ) {}

  // 应用启动时初始化。失败（比如 MinIO 还没起来）只告警不抛错，
  // 避免存储抖动拖垮整个应用——首次上传时会通过 ensureBucket() 重试
  async onModuleInit() {
    await this.ensureBucket().catch((error) => {
      // MinIO 未就绪不阻塞应用启动，首次上传时会重试
      this.logger.warn(`MinIO 初始化失败，将在首次上传时重试: ${error?.message ?? error}`);
    });
  }

  // 幂等初始化：建桶（已存在则跳过）+ 放开 avatars/* 匿名读。
  // 幂等 = 重复调用结果一致，所以启动时调一次、每次上传前再调一次都没问题。
  // 把 Promise 缓存到 ensureBucketPromise 是防止并发请求重复初始化；
  // 失败时清空缓存，让下一次调用重新尝试
  private ensureBucket(): Promise<void> {
    this.ensureBucketPromise ??= this.initBucket().catch((error) => {
      this.ensureBucketPromise = undefined;
      throw error;
    });
    return this.ensureBucketPromise;
  }

  private async initBucket(): Promise<void> {
    const { bucket } = this.config;

    // HeadBucket：探测桶是否存在（不存在会抛 404），比直接 CreateBucket 温和
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
    }

    // 桶策略：JSON 形式的权限规则，字段含义——
    //   Effect    Allow=允许 / Deny=拒绝
    //   Principal AWS:['*'] = 任何人（匿名也含）
    //   Action    允许的操作，这里只放行"读取对象"(GetObject)
    //   Resource  作用的资源，arn 是 AWS 的资源标识格式，这里精确到 avatars/ 前缀
    // 为什么只放开 avatars/*：浏览器 <img> 标签需要无凭证直接访问头像；
    // 其他前缀（比如以后的私有附件）不放开，必须走预签名 URL 访问
    await this.client.send(
      new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicReadAvatars',
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucket}/${AVATAR_PREFIX}*`],
            },
          ],
        }),
      }),
    );

    this.logger.log(`MinIO bucket 已就绪: ${bucket}`);
  }

  // 上传头像：返回 { key, url }——key 给前端存库，url 给前端立即预览
  async uploadAvatar(file: { originalname: string; buffer: Buffer; mimetype: string }): Promise<UploadOssResult> {
    await this.ensureBucket();

    // Key 用"时间戳 + 随机串"生成，坚决不用原始文件名：
    //   1. 原始名是用户可控输入，直接拼进路径有目录穿越风险（../）
    //   2. 不同用户传同名文件会互相覆盖
    //   3. 原始名可能泄露隐私（如"离职证明-张三.png"）
    // 扩展名保留了原始名的，但它已在上游 controller 里做过白名单校验
    const extension = path.extname(file.originalname).toLowerCase();
    const key = `${AVATAR_PREFIX}${Date.now()}-${randomBytes(8).toString('hex')}${extension}`;

    // PutObject：上传对象。Body 传 Buffer（内存里的文件内容），
    // ContentType 会成为响应头 Content-Type，浏览器靠它决定怎么渲染
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return { key, url: this.publicUrl(key) };
  }

  // 把数据库里存的头像标识解析成浏览器可访问的 URL。
  // 库里会出现三种历史形态，分别处理：
  //   1. OSS Key（规范形态，如 avatars/xxx.png）→ 拼上公开访问前缀
  //   2. 历史完整 URL（http(s):// 开头或 // 开头）→ 原样返回，不改历史数据
  //   3. 历史本地磁盘路径（uploads/ 开头）→ 转成同源静态路径，走 Nest 静态服务
  resolveAvatarUrl(value?: string | null): string | undefined {
    if (!value) {
      return undefined;
    }

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')) {
      return value;
    }

    if (value.startsWith('uploads/')) {
      return `/${value}`;
    }

    return this.publicUrl(value);
  }

  // 公开 URL = 公开访问地址 + 桶名 + Key（路径风格，见 oss.module.ts 的 forcePathStyle）
  publicUrl(key: string): string {
    return `${this.config.publicBaseUrl}/${this.config.bucket}/${key}`;
  }

  // 预签名 URL：把"允许读某个对象"的签名参数直接拼在 URL 上，
  // 拿到链接的人在 expiresIn 秒内可以访问，过期自动失效。
  // 适合私有对象的临时分享——不需要代理文件流，也不用发长期凭证
  async getPresignedUrl(key: string, expiresIn = this.config.presignExpiresIn): Promise<string> {
    await this.ensureBucket();
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
      { expiresIn },
    );
  }

  // 删除对象。注意 S3 的 DeleteObject 对不存在的 Key 也返回成功（幂等），不会报错
  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
  }

  // 列举对象：按前缀过滤（相当于"列目录"），MaxKeys 单次最多返回几条。
  // 数据量大时响应里的 IsTruncated=true + ContinuationToken 可以翻页，这里暂时不翻
  async listObjects(prefix?: string, maxKeys = 100): Promise<string[]> {
    const result = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.config.bucket, Prefix: prefix, MaxKeys: maxKeys }),
    );
    return (result.Contents ?? []).map((item) => item.Key).filter((key): key is string => !!key);
  }
}
