import { t, type TSchema } from 'elysia';

const SuccessResponseSchema = <T extends TSchema>(data: T) =>
  t.Object({
    success: t.Literal(true),
    requestId: t.String(),
    data,
  });

const ErrorResponseSchema = t.Object({
  success: t.Literal(false),
  requestId: t.String(),
  error: t.Object({
    message: t.String(),
    code: t.Optional(t.String()),
  }),
});

export { SuccessResponseSchema, ErrorResponseSchema };
