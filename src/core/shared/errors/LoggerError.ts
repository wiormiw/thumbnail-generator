import { BaseError } from './BaseError';

class LoggerError extends BaseError {
  constructor(message: string, detail?: Record<string, unknown>, isOperational = true) {
    super('LoggerError', 500, message, detail, isOperational);
  }
}

export { LoggerError };
