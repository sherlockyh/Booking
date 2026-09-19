import { registerAs } from '@nestjs/config';

const isProduction = process.env.NODE_ENV === 'production';

export default registerAs('database', () => {
  const password = process.env.DB_PASSWORD;

  // 生产环境强制显式配置，禁止默认口令上线
  if (isProduction && !password) {
    throw new Error('生产环境必须通过环境变量配置 DB_PASSWORD');
  }

  return {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USERNAME ?? 'root',
    password: password ?? 'huihui',
    database: process.env.DB_DATABASE ?? 'meeting_room_booking_system',
  };
});
