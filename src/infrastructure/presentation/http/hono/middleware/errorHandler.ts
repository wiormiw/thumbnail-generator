import type { MiddlewareHandler } from 'hono';
import { getLogger } from '@/config';
import { BaseError } from '@/core/shared/errors';
import type { HonoEnv } from '../types/context';

// Error response shape
interface ErrorResponse {
  success: false;
  requestId: string;
  error: {
    name: string;
    message: string;
    detail?: unknown;
  };
}

// Create error response factory
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

// Global error handler
export const errorHandler = (): MiddlewareHandler<HonoEnv> => {
  return async (c, next) => {
    try {
      await next();
    } catch (error) {
      const logger = getLogger();
      const requestId = c.get('requestId') ?? 'unknown';

      // BaseError from domain
      if (error instanceof BaseError) {
        const statusCode = error.getStatusCode();
        logger.error(
          {
            requestId,
            errorType: error.constructor.name,
            message: error.message,
            statusCode,
            detail: error.getDetail(),
          },
          'Request error'
        );
        return c.json(
          createErrorResponse(requestId, error.constructor.name, error.message, error.getDetail()),
          statusCode as never
        );
      }

      // Zod validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        logger.warn({ requestId, error }, 'Validation error');
        return c.json(
          createErrorResponse(requestId, 'ValidationError', 'Request validation failed', error),
          400
        );
      }

      // NotFoundError (404)
      if (error instanceof Error && error.name === 'NotFoundError') {
        return c.json(createErrorResponse(requestId, 'NotFoundError', 'Resource not found'), 404);
      }

      // Unknown errors
      logger.error({ requestId, error }, 'Unknown error');
      return c.json(
        createErrorResponse(requestId, 'UnknownError', 'An unexpected error occurred'),
        500
      );
    }
  };
};
