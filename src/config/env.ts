import { z, preprocess } from 'zod';
import { toBoolean } from '@/core/shared/utils';
import { EnvValidationError } from '@/core/shared/errors';

const booleanPreprocess = preprocess(toBoolean, z.boolean());

const EnvSchema = z.object({
  // Application environment
  NODE_ENV: z.enum(['development', 'production', 'test']),
  LOG_LEVEL: z.string().default('info'),
  PORT: z.coerce.number().default(3000),

  // Database configuration
  DATABASE_URL: z.string().url().default('postgres://user:password@localhost:5432/dbname'),
  DATABASE_MAX_CONNECTIONS: z.coerce.number().default(20),
  DATABASE_IDLE_TIMEOUT: z.coerce.number().default(30), // in seconds
  DATABASE_MAX_LIFETIME: z.coerce.number().default(0), // in seconds, 0 means unlimited
  DATABASE_CONNECTION_TIMEOUT: z.coerce.number().default(30), // in seconds
  DATABASE_SSL: booleanPreprocess.default(false),

  // Cache configuration
  CACHE_URL: z.string().url().default('redis://localhost:6379'),
  CACHE_CONNECTION_TIMEOUT: z.coerce.number().default(10000), // in milliseconds,
  CACHE_IDLE_TIMEOUT: z.coerce.number().default(30000), // in milliseconds
  CACHE_AUTO_RECONNECT: booleanPreprocess.default(true),
  CACHE_MAX_RETRIES: z.coerce.number().default(10),
  CACHE_ENABLE_OFFLINE_QUEUE: booleanPreprocess.default(true),
  CACHE_ENABLE_AUTO_PIPELINING: booleanPreprocess.default(true),
  CACHE_SSL: booleanPreprocess.default(false),

  // Storage configuration
  STORAGE_ENDPOINT: z.string().default('http://localhost:9000'),
  STORAGE_ACCESS_KEY_ID: z.string().default('minioadmin'),
  STORAGE_SECRET_ACCESS_KEY: z.string().default('minioadmin'),
  STORAGE_BUCKET_NAME: z.string().default('bucket'),

  // CORS configuration
  CORS_ORIGIN: z.string().default('*'),
  CORS_ALLOW_METHODS: z.string().default('GET,POST,PUT,DELETE,OPTIONS'),
  CORS_ALLOW_HEADERS: z.string().default('Content-Type,Authorization,X-Request-ID,Accept-Language'),
  CORS_EXPOSE_HEADERS: z
    .string()
    .default('Content-Type,Authorization,X-Request-ID,Accept-Language'),
  CORS_MAX_AGE: z.coerce.number().default(86400), // 24 hours
  CORS_CREDENTIALS: booleanPreprocess.default(true),
});

type Env = z.infer<typeof EnvSchema>;

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new EnvValidationError('Invalid environment variables', {
    errors: parsedEnv.error.errors,
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
