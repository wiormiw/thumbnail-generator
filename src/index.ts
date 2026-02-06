import { Elysia } from 'elysia';
import {
  env,
  initLogger,
  getLogger,
  initDatabaseClient,
  closeDatabaseClient,
  initCacheClient,
  closeCacheClient,
  initStorageClient,
  closeStorageClient,
  closeLogger,
  getStorageClient,
  getCacheClient,
  getDatabaseClient,
} from './config';
import { errorHandlerPlugin } from '@/infrastructure/presentation/http/elysia/plugins/errorHandler.plugin';
import { requestIdPlugin } from '@/infrastructure/presentation/http/elysia/plugins/requestId.plugin';
import { routes } from '@/infrastructure/presentation/http/elysia/routes';
import { ThumbnailsUseCase, type IThumbnailsUseCase } from '@/application/thumbnails';
import { MinioRepository } from '@/infrastructure/adapters/storage/repositories/minio.repository';
import { RedisRepository } from '@/infrastructure/adapters/cache/repositories/redis.repository';
import { ThumbnailDrizzleRepository } from '@/infrastructure/adapters/database/drizzle/repositories/thumbnail.drizzle.repository';
import { TransactionManager } from '@/infrastructure/adapters/database/drizzle/transaction-manager';
import type {
  IThumbnailsRepository,
  IStorageRepository,
  ICacheRepository,
  ITransactionManager,
} from '@/core/ports';

interface DIContainer {
  getThumbnailsUseCase(): IThumbnailsUseCase;
  getStorageRepository(): IStorageRepository;
  getCacheRepository(): ICacheRepository;
  getThumbnailsRepository(): IThumbnailsRepository;
  getTransactionManager(): ITransactionManager;
}

class DIContainerImpl implements DIContainer {
  private thumbnailsUseCase: IThumbnailsUseCase | null = null;
  private storageRepository: IStorageRepository | null = null;
  private cacheRepository: ICacheRepository | null = null;
  private thumbnailsRepository: IThumbnailsRepository | null = null;
  private transactionManager: ITransactionManager | null = null;

  getThumbnailsUseCase(): IThumbnailsUseCase {
    if (!this.thumbnailsUseCase) {
      const logger = getLogger().child({ component: 'ThumbnailsUseCase' });
      this.thumbnailsUseCase = new ThumbnailsUseCase(logger, this.getThumbnailsRepository());
    }
    return this.thumbnailsUseCase;
  }

  getStorageRepository(): IStorageRepository {
    if (!this.storageRepository) {
      const logger = getLogger().child({ component: 'StorageRepository' });
      this.storageRepository = new MinioRepository(getStorageClient(), logger);
    }
    return this.storageRepository;
  }

  getCacheRepository(): ICacheRepository {
    if (!this.cacheRepository) {
      const logger = getLogger().child({ component: 'CacheRepository' });
      this.cacheRepository = new RedisRepository(getCacheClient(), logger);
    }
    return this.cacheRepository;
  }

  getThumbnailsRepository(): IThumbnailsRepository {
    if (!this.thumbnailsRepository) {
      const logger = getLogger().child({ component: 'ThumbnailRepository' });
      this.thumbnailsRepository = new ThumbnailDrizzleRepository(getDatabaseClient, logger);
    }
    return this.thumbnailsRepository;
  }

  getTransactionManager(): ITransactionManager {
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
    .decorate('di', di)
    .use(routes);

  return { app, logger };
}

async function gracefulShutdown(signal: string) {
  const logger = getLogger();
  logger.info({ signal }, 'Received shutdown signal');

  try {
    await app.stop();
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
app.on('stop', () => {
  logger.info('App has been stopped');
});

logger.info(`Server running at http://localhost:${env.PORT}`);

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, type DIContainer, di };
