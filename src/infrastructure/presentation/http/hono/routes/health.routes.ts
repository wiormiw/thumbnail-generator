import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { sql } from 'drizzle-orm';
import { getDatabaseClient, getCacheClient, getStorageClient } from '@/config';
import type { HonoEnv } from '../types/context';
import { HealthCheckResponseSchema } from '../schema/health';
import { ApiResponseSchema } from '../schema/common';

// Pre-computed health check functions to avoid IIFE creation on each request
const checkDatabase = async (): Promise<boolean> => {
  try {
    const db = getDatabaseClient();
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
};

const checkCache = async (): Promise<boolean> => {
  try {
    const client = getCacheClient();
    await client.ping();
    return true;
  } catch {
    return false;
  }
};

const checkStorage = async (): Promise<boolean> => {
  try {
    const client = getStorageClient();
    await client.file('health-check').exists();
    return true;
  } catch {
    return false;
  }
};

const healthRoutes = new OpenAPIHono<HonoEnv>();

const healthCheckRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['health'],
  summary: 'Health check',
  description: 'Check the health of the service and its dependencies',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ApiResponseSchema(HealthCheckResponseSchema),
        },
      },
      description: 'Service is healthy',
    },
    503: {
      content: {
        'application/json': {
          schema: ApiResponseSchema(HealthCheckResponseSchema),
        },
      },
      description: 'Service is degraded or unhealthy',
    },
  },
});

healthRoutes.openapi(healthCheckRoute, async (c) => {
  const requestId = c.get('requestId') as string;

  const checks = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unhealthy' as 'healthy' | 'unhealthy',
      cache: 'unhealthy' as 'healthy' | 'unhealthy',
      storage: 'unhealthy' as 'healthy' | 'unhealthy',
    },
  };

  // Check all services in parallel
  const [dbOk, cacheOk, storageOk] = await Promise.all([
    checkDatabase(),
    checkCache(),
    checkStorage(),
  ]);

  checks.services.database = dbOk ? 'healthy' : 'unhealthy';
  checks.services.cache = cacheOk ? 'healthy' : 'unhealthy';
  checks.services.storage = storageOk ? 'healthy' : 'unhealthy';

  checks.status = dbOk && cacheOk && storageOk ? 'healthy' : 'degraded';

  const statusCode = checks.status === 'healthy' ? 200 : 503;

  return c.json(
    {
      success: true,
      requestId,
      data: checks,
    },
    statusCode
  );
});

export { healthRoutes };
