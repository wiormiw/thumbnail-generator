import { BaseError } from './BaseError';

class CacheError extends BaseError {
  constructor(message: string, detail?: Record<string, unknown>, isOperational = true) {
    super(500, message, detail, isOperational);
    this.name = 'CacheError';
  }
}

export { CacheError };
