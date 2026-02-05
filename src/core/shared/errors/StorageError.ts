import { BaseError } from './BaseError';

class StorageError extends BaseError {
  constructor(message: string, detail?: Record<string, unknown>, isOperational = true) {
    super('StorageError', 500, message, detail, isOperational);
  }
}

export { StorageError };
