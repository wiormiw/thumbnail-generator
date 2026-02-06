import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { ApiResponseSchema } from '../schema/common';
import {
  ThumbnailCreateSchema,
  ThumbnailParamsSchema,
  ThumbnailListQuerySchema,
  ThumbnailResponseSchema,
  ThumbnailListResponseSchema,
  DeleteResponseSchema,
} from '../schema/thumbnails';
import { NotFoundError } from '@/core/shared/errors';
import type { HonoEnv } from '../types/context';

const thumbnailsRoutes = new OpenAPIHono<HonoEnv>();

// POST /thumbnails - Generate thumbnail
const createThumbnailRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Thumbnails'],
  summary: 'Generate a thumbnail',
  description: 'Create a new thumbnail generation job from an image URL',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ThumbnailCreateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ApiResponseSchema(ThumbnailResponseSchema),
        },
      },
      description: 'Thumbnail created successfully',
    },
    400: {
      description: 'Bad request',
    },
    500: {
      description: 'Internal server error',
    },
  },
});

thumbnailsRoutes.openapi(createThumbnailRoute, async (c) => {
  const handleResult = c.get('handleResult');
  const deps = c.get('deps');
  const body = c.req.valid('json');

  const result = await handleResult(await deps.thumbnails.generateThumbnail(body));

  if (result instanceof Response) {
    return result;
  }

  return c.json(result);
});

// GET /thumbnails - List thumbnails
const listThumbnailsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['thumbnails'],
  summary: 'List thumbnails',
  description: 'Get a paginated list of thumbnails',
  request: {
    query: ThumbnailListQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ApiResponseSchema(ThumbnailListResponseSchema),
        },
      },
      description: 'List of thumbnails',
    },
    400: {
      description: 'Bad request',
    },
    500: {
      description: 'Internal server error',
    },
  },
});

thumbnailsRoutes.openapi(listThumbnailsRoute, async (c) => {
  const handleResult = c.get('handleResult');
  const deps = c.get('deps');
  const query = c.req.valid('query');

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 50;

  const result = await handleResult(await deps.thumbnails.listThumbnails(page, pageSize));

  if (result instanceof Response) {
    return result;
  }

  return c.json(result);
});

// GET /thumbnails/:id - Get thumbnail by ID
const getThumbnailRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['thumbnails'],
  summary: 'Get a thumbnail',
  description: 'Get a single thumbnail by ID',
  request: {
    params: ThumbnailParamsSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ApiResponseSchema(ThumbnailResponseSchema),
        },
      },
      description: 'Thumbnail details',
    },
    404: {
      description: 'Thumbnail not found',
    },
    500: {
      description: 'Internal server error',
    },
  },
});

thumbnailsRoutes.openapi(getThumbnailRoute, async (c) => {
  const handleResult = c.get('handleResult');
  const deps = c.get('deps');
  const params = c.req.valid('param');

  const result = await handleResult(await deps.thumbnails.getThumbnailById(params.id));

  if (result instanceof Response) {
    return result;
  }

  return c.json(result);
});

// DELETE /thumbnails/:id - Delete thumbnail
const deleteThumbnailRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['thumbnails'],
  summary: 'Delete a thumbnail',
  description: 'Delete a thumbnail by ID',
  request: {
    params: ThumbnailParamsSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ApiResponseSchema(DeleteResponseSchema),
        },
      },
      description: 'Thumbnail deleted successfully',
    },
    404: {
      description: 'Thumbnail not found',
    },
    500: {
      description: 'Internal server error',
    },
  },
});

thumbnailsRoutes.openapi(deleteThumbnailRoute, async (c) => {
  const handleResult = c.get('handleResult');
  const deps = c.get('deps');
  const params = c.req.valid('param');

  const result = await handleResult(await deps.thumbnails.deleteThumbnail(params.id));

  if (result instanceof Response) {
    return result;
  }

  return c.json(result);
});

// Catch-all 404 for /thumbnails/* routes
thumbnailsRoutes.all('/*', () => {
  throw new NotFoundError('Route', '/thumbnails/*');
});

export { thumbnailsRoutes };
