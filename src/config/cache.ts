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

  cacheClient = new RedisClient(env.CACHE_URL as string, {
    connectionTimeout: env.CACHE_CONNECTION_TIMEOUT,
    idleTimeout: env.CACHE_IDLE_TIMEOUT,
    autoReconnect: env.CACHE_AUTO_RECONNECT,
    maxRetries: env.CACHE_MAX_RETRIES,
    enableOfflineQueue: env.CACHE_ENABLE_OFFLINE_QUEUE,
    enableAutoPipelining: env.CACHE_ENABLE_AUTO_PIPELINING,
    tls: env.CACHE_SSL,
  });
  cacheClient.onconnect = () => {
    logger.info('Connected to Redis');
  };
  cacheClient.onclose = () => {
    logger.warn('Redis connection closed');
  };

  try {
    await cacheClient.connect();
    logger.info('Redis connected');
  } catch (error) {
    logger.error({ error }, 'Redis connection failed');
    throw new CacheError('Failed to connect to Redis', { error });
  }
};

function closeCacheClient(): void {
  if (cacheClient) {
    cacheClient.close();
    cacheClient = null;
    logger.info('Cache connection closed');
  }
}

export { getCacheClient, initCacheClient, closeCacheClient };
