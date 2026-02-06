import { drizzle } from 'drizzle-orm/bun-sql';
import * as schema from '../postgres/schemas';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;
type DrizzleTx = Parameters<Parameters<DrizzleDb['transaction']>[0]>[0];

export type { DrizzleDb, DrizzleTx };
