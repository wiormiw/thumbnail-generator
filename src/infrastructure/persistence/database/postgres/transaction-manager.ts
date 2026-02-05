import type { ITransactionManager, ILogger } from '@/core/ports';
import type { DrizzleDb, DbOrTx } from '@/core/types';
import { DatabaseError } from '@/core/shared/errors';

class TransactionManager implements ITransactionManager {
  constructor(
    private readonly db: () => DrizzleDb,
    private readonly logger: ILogger
  ) {}

  async runInTransaction<T>(
    callback: (
      db: DbOrTx
    ) => Promise<import('@/core/shared/result').Result<T, import('@/core/shared/errors').BaseError>>
  ): Promise<import('@/core/shared/result').Result<T, import('@/core/shared/errors').BaseError>> {
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
