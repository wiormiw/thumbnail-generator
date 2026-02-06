import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';
import { env } from './env';
import { createModuleLogger } from './logger';
import { DatabaseError } from '@/core/shared/errors';
import * as schema from '@/infrastructure/adapters/database/drizzle/postgres/schemas';
import { sql } from 'drizzle-orm';
import type { DrizzleDb } from '@/infrastructure/adapters/database/drizzle/types';

const logger = createModuleLogger('Database');

let drizzleDb: DrizzleDb | null = null;
let sqlClient: SQL | null = null;

function getDatabaseClient(): DrizzleDb {
  if (!drizzleDb) {
    throw new DatabaseError('Database client has not been initialized');
  }
  return drizzleDb;
}

const initDatabaseClient = async () => {
  if (drizzleDb) return;

  sqlClient = new SQL({
    url: env.DATABASE_URL,
    max: env.DATABASE_MAX_CONNECTIONS,
    idleTimeout: env.DATABASE_IDLE_TIMEOUT,
    maxLifetime: env.DATABASE_MAX_LIFETIME,
    connectionTimeout: env.DATABASE_CONNECTION_TIMEOUT,
    ssl: env.DATABASE_SSL,
  });

  drizzleDb = drizzle(sqlClient, {
    schema,
    logger: env.NODE_ENV === 'development',
  });

  try {
    await sqlClient.connect();
    await drizzleDb.execute(sql`SELECT 1`);
    logger.info('Drizzle ORM initialized');
  } catch (error) {
    logger.error({ error }, 'Database connection test failed');
    throw new DatabaseError('Failed to connect to database', { error });
  }
};

const closeDatabaseClient = async () => {
  if (sqlClient) {
    await sqlClient.close();
    drizzleDb = null;
    sqlClient = null;
    logger.info('Database connection pool closed');
  }
};

export { getDatabaseClient, initDatabaseClient, closeDatabaseClient };
