import { RedisClient } from 'bun';
import { env } from './env';
import { createModuleLogger } from './logger';
import { CacheError } from '@/core/errors';

const logger = createModuleLogger('Cache');

let cacheClient: RedisClient | null = null;

function getCacheClient(): RedisClient {
  if (!cacheClient) {
    throw new CacheError('Cache client has not been initialized');
  }
  return cacheClient;
}

const initCacheClient = async () => {
  if (cacheClient) return; // Idempotent check

  cacheClient = new RedisClient(env.CACHE_URL, {
    connectionTimeout: env.CACHE_CONNECTION_TIMEOUT,
    idleTimeout: env.CACHE_IDLE_TIMEOUT,
    autoReconnect: env.CACHE_AUTO_RECONNECT,
    maxRetries: env.CACHE_MAX_RETRIES,
    enableOfflineQueue: env.CACHE_ENABLE_OFFLINE_QUEUE,
    enableAutoPipelining: env.CACHE_ENABLE_AUTO_PIPELINING,
    tls: env.CACHE_SSL,
  });

  cacheClient.onconnect = () => {
    logger.info('Cache connected');
  };

  cacheClient.onclose = (error) => {
    logger.info({ error }, 'Cache connection closed');
  };

  await cacheClient.connect();
};

const closeCacheClient = () => {
  if (cacheClient) {
    cacheClient.close();
    cacheClient = null;
  }
};

export { getCacheClient, initCacheClient, closeCacheClient };
