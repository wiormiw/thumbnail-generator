import type { DrizzleDb, DrizzleTx } from '../drizzle/types';

// Union type for database or transaction
// Can be expanded with other ORM types in the future
type DbOrTx = DrizzleDb | DrizzleTx;

export type { DbOrTx };
