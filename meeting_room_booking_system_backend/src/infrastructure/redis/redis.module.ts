import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { createClient } from 'redis';
import { ConfigType } from '@nestjs/config';
import redisConfig from '@infrastructure/config/redis.config';

@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      inject: [redisConfig.KEY],
      useFactory: async (redis: ConfigType<typeof redisConfig>) => {
        const client = createClient({
          socket: {
            host: redis.host,
            port: redis.port,
          },
        });

        await client.connect();
        return client;
      },
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
