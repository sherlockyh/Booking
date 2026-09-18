import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import ossConfig from '@infrastructure/config/oss.config';
import { OssService, OSS_CLIENT } from './oss.service';

// 结构模仿 RedisModule：客户端实例用工厂创建、以 token 注入，
// Service 里 @Inject(OSS_CLIENT) 拿到的就是下面 useFactory 返回的 S3Client。
@Module({
  providers: [
    OssService,
    {
      provide: OSS_CLIENT,
      inject: [ossConfig.KEY],
      useFactory: (oss: ConfigType<typeof ossConfig>) =>
        new S3Client({
          endpoint: oss.endpoint,
          region: oss.region,
          credentials: {
            accessKeyId: oss.accessKey,
            secretAccessKey: oss.secretKey,
          },
          // S3 有两种寻址风格：
          //   虚拟主机风格：http://{bucket}.s3.endpoint.com/{key}（AWS 默认，需要泛域名 DNS）
          //   路径风格：    http://endpoint.com/{bucket}/{key}（MinIO 本地部署用这种）
          // 不加 forcePathStyle 的话 SDK 会按虚拟主机风格拼 URL，本地访问直接 404
          forcePathStyle: true,
        }),
    },
  ],
  exports: [OssService],
})
export class OssModule {}
