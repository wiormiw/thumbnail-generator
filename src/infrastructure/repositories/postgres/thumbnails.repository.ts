import type { Result } from '@/core/shared/result';
import type { BaseError } from '@/core/shared/errors';
import type { ILogger, IThumbnailsRepository } from '@/core/ports';
import type { DbOrTx, ThumbnailStatus } from '@/core/types';
import { ok, err } from '@/core/shared/result';
import { DatabaseError } from '@/core/shared/errors';
import {
  thumbnails,
  type Thumbnail,
  type NewThumbnail,
} from '@/infrastructure/persistence/database/postgres/schemas';
import { eq, and, isNull, desc } from 'drizzle-orm';

// Drizzle DB interface for type-safe database operations
type DrizzleDb = {
  insert: (table: typeof thumbnails) => {
    values: (data: NewThumbnail) => {
      returning: () => Promise<[Thumbnail]>;
    };
  };
  select: () => {
    from: (table: typeof thumbnails) => {
      where: (condition: unknown) => {
        limit: (n: number) => Promise<Thumbnail[]>;
        orderBy: (order: unknown) => Promise<Thumbnail[]>;
      };
    };
  };
  delete: (table: typeof thumbnails) => {
    where: (condition: ReturnType<typeof eq>) => Promise<number>;
  };
  update: (table: typeof thumbnails) => {
    set: (data: {
      status?: ThumbnailStatus;
      updatedAt: Date;
      deletedAt?: Date;
      thumbnailPath?: string | null;
      errorMessage?: string | null;
      retryCount?: number;
    }) => {
      where: (condition: ReturnType<typeof eq>) => {
        returning: () => Promise<[Thumbnail?]>;
      };
    };
  };
};

class ThumbnailsRepository implements IThumbnailsRepository {
  readonly name = 'ThumbnailsRepository';

  constructor(
    private readonly db: () => DbOrTx,
    private readonly logger: ILogger
  ) {}

  async create(data: NewThumbnail, tx?: DbOrTx): Promise<Result<Thumbnail, BaseError>> {
    const db = tx ?? this.db();

    try {
      const [result] = await (db as unknown as DrizzleDb)
        .insert(thumbnails)
        .values(data)
        .returning();

      this.logger.info({ id: result.id }, 'Thumbnail created');

      return ok(result);
    } catch (error) {
      this.logger.error({ error }, 'Failed to create thumbnail');
      return err(new DatabaseError('Failed to create thumbnail', { error }));
    }
  }

  async findById(id: string, tx?: DbOrTx): Promise<Result<Thumbnail | null, BaseError>> {
    const db = tx ?? this.db();

    try {
      const result = await (db as unknown as DrizzleDb)
        .select()
        .from(thumbnails)
        .where(and(eq(thumbnails.id, id), isNull(thumbnails.deletedAt)))
        .limit(1);

      return ok(result[0] !== undefined ? result[0] : null);
    } catch (error) {
      this.logger.error({ id, error }, 'Failed to find thumbnail by id');
      return err(new DatabaseError('Failed to find thumbnail', { error }));
    }
  }

  async findByJobId(jobId: string, tx?: DbOrTx): Promise<Result<Thumbnail | null, BaseError>> {
    const db = tx ?? this.db();

    try {
      const result = await (db as unknown as DrizzleDb)
        .select()
        .from(thumbnails)
        .where(and(eq(thumbnails.jobId, jobId), isNull(thumbnails.deletedAt)))
        .limit(1);

      return ok(result[0] !== undefined ? result[0] : null);
    } catch (error) {
      this.logger.error({ jobId, error }, 'Failed to find thumbnail by job id');
      return err(new DatabaseError('Failed to find thumbnail by job id', { error }));
    }
  }

  async findAll(tx?: DbOrTx): Promise<Result<Thumbnail[], BaseError>> {
    const db = tx ?? this.db();

    try {
      const results = await (db as unknown as DrizzleDb)
        .select()
        .from(thumbnails)
        .where(isNull(thumbnails.deletedAt))
        .orderBy(desc(thumbnails.createdAt));

      return ok(results);
    } catch (error) {
      this.logger.error({ error }, 'Failed to list thumbnails');
      return err(new DatabaseError('Failed to list thumbnails', { error }));
    }
  }

  async findByStatus(
    status: ThumbnailStatus,
    tx?: DbOrTx
  ): Promise<Result<Thumbnail[], BaseError>> {
    const db = tx ?? this.db();

    try {
      const results = await (db as unknown as DrizzleDb)
        .select()
        .from(thumbnails)
        .where(and(eq(thumbnails.status, status), isNull(thumbnails.deletedAt)))
        .orderBy(desc(thumbnails.createdAt));

      return ok(results);
    } catch (error) {
      this.logger.error({ status, error }, 'Failed to find thumbnails by status');
      return err(new DatabaseError('Failed to find thumbnails by status', { error }));
    }
  }

  async updateStatus(
    id: string,
    status: ThumbnailStatus,
    updates?: Partial<Pick<Thumbnail, 'thumbnailPath' | 'errorMessage' | 'retryCount'>>,
    tx?: DbOrTx
  ): Promise<Result<Thumbnail, BaseError>> {
    const db = tx ?? this.db();

    try {
      const now = new Date();
      const updateData: {
        status: ThumbnailStatus;
        updatedAt: Date;
        deletedAt?: Date;
        thumbnailPath?: string | null;
        errorMessage?: string | null;
        retryCount?: number;
      } = {
        status,
        updatedAt: now,
      };

      if (updates !== undefined) {
        if (updates.thumbnailPath !== undefined) updateData.thumbnailPath = updates.thumbnailPath;
        if (updates.errorMessage !== undefined) updateData.errorMessage = updates.errorMessage;
        if (updates.retryCount !== undefined) updateData.retryCount = updates.retryCount;
      }

      const [result] = await (db as unknown as DrizzleDb)
        .update(thumbnails)
        .set(updateData)
        .where(eq(thumbnails.id, id))
        .returning();

      if (!result) {
        return err(new DatabaseError(`Thumbnail not found: ${id}`));
      }

      this.logger.info({ id, status }, 'Thumbnail status updated');

      return ok(result);
    } catch (error) {
      this.logger.error({ id, status, error }, 'Failed to update thumbnail status');
      return err(new DatabaseError('Failed to update thumbnail status', { error }));
    }
  }

  async delete(id: string, tx?: DbOrTx): Promise<Result<void, BaseError>> {
    const db = tx ?? this.db();

    try {
      await (db as unknown as DrizzleDb).delete(thumbnails).where(eq(thumbnails.id, id));

      this.logger.info({ id }, 'Thumbnail deleted');

      return ok(undefined);
    } catch (error) {
      this.logger.error({ id, error }, 'Failed to delete thumbnail');
      return err(new DatabaseError('Failed to delete thumbnail', { error }));
    }
  }

  async softDelete(id: string, tx?: DbOrTx): Promise<Result<void, BaseError>> {
    const db = tx ?? this.db();

    try {
      const now = new Date();
      await (db as unknown as DrizzleDb)
        .update(thumbnails)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(thumbnails.id, id));

      this.logger.info({ id }, 'Thumbnail soft deleted');

      return ok(undefined);
    } catch (error) {
      this.logger.error({ id, error }, 'Failed to soft delete thumbnail');
      return err(new DatabaseError('Failed to soft delete thumbnail', { error }));
    }
  }
}

export { ThumbnailsRepository };
