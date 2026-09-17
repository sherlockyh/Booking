import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(
    @Inject('REDIS_CLIENT') private readonly client: RedisClientType,
  ) {}

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get<T = string>(key: string) {
    return this.client.get(key) as Promise<T | null>;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      return this.client.set(key, value, { EX: ttlSeconds });
    }

    return this.client.set(key, value);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  async expire(key: string, ttlSeconds: number) {
    return this.client.expire(key, ttlSeconds);
  }
}
