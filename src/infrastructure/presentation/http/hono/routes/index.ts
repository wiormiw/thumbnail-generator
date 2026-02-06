import { OpenAPIHono } from '@hono/zod-openapi';
import { thumbnailsRoutes } from './thumbnails.routes';
import { healthRoutes } from './health.routes';
import { NotFoundError } from '@/core/shared/errors';
import type { HonoEnv } from '../types/context';

const routes = new OpenAPIHono<HonoEnv>()
  .route('/', healthRoutes)
  .route('/', thumbnailsRoutes)
  // Global 404 handler - must be last after all routes
  .all('/*', () => {
    throw new NotFoundError('Route', '/*');
  });

export { routes };
