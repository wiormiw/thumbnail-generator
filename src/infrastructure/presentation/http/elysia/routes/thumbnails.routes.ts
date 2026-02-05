import { Elysia } from 'elysia';
import { ThumbnailCreateSchema, ThumbnailParamsSchema, type ThumbnailParamsType } from '../schema';
import { NotFoundError } from '@/core/shared/errors';
import { resultHandlerPlugin } from '../plugins/result-handler.plugin';
import type { AppContext } from '../types/context';

const thumbnailsRoutes = new Elysia({ name: 'routes:thumbnails' })
  .use(resultHandlerPlugin)
  .group('/thumbnails', (app) =>
    app
      .post(
        '/',
        async (context) => {
          const { handleResult, di, body } = context as typeof context & AppContext;
          const useCase = di.getThumbnailsUseCase();
          return handleResult(await useCase.generateThumbnail(body));
        },
        {
          body: ThumbnailCreateSchema,
          detail: {
            summary: 'Generate thumbnail',
            description: 'Generate a thumbnail from a URL',
            tags: ['thumbnails'],
          },
        }
      )
      .get(
        '/',
        async (context) => {
          const { handleResult, di } = context as typeof context & AppContext;
          const useCase = di.getThumbnailsUseCase();
          return handleResult(await useCase.listThumbnails());
        },
        {
          detail: {
            summary: 'List thumbnails',
            description: 'List all thumbnails',
            tags: ['thumbnails'],
          },
        }
      )
      .get(
        '/:id',
        async (context) => {
          const { handleResult, di, params } = context as typeof context &
            AppContext & { params: ThumbnailParamsType };
          const useCase = di.getThumbnailsUseCase();
          return handleResult(await useCase.getThumbnailById(params.id));
        },
        {
          params: ThumbnailParamsSchema,
          detail: {
            summary: 'Get thumbnail',
            description: 'Get a thumbnail by ID',
            tags: ['thumbnails'],
          },
        }
      )
      .delete(
        '/:id',
        async (context) => {
          const { handleResult, di, params } = context as typeof context &
            AppContext & { params: ThumbnailParamsType };
          const useCase = di.getThumbnailsUseCase();
          return handleResult(await useCase.deleteThumbnail(params.id));
        },
        {
          params: ThumbnailParamsSchema,
          detail: {
            summary: 'Delete thumbnail',
            description: 'Delete a thumbnail by ID',
            tags: ['thumbnails'],
          },
        }
      )
      // Catch-all 404 for /thumbnails/* routes
      .all('/*', () => {
        throw new NotFoundError('Route', '/thumbnails/*');
      })
  );

export { thumbnailsRoutes };
