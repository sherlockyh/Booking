import { registerAs } from '@nestjs/config';

// OSS（对象存储）配置。
// registerAs('oss') 把返回值注册为名为 "oss" 的配置命名空间，
// 代码里通过 ConfigService.get('oss.xxx') 或注入 ossConfig.KEY 读取（见 oss.module.ts）。
export default registerAs('oss', () => ({
  // S3 API 地址：后端访问 MinIO 走这个地址。
  // 容器之间用 compose 服务名互相访问（和 DB_HOST=mysql 一个道理）；本机裸跑后端才改成 http://127.0.0.1:9000
  endpoint: process.env.S3_ENDPOINT ?? 'http://minio:9000',
  // 区域（region）：AWS S3 的概念，表示数据物理所在的地理区域。
  // MinIO 不校验具体值，但 SDK 必须传一个，习惯上用 us-east-1
  region: process.env.S3_REGION ?? 'us-east-1',
  // 桶（bucket）：对象存储的"顶层命名空间"，类似一个独立的存储空间/网盘根目录。
  // 同一个桶内的对象用 Key（路径）区分，见 oss.service.ts 的 uploadAvatar
  bucket: process.env.S3_BUCKET ?? 'meeting-room',
  // 访问凭证：相当于"用户名 + 密码"，取自 compose 里的 MINIO_ROOT_USER / MINIO_ROOT_PASSWORD
  accessKey: process.env.S3_ACCESS_KEY ?? 'minioadmin',
  secretKey: process.env.S3_SECRET_KEY ?? 'minioadmin123',
  // 公开访问地址：接口返回给前端的图片 URL 用它拼接，是"浏览器 -> MinIO"的方向。
  // 注意和 endpoint 的区别——endpoint 是"后端 -> MinIO"，只在服务端之间用
  publicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? 'http://localhost:9000',
  // 预签名 URL 有效期（秒）：过期后链接失效。预签名 = "临时授权"，期限越短越安全
  presignExpiresIn: Number(process.env.S3_PRESIGN_EXPIRES_IN ?? 3600),
}));
