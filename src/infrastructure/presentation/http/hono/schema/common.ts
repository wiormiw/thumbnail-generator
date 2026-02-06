import { z } from '@hono/zod-openapi';

const NullableString = z.string().nullable().openapi({
  example: null,
});

const NullableInteger = z.number().int().nullable().openapi({
  example: null,
});

const ApiResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.literal(true).openapi({ example: true }),
    requestId: z.string().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    data,
  });

export { ApiResponseSchema, NullableString, NullableInteger };
