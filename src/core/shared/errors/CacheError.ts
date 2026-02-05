import { BaseError } from './BaseError';

class CacheError extends BaseError {
  constructor(message: string, detail?: Record<string, unknown>, isOperational = true) {
    super('CacheError', 500, message, detail, isOperational);
  }
}

export { CacheError };
