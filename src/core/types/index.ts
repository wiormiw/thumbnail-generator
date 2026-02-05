import { drizzle } from 'drizzle-orm/bun-sql';
import * as schema from '@/infrastructure/persistence/database/drizzle/postgres/schemas';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;
type DrizzleTx = Parameters<Parameters<DrizzleDb['transaction']>[0]>[0];
type DbOrTx = DrizzleDb | DrizzleTx;
export type { DrizzleDb, DrizzleTx, DbOrTx };

export * from './enums';
