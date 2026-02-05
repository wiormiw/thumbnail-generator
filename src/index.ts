import { Elysia } from 'elysia';
import {
  env,
  initLogger,
  getLogger,
  initDatabaseClient,
  getDatabaseClient,
  closeDatabaseClient,
  initCacheClient,
  getCacheClient,
  closeCacheClient,
  initStorageClient,
  getStorageClient,
  closeStorageClient,
  closeLogger,
} from './config';
import { errorHandlerPlugin } from './infrastructure/presentation/http/plugins/error-handler.plugin';
import { resultHandlerPlugin } from './infrastructure/presentation/http/plugins/result-handler.plugin';
import { requestIdPlugin } from './infrastructure/presentation/http/plugins/request-id.plugin';
import { routes } from './infrastructure/presentation/http/routes';
import { ThumbnailsUseCase } from '@/application/thumbnails';
import { MinioRepository } from './infrastructure/repositories/minio/minio.repository';
import { RedisRepository } from './infrastructure/repositories/redis/redis.repository';
import { ThumbnailsRepository } from './infrastructure/repositories/postgres/thumbnails.repository';
import { TransactionManager } from './infrastructure/persistence/database/postgres/transaction-manager';

interface DIContainer {
  getThumbnailsUseCase(): ThumbnailsUseCase;
  getMinioRepository(): MinioRepository;
  getRedisRepository(): RedisRepository;
  getThumbnailsRepository(): ThumbnailsRepository;
  getTransactionManager(): TransactionManager;
}

class DIContainerImpl implements DIContainer {
  private thumbnailsUseCase: ThumbnailsUseCase | null = null;
  private minioRepository: MinioRepository | null = null;
  private redisRepository: RedisRepository | null = null;
  private thumbnailsRepository: ThumbnailsRepository | null = null;
  private transactionManager: TransactionManager | null = null;

  getThumbnailsUseCase(): ThumbnailsUseCase {
    if (!this.thumbnailsUseCase) {
      const logger = getLogger().child({ component: 'ThumbnailsUseCase' });
      this.thumbnailsUseCase = new ThumbnailsUseCase(logger, this.getThumbnailsRepository());
    }
    return this.thumbnailsUseCase;
  }

  getMinioRepository(): MinioRepository {
    if (!this.minioRepository) {
      const logger = getLogger().child({ component: 'MinioRepository' });
      this.minioRepository = new MinioRepository(getStorageClient(), logger);
    }
    return this.minioRepository;
  }

  getRedisRepository(): RedisRepository {
    if (!this.redisRepository) {
      const logger = getLogger().child({ component: 'RedisRepository' });
      this.redisRepository = new RedisRepository(getCacheClient(), logger);
    }
    return this.redisRepository;
  }

  getThumbnailsRepository(): ThumbnailsRepository {
    if (!this.thumbnailsRepository) {
      const logger = getLogger().child({ component: 'ThumbnailsRepository' });
      this.thumbnailsRepository = new ThumbnailsRepository(getDatabaseClient, logger);
    }
    return this.thumbnailsRepository;
  }

  getTransactionManager(): TransactionManager {
    if (!this.transactionManager) {
      const logger = getLogger().child({ component: 'TransactionManager' });
      this.transactionManager = new TransactionManager(getDatabaseClient, logger);
    }
    return this.transactionManager;
  }
}

const di = new DIContainerImpl();

async function initializeApp() {
  initLogger();
  await initDatabaseClient();
  await initCacheClient();
  await initStorageClient();

  const logger = getLogger();
  logger.info({ env: env.NODE_ENV }, 'Application initialized');

  const app = new Elysia({
    name: 'thumbnail-generator',
    seed: env.NODE_ENV,
    normalize: true,
    aot: env.NODE_ENV === 'production',
  })
    .use(requestIdPlugin)
    .onRequest((context) => {
      const ctx = context as unknown as { request: Request; requestId: string };
      logger.info(
        {
          requestId: ctx.requestId,
          method: ctx.request.method,
          url: ctx.request.url,
        },
        'Incoming request'
      );
    })
    .onAfterHandle((context) => {
      const ctx = context as unknown as {
        request: Request;
        set: { status: number | string };
        requestId: string;
      };
      logger.info(
        {
          requestId: ctx.requestId,
          method: ctx.request.method,
          url: ctx.request.url,
          status: ctx.set.status,
        },
        'Request completed'
      );
    })
    .use(errorHandlerPlugin)
    .use(resultHandlerPlugin)
    .decorate('di', di)
    .use(routes);

  return { app, logger };
}

async function gracefulShutdown(signal: string) {
  const logger = getLogger();
  logger.info({ signal }, 'Received shutdown signal');

  try {
    await closeDatabaseClient();
    closeCacheClient();
    closeStorageClient();
    closeLogger();
    logger.info('Graceful shutdown completed');
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
  }

  process.exit(0);
}

const { app, logger } = await initializeApp();

app.listen(env.PORT);

logger.info(`Server running at http://localhost:${env.PORT}`);

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, type DIContainer, di };
