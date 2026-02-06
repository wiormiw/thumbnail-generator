import { cors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';
import type { HonoEnv } from '../types/context';
import { env } from '@/config/env';

export const corsMiddleware = (): MiddlewareHandler<HonoEnv> => {
  return cors({
    origin: env.CORS_ORIGIN as string,
    allowMethods: env.CORS_ALLOW_METHODS.split(',') as string[],
    allowHeaders: env.CORS_ALLOW_HEADERS.split(',') as string[],
    exposeHeaders: env.CORS_EXPOSE_HEADERS.split(',') as string[],
    maxAge: env.CORS_MAX_AGE,
    credentials: env.CORS_CREDENTIALS,
  });
};
