import { Elysia } from 'elysia';
import { getLogger } from '@/config';
import {
  BaseError,
  DatabaseError,
  CacheError,
  StorageError,
  LoggerError,
  EnvValidationError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
} from '@/core/shared/errors';

// Pre-defined error response shapes for inline caching
interface ErrorResponse {
  success: false;
  requestId: string;
  error: {
    name: string;
    message: string;
    detail?: unknown;
  };
}

// Factory to avoid repeated object literal allocations
const createErrorResponse = (
  requestId: string,
  name: string,
  message: string,
  detail?: unknown
): ErrorResponse => ({
  success: false,
  requestId,
  error: {
    name,
    message,
    ...(detail !== undefined && { detail }),
  },
});

type ErrorHandlerContext = {
  code: string;
  error: Error | unknown;
  set: {
    status: number | string;
  };
  requestId: string;
};

const errorHandlerPlugin = new Elysia({ name: 'plugin:error-handler' })
  .error({
    BaseError,
    DatabaseError,
    CacheError,
    StorageError,
    LoggerError,
    EnvValidationError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    ValidationError,
    RateLimitError,
  })
  .onError((context) => {
    const ctx = context as unknown as ErrorHandlerContext;
    const logger = getLogger();

    // Use instanceof check directly (faster than switch for hot path)
    if (ctx.error instanceof BaseError) {
      const statusCode = ctx.error.getStatusCode();

      logger.error(
        {
          requestId: ctx.requestId,
          errorType: ctx.error.constructor.name,
          message: ctx.error.message,
          statusCode,
          detail: ctx.error.getDetail(),
        },
        'Request error occurred'
      );

      ctx.set.status = statusCode;

      return createErrorResponse(
        ctx.requestId,
        ctx.error.constructor.name,
        ctx.error.message,
        ctx.error.getDetail()
      );
    }

    // Handle Elysia validation errors (use if-else instead of switch for better optimization)
    if (ctx.code === 'VALIDATION') {
      ctx.set.status = 400;
      logger.warn({ requestId: ctx.requestId, error: ctx.error }, 'Validation error');
      return createErrorResponse(
        ctx.requestId,
        'ValidationError',
        'Request validation failed',
        ctx.error
      );
    }

    if (ctx.code === 'NOT_FOUND') {
      ctx.set.status = 404;
      return createErrorResponse(ctx.requestId, 'NotFoundError', 'Resource not found');
    }

    if (ctx.code === 'INTERNAL_SERVER_ERROR') {
      ctx.set.status = 500;
      logger.error({ requestId: ctx.requestId, error: ctx.error }, 'Internal server error');
      return createErrorResponse(
        ctx.requestId,
        'InternalServerError',
        'An unexpected error occurred'
      );
    }

    // Default case
    ctx.set.status = 500;
    logger.error({ requestId: ctx.requestId, error: ctx.error, code: ctx.code }, 'Unknown error');
    return createErrorResponse(ctx.requestId, 'UnknownError', 'An unexpected error occurred');
  });

export { errorHandlerPlugin };
