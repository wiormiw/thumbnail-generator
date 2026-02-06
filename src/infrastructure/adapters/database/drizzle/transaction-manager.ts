import type { ITransactionManager, ILogger } from '@/core/ports';
import type { DrizzleDb } from './types';
import type { Result } from '@/core/shared/result';
import type { BaseError } from '@/core/shared/errors';
import { DatabaseError } from '@/core/shared/errors';
import type { DbOrTx } from '@/infrastructure/adapters/database/types';

class TransactionManager implements ITransactionManager {
  constructor(
    private readonly db: () => DrizzleDb,
    private readonly logger: ILogger
  ) {}

  async runInTransaction<T>(
    callback: (db: DbOrTx) => Promise<Result<T, BaseError>>
  ): Promise<Result<T, BaseError>> {
    const db = this.db();

    try {
      // Use Drizzle's built-in transaction
      const result = await db.transaction(async (tx) => {
        return callback(tx);
      });

      return result;
    } catch (error) {
      this.logger.error({ error }, 'Transaction failed');
      throw new DatabaseError('Transaction failed', { originalError: error });
    }
  }
}

export { TransactionManager };
