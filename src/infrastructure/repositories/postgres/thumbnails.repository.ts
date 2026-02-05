import type { Result } from '@/core/shared/result';
import type { BaseError } from '@/core/shared/errors';
import type { ILogger, IThumbnailsRepository } from '@/core/ports';
import type { DbOrTx } from '@/core/types';
import type { ThumbnailStatus } from '@/core/types';
import { fromPromise } from '@/core/shared/result';
import { DatabaseError } from '@/core/shared/errors';
import {
  thumbnails,
  type Thumbnail,
  type NewThumbnail,
} from '@/infrastructure/persistence/database/drizzle/postgres/schemas';
import { eq, and, isNull, desc } from 'drizzle-orm';

class ThumbnailsRepository implements IThumbnailsRepository {
  readonly name = 'ThumbnailsRepository';

  constructor(
    private readonly db: () => DbOrTx,
    private readonly logger: ILogger
  ) {}

  async create(data: NewThumbnail, tx?: DbOrTx): Promise<Result<Thumbnail, BaseError>> {
    const db = tx ?? this.db();

    return fromPromise(
      async () => {
        const results = await db.insert(thumbnails).values(data).returning();
        const result = results[0];
        if (!result) {
          throw new DatabaseError('Failed to create thumbnail - no result returned');
        }
        this.logger.info({ id: result.id }, 'Thumbnail created');
        return result;
      },
      (error) => {
        this.logger.error({ error }, 'Failed to create thumbnail');
        return new DatabaseError('Failed to create thumbnail', { error });
      }
    );
  }

  async findById(id: string, tx?: DbOrTx): Promise<Result<Thumbnail | null, BaseError>> {
    const db = tx ?? this.db();

    return fromPromise(
      async () => {
        const result = await db
          .select()
          .from(thumbnails)
          .where(and(eq(thumbnails.id, id), isNull(thumbnails.deletedAt)))
          .limit(1);
        return result[0] !== undefined ? result[0] : null;
      },
      (error) => {
        this.logger.error({ id, error }, 'Failed to find thumbnail by id');
        return new DatabaseError('Failed to find thumbnail', { error });
      }
    );
  }

  async findByJobId(jobId: string, tx?: DbOrTx): Promise<Result<Thumbnail | null, BaseError>> {
    const db = tx ?? this.db();

    return fromPromise(
      async () => {
        const result = await db
          .select()
          .from(thumbnails)
          .where(and(eq(thumbnails.jobId, jobId), isNull(thumbnails.deletedAt)))
          .limit(1);
        return result[0] !== undefined ? result[0] : null;
      },
      (error) => {
        this.logger.error({ jobId, error }, 'Failed to find thumbnail by job id');
        return new DatabaseError('Failed to find thumbnail', { error });
      }
    );
  }

  async findAll(tx?: DbOrTx): Promise<Result<Thumbnail[], BaseError>> {
    const db = tx ?? this.db();

    return fromPromise(
      async () => {
        return db
          .select()
          .from(thumbnails)
          .where(isNull(thumbnails.deletedAt))
          .orderBy(desc(thumbnails.createdAt));
      },
      (error) => {
        this.logger.error({ error }, 'Failed to list thumbnails');
        return new DatabaseError('Failed to list thumbnails', { error });
      }
    );
  }

  async findByStatus(
    status: ThumbnailStatus,
    tx?: DbOrTx
  ): Promise<Result<Thumbnail[], BaseError>> {
    const db = tx ?? this.db();

    return fromPromise(
      async () => {
        return db
          .select()
          .from(thumbnails)
          .where(and(eq(thumbnails.status, status), isNull(thumbnails.deletedAt)))
          .orderBy(desc(thumbnails.createdAt));
      },
      (error) => {
        this.logger.error({ status, error }, 'Failed to find thumbnails by status');
        return new DatabaseError('Failed to find thumbnails', { error });
      }
    );
  }

  async updateStatus(
    id: string,
    status: ThumbnailStatus,
    updates?: Partial<Pick<Thumbnail, 'thumbnailPath' | 'errorMessage' | 'retryCount'>>,
    tx?: DbOrTx
  ): Promise<Result<Thumbnail, BaseError>> {
    const db = tx ?? this.db();

    return fromPromise(
      async () => {
        const now = new Date();
        const updateData: {
          status: ThumbnailStatus;
          updatedAt: Date;
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

        const results = await db
          .update(thumbnails)
          .set(updateData)
          .where(eq(thumbnails.id, id))
          .returning();

        const result = results[0];
        if (!result) {
          throw new DatabaseError(`Thumbnail not found: ${id}`);
        }

        this.logger.info({ id, status }, 'Thumbnail status updated');
        return result;
      },
      (error) => {
        this.logger.error({ id, status, error }, 'Failed to update thumbnail status');
        return new DatabaseError('Failed to update thumbnail status', { error });
      }
    );
  }

  async delete(id: string, tx?: DbOrTx): Promise<Result<void, BaseError>> {
    const db = tx ?? this.db();

    return fromPromise(
      async () => {
        await db.delete(thumbnails).where(eq(thumbnails.id, id));
        this.logger.info({ id }, 'Thumbnail deleted');
      },
      (error) => {
        this.logger.error({ id, error }, 'Failed to delete thumbnail');
        return new DatabaseError('Failed to delete thumbnail', { error });
      }
    );
  }

  async softDelete(id: string, tx?: DbOrTx): Promise<Result<boolean, BaseError>> {
    const db = tx ?? this.db();

    return fromPromise(
      async () => {
        const now = new Date();
        const result = await db
          .update(thumbnails)
          .set({ deletedAt: now, updatedAt: now })
          .where(eq(thumbnails.id, id))
          .returning({ id: thumbnails.id });
        const deleted = result.length > 0;
        this.logger.info({ id, deleted }, 'Thumbnail soft deleted');
        return deleted;
      },
      (error) => {
        this.logger.error({ id, error }, 'Failed to soft delete thumbnail');
        return new DatabaseError('Failed to soft delete thumbnail', { error });
      }
    );
  }
}

export { ThumbnailsRepository };
