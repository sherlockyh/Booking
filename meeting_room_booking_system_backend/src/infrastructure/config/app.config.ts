import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: Number(process.env.PORT ?? 3000),
  // 跨域白名单：逗号分隔的来源列表。前端与 API 同源（vite/nginx 反代），
  // 默认不开放跨域；确有跨域需求时才配置 CORS_ORIGINS
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
}));
