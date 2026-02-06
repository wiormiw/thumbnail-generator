import { OpenAPIHono } from '@hono/zod-openapi';
import { requestId } from 'hono/request-id';
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
import {
  resultHandlerMiddleware,
  errorHandler,
  corsMiddleware,
  requestLogger,
} from '@/infrastructure/presentation/http/hono/middleware';
import { routes } from '@/infrastructure/presentation/http/hono/routes';
import type { HonoEnv } from '@/infrastructure/presentation/http/hono/types/context';
import { createDependencies, type Dependencies } from '@/application/di/dependencies';
import { MinioRepository } from '@/infrastructure/adapters/storage/repositories/minio.repository';
import { RedisRepository } from '@/infrastructure/adapters/cache/repositories/redis.repository';
import { ThumbnailDrizzleRepository } from '@/infrastructure/adapters/database/drizzle/repositories/thumbnail.drizzle.repository';
import { ThumbnailsUseCase } from '@/application/thumbnails';

// Initialize all clients
async function initializeApp() {
  initLogger();
  await initDatabaseClient();
  await initCacheClient();
  await initStorageClient();

  const logger = getLogger();
  logger.info({ env: env.NODE_ENV }, 'Application initialized');

  // Repositories
  const storageRepository = new MinioRepository(
    getStorageClient(),
    logger.child({ component: 'StorageRepository' })
  );
  const cacheRepository = new RedisRepository(
    getCacheClient(),
    logger.child({ component: 'CacheRepository' })
  );
  const thumbnailsRepository = new ThumbnailDrizzleRepository(
    getDatabaseClient,
    logger.child({ component: 'ThumbnailRepository' })
  );

  // Use cases
  const thumbnailsUseCase = new ThumbnailsUseCase(
    logger.child({ component: 'ThumbnailsUseCase' }),
    thumbnailsRepository,
    cacheRepository
  );

  // Dependencies
  const dependencies: Dependencies = createDependencies({
    logger,
    storageRepository,
    cacheRepository,
    thumbnailsRepository,
    thumbnailsUseCase,
  });

  const app = new OpenAPIHono<HonoEnv>();

  // CORS
  app.use('*', corsMiddleware());

  // Request ID
  app.use('*', requestId());

  // Result handler
  app.use('*', resultHandlerMiddleware);

  // Dependencies
  app.use('*', async (c, next) => {
    c.set('deps', dependencies);
    await next();
  });

  // Request logging
  app.use('*', requestLogger(logger));

  // Error handler
  app.use('*', errorHandler());

  // OpenAPI documentation endpoint
  app.doc('/doc', {
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'Thumbnail Generator API',
      description: 'API for generating and managing thumbnails',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],
  });

  // Routes
  app.route('/', routes);

  return { app, logger };
}

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  const logger = getLogger();
  logger.info({ signal }, 'Received shutdown signal');

  try {
    await closeDatabaseClient();
    closeCacheClient();
    closeStorageClient();
    await closeLogger();
    logger.info('Graceful shutdown completed');
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
  }

  process.exit(0);
}

const { app, logger } = await initializeApp();

logger.info(`Server running at http://localhost:${env.PORT}`);
logger.info(`OpenAPI documentation available at http://localhost:${env.PORT}/doc`);

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default {
  port: env.PORT,
  fetch: app.fetch,
};

export type AppType = typeof app;
