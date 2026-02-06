import type { Result } from '@/core/shared/result';
import type { BaseError } from '@/core/shared/errors';
import type { ILogger, IThumbnailsRepository } from '@/core/ports';
import type { DbOrTx } from '@/infrastructure/adapters/database/types';
import type { Thumbnail, NewThumbnail, ThumbnailStatusUpdate } from '@/core/domain';
import type { ThumbnailStatus } from '@/core/types';
import { fromPromise } from '@/core/shared/result';
import { DatabaseError } from '@/core/shared/errors';
import {
  thumbnails,
  type Thumbnail as DrizzleThumbnail,
  type NewThumbnail as DrizzleNewThumbnail,
} from '@/infrastructure/adapters/database/drizzle/postgres/schemas';
import { eq, and, isNull, desc, count } from 'drizzle-orm';

class ThumbnailDrizzleRepository implements IThumbnailsRepository {
  readonly name = 'ThumbnailDrizzleRepository';

  constructor(
    private readonly db: () => DbOrTx,
    private readonly logger: ILogger
  ) {}

  async create(data: NewThumbnail, tx?: DbOrTx): Promise<Result<Thumbnail, BaseError>> {
    const db = tx ?? this.db();

    return fromPromise(
      async () => {
        const drizzleData: DrizzleNewThumbnail = {
          url: data.url,
          width: data.width ?? null,
          height: data.height ?? null,
          format: data.format ?? null,
          status: 'pending',
        };
        const results = await db.insert(thumbnails).values(drizzleData).returning();
        const result = results[0];
        if (!result) {
          throw new DatabaseError('Failed to create thumbnail - no result returned');
        }
        this.logger.info({ id: result.id }, 'Thumbnail created');
        return this.toDomain(result);
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
        return result[0] !== undefined ? this.toDomain(result[0]) : null;
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
        return result[0] !== undefined ? this.toDomain(result[0]) : null;
      },
      (error) => {
        this.logger.error({ jobId, error }, 'Failed to find thumbnail by job id');
        return new DatabaseError('Failed to find thumbnail', { error });
      }
    );
  }

  async findAll(
    tx?: DbOrTx,
    page: number = 1,
    pageSize: number = 50
  ): Promise<Result<Thumbnail[], BaseError>> {
    const db = tx ?? this.db();

    return fromPromise(
      async () => {
        const offset = (page - 1) * pageSize;
        const results = await db
          .select()
          .from(thumbnails)
          .where(isNull(thumbnails.deletedAt))
          .orderBy(desc(thumbnails.createdAt))
          .limit(pageSize)
          .offset(offset);
        return this.toDomainList(results);
      },
      (error) => {
        this.logger.error({ error, page, pageSize }, 'Failed to list thumbnails');
        return new DatabaseError('Failed to list thumbnails', { error });
      }
    );
  }

  async count(tx?: DbOrTx): Promise<Result<number, BaseError>> {
    const db = tx ?? this.db();

    return fromPromise(
      async () => {
        const result = await db
          .select({ value: count() })
          .from(thumbnails)
          .where(isNull(thumbnails.deletedAt));
        return result[0]?.value ?? 0;
      },
      (error) => {
        this.logger.error({ error }, 'Failed to count thumbnails');
        return new DatabaseError('Failed to count thumbnails', { error });
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
        const results = await db
          .select()
          .from(thumbnails)
          .where(and(eq(thumbnails.status, status), isNull(thumbnails.deletedAt)))
          .orderBy(desc(thumbnails.createdAt));
        return this.toDomainList(results);
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
    updates?: ThumbnailStatusUpdate,
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
        return this.toDomain(result);
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

  private toDomain(model: DrizzleThumbnail): Thumbnail {
    return {
      id: model.id,
      url: model.url,
      originalPath: model.originalPath,
      thumbnailPath: model.thumbnailPath,
      width: model.width,
      height: model.height,
      format: model.format as Thumbnail['format'],
      status: model.status as ThumbnailStatus,
      errorMessage: model.errorMessage,
      jobId: model.jobId,
      retryCount: model.retryCount,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt,
    };
  }

  private toDomainList(models: DrizzleThumbnail[]): Thumbnail[] {
    return models.map((model) => ({
      id: model.id,
      url: model.url,
      originalPath: model.originalPath,
      thumbnailPath: model.thumbnailPath,
      width: model.width,
      height: model.height,
      format: model.format as Thumbnail['format'],
      status: model.status as ThumbnailStatus,
      errorMessage: model.errorMessage,
      jobId: model.jobId,
      retryCount: model.retryCount,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt,
    }));
  }
}

export { ThumbnailDrizzleRepository };
