import type { Result } from '@/core/shared/result';
import type { BaseError } from '@/core/shared/errors';
import type { ILogger, IStorageClient, IStorageRepository } from '@/core/ports';
import { err, fromPromise } from '@/core/shared/result';
import { StorageError } from '@/core/shared/errors';

class MinioRepository implements IStorageRepository {
  readonly name = 'MinioRepository';

  constructor(
    private readonly storage: IStorageClient,
    private readonly logger: ILogger
  ) {}

  async upload(
    key: string,
    data: Buffer | Uint8Array | string,
    contentType?: string
  ): Promise<Result<void, BaseError>> {
    return fromPromise(
      async () => {
        const file = this.storage.file(key);
        const options = contentType !== undefined ? { type: contentType } : {};
        await file.write(data, options);
        this.logger.info({ key }, 'File uploaded successfully');
      },
      (error) => {
        this.logger.error({ key, error }, 'Failed to upload file');
        return new StorageError('Failed to upload file', { key, error });
      }
    );
  }

  async download(key: string): Promise<Result<Uint8Array, BaseError>> {
    const existsResult = await fromPromise<boolean, BaseError>(
      async () => this.storage.file(key).exists(),
      (error) => {
        this.logger.error({ key, error }, 'Failed to check file existence');
        return new StorageError('Failed to check file existence', { key, error });
      }
    );

    if (existsResult.isErr()) {
      return err(existsResult.error);
    }

    if (!existsResult.value) {
      return err(new StorageError(`File not found: ${key}`));
    }

    return fromPromise(
      async () => new Uint8Array(await this.storage.file(key).arrayBuffer()),
      (error) => {
        this.logger.error({ key, error }, 'Failed to download file');
        return new StorageError('Failed to download file', { key, error });
      }
    );
  }

  async delete(key: string): Promise<Result<void, BaseError>> {
    return fromPromise(
      async () => {
        await this.storage.file(key).delete();
        this.logger.info({ key }, 'File deleted successfully');
      },
      (error) => {
        this.logger.error({ key, error }, 'Failed to delete file');
        return new StorageError('Failed to delete file', { key, error });
      }
    );
  }

  async exists(key: string): Promise<Result<boolean, BaseError>> {
    return fromPromise(
      () => this.storage.file(key).exists(),
      (error) => {
        this.logger.error({ key, error }, 'Failed to check file existence');
        return new StorageError('Failed to check file existence', { key, error });
      }
    );
  }

  async list(prefix?: string): Promise<Result<string[], BaseError>> {
    return fromPromise(
      async () => {
        const listOptions = prefix !== undefined ? { prefix } : undefined;
        const response = await this.storage.list(listOptions);

        const contents = response.contents;
        const keys =
          contents !== undefined && contents !== null ? new Array<string>(contents.length) : [];

        if (contents !== undefined && contents !== null) {
          for (let i = 0; i < contents.length; i++) {
            const item = contents[i];
            if (item) {
              keys[i] = item.key;
            }
          }
        }

        return keys;
      },
      (error) => {
        this.logger.error({ prefix, error }, 'Failed to list files');
        return new StorageError('Failed to list files', { error });
      }
    );
  }
}

export { MinioRepository };
