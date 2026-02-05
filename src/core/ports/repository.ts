import type { Result } from '../shared/result';
import type { BaseError } from '../shared/errors';
import type { DbOrTx } from '../types';

// Base repository abstractions
interface IReadRepository<T, ID = string> {
  readonly name: string;
  findById(id: ID, db?: DbOrTx): Promise<Result<T, BaseError>>;
  findAll(db?: DbOrTx): Promise<Result<T[], BaseError>>;
  exists(id: ID, db?: DbOrTx): Promise<Result<boolean, BaseError>>;
}

interface IWriteRepository<T, ID = string> {
  readonly name: string;
  create(entity: T, db?: DbOrTx): Promise<Result<T, BaseError>>;
  update(id: ID, entity: Partial<T>, db?: DbOrTx): Promise<Result<T, BaseError>>;
  delete(id: ID, db?: DbOrTx): Promise<Result<void, BaseError>>;
}

interface IRepository<T, ID = string> extends IReadRepository<T, ID>, IWriteRepository<T, ID> {}

interface IDatabaseRepository {
  readonly name: string;
}

type TransactionResult<T> = Result<T, BaseError>;

interface ITransactionManager {
  runInTransaction<T>(
    callback: (db: DbOrTx) => Promise<TransactionResult<T>>
  ): Promise<TransactionResult<T>>;
}

// Infrastructure repository interfaces
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

export type {
  IReadRepository,
  IWriteRepository,
  IRepository,
  IDatabaseRepository,
  ITransactionManager,
  TransactionResult,
  IStorageRepository,
  ICacheRepository,
};
