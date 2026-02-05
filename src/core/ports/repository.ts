import type { Result } from '../shared/result';
import type { BaseError } from '../shared/errors';
import type { DbOrTx, ThumbnailStatus } from '../types';
import type {
  Thumbnail,
  NewThumbnail,
} from '@/infrastructure/persistence/database/drizzle/postgres/schemas';
type TransactionResult<T> = Result<T, BaseError>;

interface ITransactionManager {
  runInTransaction<T>(
    callback: (db: DbOrTx) => Promise<TransactionResult<T>>
  ): Promise<TransactionResult<T>>;
}

interface IStorageRepository {
  upload(
    key: string,
    data: Buffer | Uint8Array | string,
    contentType?: string
  ): Promise<Result<void, BaseError>>;
  download(key: string): Promise<Result<Uint8Array, BaseError>>;
  delete(key: string): Promise<Result<void, BaseError>>;
  exists(key: string): Promise<Result<boolean, BaseError>>;
  list(prefix?: string): Promise<Result<string[], BaseError>>;
}

interface ICacheRepository {
  get<T>(key: string): Promise<Result<T | null, BaseError>>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<Result<void, BaseError>>;
  delete(key: string): Promise<Result<boolean, BaseError>>;
  exists(key: string): Promise<Result<boolean, BaseError>>;
  expire(key: string, ttlSeconds: number): Promise<Result<boolean, BaseError>>;
  ping(): Promise<Result<string, BaseError>>;
}

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

export type {
  ITransactionManager,
  TransactionResult,
  IStorageRepository,
  ICacheRepository,
  IThumbnailsRepository,
};
