import { BaseError } from './BaseError';

class DatabaseError extends BaseError {
  constructor(message: string, detail?: Record<string, unknown>, isOperational = true) {
    super(500, message, detail, isOperational);
    this.name = 'DatabaseError';
  }
}

export { DatabaseError };
