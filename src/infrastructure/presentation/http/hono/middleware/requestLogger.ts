import type { MiddlewareHandler } from 'hono';
import type { HonoEnv } from '../types/context';
import type { ILogger } from '@/core';

export const requestLogger = (logger: ILogger): MiddlewareHandler<HonoEnv> => {
  return async (c, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;

    logger.info(
      {
        requestId: c.get('requestId'),
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        latency: ms,
      },
      'request'
    );
  };
};
