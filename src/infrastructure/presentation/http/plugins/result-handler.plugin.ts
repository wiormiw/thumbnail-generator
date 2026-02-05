import { Elysia } from 'elysia';
import type { Result } from '@/core/shared/result';
import type { BaseError } from '@/core/shared/errors';

export const resultHandlerPlugin = new Elysia({ name: 'plugin:result-handler' }).derive(
  (context) => {
    const requestId =
      'requestId' in context ? (context as { requestId: string }).requestId : crypto.randomUUID();

    return {
      handleResult: <T>(result: Result<T, BaseError>) => {
        if (result.isOk()) {
          return {
            success: true as const,
            requestId,
            data: result.unwrap(),
          };
        }
        throw result.unwrapErr();
      },
    };
  }
);
