import { z } from 'zod';
import { EnvValidationError } from '@/core/shared/errors';

const EnvSchema = z.object({
  // Application environment
  NODE_ENV: z.enum(['development', 'production', 'test']),
  LOG_LEVEL: z.string().default('info'),
  PORT: z.coerce.number().default(3000),

  // Database configuration
  DATABASE_URL: z.url().default('postgres://user:password@localhost:5432/dbname'),
  DATABASE_MAX_CONNECTIONS: z.coerce.number().default(20),
  DATABASE_IDLE_TIMEOUT: z.coerce.number().default(30), // in seconds
  DATABASE_MAX_LIFETIME: z.coerce.number().default(0), // in seconds, 0 means unlimited
  DATABASE_CONNECT_TIMEOUT: z.coerce.number().default(30), // in seconds
  DATABASE_SSL: z.coerce.boolean().default(false),

  // Cache configuration
  CACHE_URL: z.url().default('redis://localhost:6379'),
  CACHE_CONNECTION_TIMEOUT: z.coerce.number().default(10000), // in milliseconds,
  CACHE_IDLE_TIMEOUT: z.coerce.number().default(30000), // in milliseconds
  CACHE_AUTO_RECONNECT: z.coerce.boolean().default(true),
  CACHE_MAX_RETRIES: z.coerce.number().default(10),
  CACHE_ENABLE_OFFLINE_QUEUE: z.coerce.boolean().default(true),
  CACHE_ENABLE_AUTO_PIPELINING: z.coerce.boolean().default(true),
  CACHE_SSL: z.coerce.boolean().default(false),

  // Storage configuration
  STORAGE_ENDPOINT: z.string().default('http://localhost:9000'),
  STORAGE_ACCESS_KEY_ID: z.string().default('minioadmin'),
  STORAGE_SECRET_ACCESS_KEY: z.string().default('minioadmin'),
  STORAGE_BUCKET_NAME: z.string().default('bucket'),
});

type Env = z.infer<typeof EnvSchema>;

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new EnvValidationError('Invalid environment variables', {
    errors: z.treeifyError(parsedEnv.error),
  });
}

const env: Env = parsedEnv.data;

function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

function isTest(): boolean {
  return env.NODE_ENV === 'test';
}

export { env, type Env, isDevelopment, isProduction, isTest };
