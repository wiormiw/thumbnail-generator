import { BaseError } from './BaseError';

class EnvValidationError extends BaseError {
  constructor(message: string, detail?: Record<string, unknown>, isOperational = false) {
    super(500, message, detail, isOperational);
    this.name = 'EnvValidationError';
  }
}

export { EnvValidationError };
