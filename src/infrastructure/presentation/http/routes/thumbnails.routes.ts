import { Elysia, t } from 'elysia';
import { resultHandlerPlugin } from '../plugins/result-handler.plugin';
import { diPlugin } from '../plugins/di.plugin';
import type { ThumbnailsUseCase } from '@/application/thumbnails';
import type { ResultHandler } from '../plugins/result-handler.plugin';

interface GenerateThumbnailBody {
  url: string;
  width?: number;
  height?: number;
  format?: 'png' | 'jpg' | 'webp';
}

interface GetByIdParams {
  id: string;
}

// Combined context type for route handlers
type RouteContext = {
  useCase: ThumbnailsUseCase;
  requestId: string;
  handleAsyncResult: ResultHandler['handleAsyncResult'];
};

const thumbnailsRoutes = new Elysia({ prefix: '/thumbnails' })
  .use(diPlugin)
  .use(resultHandlerPlugin)
  .post(
    '/',
    async (context) => {
      const ctx = context as unknown as RouteContext & { body: GenerateThumbnailBody };
      return ctx.handleAsyncResult(ctx.useCase.generateThumbnail(ctx.body), ctx.requestId);
    },
    {
      body: t.Object({
        url: t.String(),
        width: t.Optional(t.Integer({ minimum: 1, maximum: 4096 })),
        height: t.Optional(t.Integer({ minimum: 1, maximum: 4096 })),
        format: t.Optional(t.Union([t.Literal('png'), t.Literal('jpg'), t.Literal('webp')])),
      }),
      detail: {
        summary: 'Generate thumbnail',
        description: 'Generate a thumbnail from a URL',
        tags: ['thumbnails'],
      },
    }
  )
  .get(
    '/:id',
    async (context) => {
      const ctx = context as unknown as RouteContext & { params: GetByIdParams };
      return ctx.handleAsyncResult(ctx.useCase.getThumbnailById(ctx.params.id), ctx.requestId);
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: 'Get thumbnail',
        description: 'Get a thumbnail by ID',
        tags: ['thumbnails'],
      },
    }
  )
  .get(
    '/',
    async (context) => {
      const ctx = context as unknown as RouteContext;
      return ctx.handleAsyncResult(ctx.useCase.listThumbnails(), ctx.requestId);
    },
    {
      detail: {
        summary: 'List thumbnails',
        description: 'List all thumbnails',
        tags: ['thumbnails'],
      },
    }
  )
  .delete(
    '/:id',
    async (context) => {
      const ctx = context as unknown as RouteContext & { params: GetByIdParams };
      return ctx.handleAsyncResult(ctx.useCase.deleteThumbnail(ctx.params.id), ctx.requestId);
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: 'Delete thumbnail',
        description: 'Delete a thumbnail by ID',
        tags: ['thumbnails'],
      },
    }
  );

export { thumbnailsRoutes };
