import { Elysia } from 'elysia';
import { sql } from 'drizzle-orm';
import { getDatabaseClient, getCacheClient, getStorageClient } from '@/config';
import { HealthCheckResponseSchema, type HealthCheckResponseType } from '../schema';

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

const healthRoutes = new Elysia({ name: 'routes:health' }).group('/health', (app) =>
  app.get(
    '/',
    async ({ status }) => {
      const checks: HealthCheckResponseType = {
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

      return status(checks.status === 'healthy' ? 200 : 503, checks);
    },
    {
      response: {
        200: HealthCheckResponseSchema,
        503: HealthCheckResponseSchema,
      },
      detail: {
        summary: 'Health check',
        description: 'Check the health of the service and its dependencies',
        tags: ['health'],
      },
    }
  )
);

export { healthRoutes };
