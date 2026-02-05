import { Elysia } from 'elysia';
import { getDatabaseClient, getCacheClient, getStorageClient } from '@/config';

const healthRoutes = new Elysia({ prefix: '/health' }).get(
  '/',
  async () => {
    const checks = {
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown' as 'healthy' | 'unhealthy',
        cache: 'unknown' as 'healthy' | 'unhealthy',
        storage: 'unknown' as 'healthy' | 'unhealthy',
      },
    };

    try {
      const db = await getDatabaseClient();
      await db`SELECT 1`.execute();
      checks.services.database = 'healthy';
    } catch {
      checks.services.database = 'unhealthy';
      checks.status = 'degraded';
    }

    try {
      await getCacheClient().ping();
      checks.services.cache = 'healthy';
    } catch {
      checks.services.cache = 'unhealthy';
      checks.status = 'degraded';
    }

    try {
      await getStorageClient().file('health-check').exists();
      checks.services.storage = 'healthy';
    } catch {
      checks.services.storage = 'unhealthy';
      checks.status = 'degraded';
    }

    const statusCode = checks.status === 'healthy' ? 200 : 503;

    return new Response(JSON.stringify(checks), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  },
  {
    detail: {
      summary: 'Health check',
      description: 'Check the health of the service and its dependencies',
      tags: ['health'],
    },
  }
);

export { healthRoutes };
