import { Elysia } from 'elysia';
import type { Result } from '@/core/shared/result';
import { BaseError } from '@/core/shared/errors';

// Pre-define response shape for inline caching (V8 hidden class optimization)
interface SuccessResponse<T> {
  success: true;
  requestId: string;
  data: T;
}

// Create handlers once to avoid function reallocation on each request
const handleResult = <T>(result: Result<T, BaseError>, requestId: string): SuccessResponse<T> => {
  if (result.isOk()) {
    // Use object literal with consistent property order for hidden class stability
    const response: SuccessResponse<T> = {
      success: true,
      requestId,
      data: result.unwrap(),
    };
    return response;
  }

  throw result.unwrapErr();
};

const handleAsyncResult = async <T>(
  result: Promise<Result<T, BaseError>>,
  requestId: string
): Promise<SuccessResponse<T>> => {
  const resolved = await result;

  if (resolved.isOk()) {
    const response: SuccessResponse<T> = {
      success: true,
      requestId,
      data: resolved.unwrap() as T,
    };
    return response;
  }

  throw resolved.unwrapErr();
};

type ResultHandler = {
  handleResult: typeof handleResult;
  handleAsyncResult: typeof handleAsyncResult;
};

const resultHandlerPlugin = new Elysia({ name: 'plugin:result-handler' }).derive(() => {
  return {
    handleResult,
    handleAsyncResult,
  } as ResultHandler;
});

export { type ResultHandler, resultHandlerPlugin };
