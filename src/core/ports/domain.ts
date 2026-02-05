import type { Result } from '../shared/result';
import type { BaseError } from '../shared/errors';
import type { DbOrTx, ThumbnailStatus } from '../types';
import type {
  Thumbnail,
  NewThumbnail,
} from '@/infrastructure/persistence/database/postgres/schemas';

// Domain-specific repository interfaces
interface IThumbnailsRepository {
  readonly name: string;
  create(data: NewThumbnail, db?: DbOrTx): Promise<Result<Thumbnail, BaseError>>;
  findById(id: string, db?: DbOrTx): Promise<Result<Thumbnail | null, BaseError>>;
  findByJobId(jobId: string, db?: DbOrTx): Promise<Result<Thumbnail | null, BaseError>>;
  findAll(db?: DbOrTx): Promise<Result<Thumbnail[], BaseError>>;
  findByStatus(status: ThumbnailStatus, db?: DbOrTx): Promise<Result<Thumbnail[], BaseError>>;
  updateStatus(
    id: string,
    status: ThumbnailStatus,
    updates?: Partial<Pick<Thumbnail, 'thumbnailPath' | 'errorMessage' | 'retryCount'>>,
    db?: DbOrTx
  ): Promise<Result<Thumbnail, BaseError>>;
  delete(id: string, db?: DbOrTx): Promise<Result<void, BaseError>>;
  softDelete(id: string, db?: DbOrTx): Promise<Result<boolean, BaseError>>;
}

export type { IThumbnailsRepository };
