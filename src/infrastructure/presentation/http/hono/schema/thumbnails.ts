import { z } from '@hono/zod-openapi';
import { NullableString, NullableInteger } from './common';

export const ThumbnailCreateSchema = z.object({
  url: z.string().url().openapi({
    example: 'https://example.com/image.jpg',
    description: 'The URL of the image to generate a thumbnail from',
  }),
  width: z.number().int().min(1).max(4096).optional().openapi({
    example: 200,
    description: 'Thumbnail width in pixels',
  }),
  height: z.number().int().min(1).max(4096).optional().openapi({
    example: 200,
    description: 'Thumbnail height in pixels',
  }),
  format: z
    .union([z.literal('png'), z.literal('jpg'), z.literal('webp')])
    .optional()
    .openapi({
      example: 'jpg',
      description: 'Output image format',
    }),
});

export const ThumbnailParamsSchema = z.object({
  id: z.string().openapi({
    param: {
      name: 'id',
      in: 'path',
    },
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Thumbnail ID',
  }),
});

export const StatusLiteral = z
  .union([
    z.literal('pending'),
    z.literal('processing'),
    z.literal('completed'),
    z.literal('failed'),
  ])
  .openapi({
    example: 'completed',
    description: 'Thumbnail processing status',
  });

export const FormatLiteral = z
  .union([z.literal('png'), z.literal('jpg'), z.literal('webp')])
  .openapi({
    example: 'jpg',
    description: 'Image format',
  });

export const ThumbnailResponseSchema = z
  .object({
    id: z.string().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
      description: 'Unique thumbnail identifier',
    }),
    url: z.string().url().openapi({
      example: 'https://example.com/image.jpg',
      description: 'Original image URL',
    }),
    originalPath: NullableString,
    thumbnailPath: NullableString,
    width: NullableInteger.openapi({ example: 200 }),
    height: NullableInteger.openapi({ example: 200 }),
    format: z.union([FormatLiteral, z.null()]),
    status: StatusLiteral,
    errorMessage: NullableString,
    jobId: NullableString.openapi({ example: 'job-123' }),
    retryCount: z.number().int().openapi({
      example: 0,
      description: 'Number of retry attempts',
    }),
    createdAt: z.string().openapi({
      example: '2024-01-01T00:00:00.000Z',
      description: 'Creation timestamp',
    }),
    updatedAt: z.string().openapi({
      example: '2024-01-01T00:00:00.000Z',
      description: 'Last update timestamp',
    }),
  })
  .openapi('Thumbnail');

export const ThumbnailListResponseSchema = z
  .object({
    items: z.array(ThumbnailResponseSchema),
    total: z.number().int().openapi({ example: 100 }),
    page: z.number().int().openapi({ example: 1 }),
    pageSize: z.number().int().openapi({ example: 50 }),
  })
  .openapi('ThumbnailList');

export const ThumbnailListQuerySchema = z.object({
  page: z.number().int().min(1).optional().openapi({
    example: 1,
    description: 'Page number',
  }),
  pageSize: z.number().int().min(1).max(100).optional().openapi({
    example: 50,
    description: 'Items per page (max 100)',
  }),
});

export const DeleteResponseSchema = z.object({
  message: z.string().openapi({ example: 'Thumbnail deleted successfully' }),
});
