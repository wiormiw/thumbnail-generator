import { BaseError } from '../BaseError';

class BadRequestError extends BaseError {
  constructor(message: string, detail?: Record<string, unknown>) {
    super('BadRequestError', 400, message, detail, true);
  }
}

class UnauthorizedError extends BaseError {
  constructor(message: string = 'Authentication required', detail?: Record<string, unknown>) {
    super('UnauthorizedError', 401, message, detail, true);
  }
}

class ForbiddenError extends BaseError {
  constructor(message: string = 'Insufficient permissions', detail?: Record<string, unknown>) {
    super('ForbiddenError', 403, message, detail, true);
  }
}

class NotFoundError extends BaseError {
  constructor(resource: string, identifier?: string) {
    const message =
      identifier !== undefined
        ? `${resource} with identifier '${identifier}' not found`
        : `${resource} not found`;
    super('NotFoundError', 404, message, { resource, identifier }, true);
  }
}

class ConflictError extends BaseError {
  constructor(message: string, detail?: Record<string, unknown>) {
    super('ConflictError', 409, message, detail, true);
  }
}

class ValidationError extends BaseError {
  constructor(message: string, detail?: Record<string, unknown>) {
    super('ValidationError', 422, message, detail, true);
  }
}

class RateLimitError extends BaseError {
  constructor(retryAfter?: number) {
    super('RateLimitError', 429, 'Rate limit exceeded', { retryAfter }, true);
  }
}

export {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
};
