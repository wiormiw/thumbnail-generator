import type { ITransactionManager, ILogger } from '@/core/ports';
import type { DbOrTx } from '@/core/types';
import { DatabaseError } from '@/core/shared/errors';

class TransactionManager implements ITransactionManager {
  constructor(
    private readonly db: () => DbOrTx,
    private readonly logger: ILogger
  ) {}

  async runInTransaction<T>(
    callback: (
      db: DbOrTx
    ) => Promise<import('@/core/shared/result').Result<T, import('@/core/shared/errors').BaseError>>
  ): Promise<import('@/core/shared/result').Result<T, import('@/core/shared/errors').BaseError>> {
    const db = this.db();

    try {
      const result = await (db as DbOrTx & {
        transaction: <R>(callback: (tx: DbOrTx) => Promise<R>) => Promise<R>;
      }).transaction(async (tx: DbOrTx) => {
        return callback(tx);
      });

      return result;
    } catch (error) {
      if (error instanceof DatabaseError) {
        this.logger.error({ error }, 'Transaction failed');
        throw error;
      }

      this.logger.error({ error }, 'Unexpected transaction error');
      throw new DatabaseError('Transaction failed', { originalError: error });
    }
  }
}

export { TransactionManager };
