// OSS 练习场：把 S3 最常用的五个操作按顺序跑一遍。
// 运行：cd meeting_room_booking_system_backend && node scripts/oss-playground.mjs
// 前置：docker compose up -d minio；凭证从仓库根目录 .env 读取。
//
// 每一步都对应 @aws-sdk/client-s3 的一个 Command，改参数、加步骤随便玩。

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const here = dirname(fileURLToPath(import.meta.url));

// ---- 从仓库根目录 .env 读凭证（不存在则用默认值） ----
function loadEnv() {
  const env = {};
  const envPath = join(here, '../../../.env');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match) env[match[1]] = match[2];
    }
  }
  return {
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    bucket: process.env.S3_BUCKET ?? env.S3_BUCKET ?? 'meeting-room',
    accessKey: process.env.S3_ACCESS_KEY ?? env.MINIO_ROOT_USER ?? 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY ?? env.MINIO_ROOT_PASSWORD ?? 'minioadmin123',
  };
}

const { endpoint, bucket, accessKey, secretKey } = loadEnv();

const s3 = new S3Client({
  endpoint,
  region: 'us-east-1',
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  forcePathStyle: true, // MinIO 走 endpoint/bucket/key 路径风格
});

const log = (step, msg) => console.log(`\n【${step}】${msg}`);

// ---- 1. 建桶（已存在则跳过）----
log('1. HeadBucket / CreateBucket', `检查桶 ${bucket}`);
try {
  await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log(`桶已存在: ${endpoint}/${bucket}`);
} catch {
  await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  console.log(`桶已创建: ${endpoint}/${bucket}`);
}

// ---- 2. 上传对象 ----
const key = `playground/${Date.now()}.txt`;
const content = `hello oss @ ${new Date().toISOString()}`;
log('2. PutObject', `上传 ${key}`);
await s3.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: content,
    ContentType: 'text/plain',
  }),
);
console.log('上传完成');

// ---- 3. 下载对象 ----
log('3. GetObject', `下载 ${key}`);
const got = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
console.log('内容:', await got.Body.transformToString());

// ---- 4. 列举对象 ----
log('4. ListObjectsV2', `列举 playground/ 前缀`);
const listed = await s3.send(
  new ListObjectsV2Command({ Bucket: bucket, Prefix: 'playground/', MaxKeys: 10 }),
);
console.log('对象列表:', listed.Contents?.map((item) => `${item.Key} (${item.Size}B)`));

// ---- 5. 预签名 URL（给没有凭证的人临时访问，默认 1 小时过期）----
log('5. getSignedUrl', '生成预签名下载链接');
const presigned = await getSignedUrl(
  s3,
  new GetObjectCommand({ Bucket: bucket, Key: key }),
  { expiresIn: 3600 },
);
console.log('用浏览器或 curl 打开试试:\n', presigned);

// ---- 6. 删除对象 ----
log('6. DeleteObject', `删除 ${key}`);
await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
console.log('删除完成，练习结束 🎉');
console.log('\n进阶练习：PutBucketPolicy（桶策略）、CORS（前端直传）、Multipart Upload（分片上传）、生命周期规则');
