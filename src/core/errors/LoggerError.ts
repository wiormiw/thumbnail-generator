import { BaseError } from '@/core/errors/BaseError';

class LoggerError extends BaseError {
  constructor(message: string, detail?: Record<string, unknown>, isOperational = true) {
    super(500, message, detail, isOperational);
    this.name = 'LoggerError';
  }
}

export { LoggerError };
