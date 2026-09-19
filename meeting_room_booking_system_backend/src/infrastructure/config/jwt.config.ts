import { registerAs } from '@nestjs/config';

const isProduction = process.env.NODE_ENV === 'production';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET;

  // 生产环境强制显式配置，禁止默认密钥上线
  if (isProduction && !secret) {
    throw new Error('生产环境必须通过环境变量配置 JWT_SECRET');
  }

  return {
    secret: secret ?? 'meeting_room_booking_system_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '30m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  };
});
