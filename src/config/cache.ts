import { RedisClient } from 'bun';
import { env } from './env';
import { createModuleLogger } from './logger';
import { CacheError } from '@/core/shared/errors';

const logger = createModuleLogger('Cache');

let cacheClient: RedisClient | null = null;

function getCacheClient(): RedisClient {
  if (!cacheClient) {
    throw new CacheError('Cache client has not been initialized');
  }
  return cacheClient;
}

const initCacheClient = async () => {
  if (cacheClient) return;

  cacheClient = new RedisClient(env.CACHE_URL, {
    connectionTimeout: env.CACHE_CONNECTION_TIMEOUT,
    idleTimeout: env.CACHE_IDLE_TIMEOUT,
    autoReconnect: env.CACHE_AUTO_RECONNECT,
    maxRetries: env.CACHE_MAX_RETRIES,
    enableAutoPipelining: env.CACHE_ENABLE_AUTO_PIPELINING,
    tls: env.CACHE_SSL,
  });

  try {
    await cacheClient.ping();
    logger.info('Redis connected');
  } catch (error) {
    logger.error({ error }, 'Redis connection test failed');
    throw new CacheError('Failed to connect to Redis', { error });
  }
};

const closeCacheClient = () => {
  if (cacheClient) {
    cacheClient.close();
    cacheClient = null;
    logger.info('Cache connection closed');
  }
};

export { getCacheClient, initCacheClient, closeCacheClient };
