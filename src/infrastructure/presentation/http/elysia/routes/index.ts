import { Elysia } from 'elysia';
import { thumbnailsRoutes } from './thumbnails.routes';
import { healthRoutes } from './health.routes';
import { NotFoundError } from '@/core/shared/errors';

const routes = new Elysia({ name: 'routes' })
  .use(thumbnailsRoutes)
  .use(healthRoutes)
  // Global 404 handler - must be last after all routes
  .all('/*', () => {
    throw new NotFoundError('Route', '/*');
  });

export { routes };
