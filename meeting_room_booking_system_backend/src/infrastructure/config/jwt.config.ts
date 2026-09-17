import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET ?? 'meeting_room_booking_system_jwt_secret',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '30m',
}));
