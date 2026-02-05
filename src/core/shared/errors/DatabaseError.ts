import { BaseError } from './BaseError';

class DatabaseError extends BaseError {
  constructor(message: string, detail?: Record<string, unknown>, isOperational = true) {
    super('DatabaseError', 500, message, detail, isOperational);
  }
}

export { DatabaseError };
