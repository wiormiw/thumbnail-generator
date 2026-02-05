import { t, type Static } from 'elysia';

const ThumbnailCreateSchema = t.Object({
  url: t.String(),
  width: t.Optional(t.Integer({ minimum: 1, maximum: 4096 })),
  height: t.Optional(t.Integer({ minimum: 1, maximum: 4096 })),
  format: t.Optional(t.Union([t.Literal('png'), t.Literal('jpg'), t.Literal('webp')])),
});

const ThumbnailParamsSchema = t.Object({
  id: t.String(),
});

const ThumbnailResponseSchema = t.Object({
  id: t.String(),
  url: t.String(),
  originalPath: t.Optional(t.String()),
  thumbnailPath: t.Optional(t.String()),
  width: t.Optional(t.Integer()),
  height: t.Optional(t.Integer()),
  format: t.Union([t.Literal('png'), t.Literal('jpg'), t.Literal('webp')]),
  status: t.Union([
    t.Literal('pending'),
    t.Literal('processing'),
    t.Literal('completed'),
    t.Literal('failed'),
  ]),
  errorMessage: t.Optional(t.String()),
  jobId: t.Optional(t.String()),
  retryCount: t.Integer(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

const ThumbnailListResponseSchema = t.Object({
  items: t.Array(ThumbnailResponseSchema),
  total: t.Integer(),
});

type ThumbnailParamsType = Static<typeof ThumbnailParamsSchema>;

export {
  ThumbnailCreateSchema,
  ThumbnailParamsSchema,
  ThumbnailResponseSchema,
  ThumbnailListResponseSchema,
  type ThumbnailParamsType,
};
