import type { MiddlewareHandler } from 'hono';
import type { Result } from '@/core/shared/result';
import type { BaseError } from '@/core/shared/errors';
import type { HonoEnv, HonoVariables } from '../types/context';

// Result handler middleware - converts Result<T> to API response
export const resultHandlerMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const requestId = c.get('requestId');

  const handleResult: HonoVariables['handleResult'] = async <T>(result: Result<T, BaseError>) => {
    if (result.isOk()) {
      return {
        success: true as const,
        requestId,
        data: result.unwrap(),
      };
    }
    throw result.unwrapErr();
  };

  c.set('handleResult', handleResult);
  await next();
};
