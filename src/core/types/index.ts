import type { SQL, TransactionSQL } from 'bun';

export type DbOrTx = SQL | TransactionSQL;

export * from './enums';
