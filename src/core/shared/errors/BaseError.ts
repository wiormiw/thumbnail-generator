import { isDevelopment } from '@/config/env';

class BaseError extends Error {
  declare readonly name: string;
  private readonly statusCode: number;
  private readonly isOperational: boolean;
  private readonly detail?: Record<string, unknown>;

  constructor(
    name: string,
    statusCode: number,
    message: string,
    detail?: Record<string, unknown>,
    isOperational = true,
    stack = ''
  ) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.detail = detail;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public getStatusCode(): number {
    return this.statusCode;
  }

  public IsOperationalError(): boolean {
    return this.isOperational;
  }

  public getDetail(): Record<string, unknown> | undefined {
    return this.detail;
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      detail: this.detail,
      ...(isDevelopment() && this.stack && { stack: this.stack }),
    };
  }
}

export { BaseError };
