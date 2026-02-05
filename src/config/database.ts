import { SQL } from 'bun';
import { env } from './env';
import { createModuleLogger } from './logger';
import { DatabaseError } from '@/core/errors';

const logger = createModuleLogger('Database');

let dbClient: SQL | null = null;

function getDatabaseClient(): SQL {
  if (!dbClient) {
    throw new DatabaseError('Database client has not been initialized');
  }
  return dbClient;
}

const initDatabaseClient = async () => {
  if (dbClient) return; // Idempotent check

  dbClient = new SQL({
    url: env.DATABASE_URL,
    max: env.DATABASE_MAX_CONNECTIONS,
    idleTimeout: env.DATABASE_IDLE_TIMEOUT,
    maxLifetime: env.DATABASE_MAX_LIFETIME,
    connectTimeout: env.DATABASE_CONNECT_TIMEOUT,
    ssl: env.DATABASE_SSL,
    onconnect: (client) => {
      logger.info({ client }, 'Database connected');
    },
    onclose: (client) => {
      logger.info({ client }, 'Database connection closed');
    },
  });

  await dbClient.connect();
};

const closeDatabaseClient = async () => {
  if (dbClient) {
    await dbClient.close();
    dbClient = null;
  }
};

export { getDatabaseClient, initDatabaseClient, closeDatabaseClient };
