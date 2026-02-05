import { BaseError } from './BaseError';

class EnvValidationError extends BaseError {
  constructor(message: string, detail?: Record<string, unknown>, isOperational = false) {
    super('EnvValidationError', 500, message, detail, isOperational);
  }
}

export { EnvValidationError };
