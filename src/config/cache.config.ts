import { registerAs } from '@nestjs/config';
import { CacheModuleOptions } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

export default registerAs(
  'cache',
  (): CacheModuleOptions => ({
    store: process.env.REDIS_ENABLED === 'true' ? (redisStore as any) : 'memory',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    ttl: parseInt(process.env.CACHE_TTL, 10) || 900, // 15 minutes default
    max: 100, // Maximum number of items in cache
  }),
);
