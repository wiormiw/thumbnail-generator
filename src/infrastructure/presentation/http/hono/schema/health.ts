import { z } from '@hono/zod-openapi';

export const HealthStatusSchema = z
  .union([z.literal('healthy'), z.literal('degraded'), z.literal('unhealthy')])
  .openapi({
    example: 'healthy',
    description: 'Overall health status',
  });

export const ServiceHealthSchema = z.union([z.literal('healthy'), z.literal('unhealthy')]).openapi({
  example: 'healthy',
  description: 'Individual service health status',
});

export const HealthCheckResponseSchema = z
  .object({
    status: HealthStatusSchema,
    timestamp: z.string().openapi({
      example: '2024-01-01T00:00:00.000Z',
      description: 'ISO timestamp of health check',
    }),
    services: z.object({
      database: ServiceHealthSchema.openapi({ example: 'healthy' }),
      cache: ServiceHealthSchema.openapi({ example: 'healthy' }),
      storage: ServiceHealthSchema.openapi({ example: 'healthy' }),
    }),
  })
  .openapi('HealthCheck');
