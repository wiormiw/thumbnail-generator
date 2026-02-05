import pino, { type Logger, type LoggerOptions } from 'pino';
import { env, isDevelopment, isTest } from '@/config/env';
import { BaseError } from '@/core/errors/BaseError';

let logger: Logger | null = null;

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

function getBaseConfig(): LoggerOptions {
  return {
    level: env.LOG_LEVEL as LogLevel,
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: {
      err: pino.stdSerializers.err,
      error: (error: unknown) => {
        if (error instanceof BaseError) {
          return error.toJSON();
        }
        if (error instanceof Error) {
          return {
            name: error.constructor.name,
            message: error.message,
            ...(isDevelopment() && error.stack && { stack: error.stack }),
          };
        }
        return { error };
      },
    },
  };
}

function getDevelopmentConfig(): LoggerOptions {
  return {
    ...getBaseConfig(),
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    },
  };
}

function getProductionConfig(): LoggerOptions {
  return {
    ...getBaseConfig(),
  };
}

function getLogger(): Logger {
  if (!logger) {
    throw new Error('Logger has not been initialized.');
  }
  return logger;
}

function initLogger(options?: LoggerOptions): Logger {
  if (logger) return logger;

  const baseConfig = isDevelopment() ? getDevelopmentConfig() : getProductionConfig();

  const finalConfig = { ...baseConfig, ...options };

  logger = pino(finalConfig);

  if (!isTest()) {
    logger.info({ level: env.LOG_LEVEL, env: env.NODE_ENV }, 'Logger initialized');
  }

  return logger;
}

function closeLogger(): void {
  if (logger) {
    logger.info('Logger shutdown');
    logger = null;
  }
}

function withContext<T extends Record<string, unknown>>(context: T): Logger {
  const base = getLogger();
  return base.child(context);
}

type ModuleContext = { module: string };

function createModuleLogger(module: string): Logger {
  return withContext<ModuleContext>({ module });
}

export { getLogger, initLogger, closeLogger, withContext, createModuleLogger };

export type { Logger, LogLevel };
