import { t, type Static } from 'elysia';

const HealthStatusSchema = t.Union([
  t.Literal('healthy'),
  t.Literal('degraded'),
  t.Literal('unhealthy'),
]);

const ServiceHealthSchema = t.Union([t.Literal('healthy'), t.Literal('unhealthy')]);

const HealthCheckResponseSchema = t.Object({
  status: HealthStatusSchema,
  timestamp: t.String(),
  services: t.Object({
    database: ServiceHealthSchema,
    cache: ServiceHealthSchema,
    storage: ServiceHealthSchema,
  }),
});

type HealthCheckResponseType = Static<typeof HealthCheckResponseSchema>;

export {
  HealthStatusSchema,
  ServiceHealthSchema,
  HealthCheckResponseSchema,
  type HealthCheckResponseType,
};
