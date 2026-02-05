import type { Result } from '@/core/shared/result';
import type { BaseError } from '@/core/shared/errors';
import type { ILogger, ICacheClient, ICacheRepository } from '@/core/ports';
import { ok, err, fromPromise, fromTry } from '@/core/shared/result';
import { CacheError } from '@/core/shared/errors';

class RedisRepository implements ICacheRepository {
  readonly name = 'RedisRepository';

  constructor(
    private readonly cache: ICacheClient,
    private readonly logger: ILogger
  ) {}

  async get<T>(key: string): Promise<Result<T | null, BaseError>> {
    const valueResult = await fromPromise<string | null, BaseError>(
      () => this.cache.get(key),
      (error) => {
        this.logger.error({ key, error }, 'Failed to get value from cache');
        return new CacheError('Failed to get value', { key, error });
      }
    );

    if (valueResult.isErr()) {
      return err(valueResult.error);
    }

    const value = valueResult.value;
    if (!value) {
      return ok(null);
    }

    // Try to parse JSON, fall back to raw value
    const parseResult = fromTry<T, BaseError>(
      () => JSON.parse(value) as T,
      () => new CacheError('Failed to parse cached value', { key })
    );

    return parseResult.isOk() ? parseResult : ok(value as T);
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<Result<void, BaseError>> {
    return fromPromise(
      async () => {
        const isString = typeof value === 'string';
        const serialized = isString ? value : JSON.stringify(value);

        if (ttlSeconds !== undefined) {
          await this.cache.set(key, serialized, 'EX', ttlSeconds);
        } else {
          await this.cache.set(key, serialized);
        }

        this.logger.debug({ key, ttl: ttlSeconds }, 'Value cached successfully');
      },
      (error) => {
        this.logger.error({ key, error }, 'Failed to set value in cache');
        return new CacheError('Failed to set value', { key, error });
      }
    );
  }

  async delete(key: string): Promise<Result<boolean, BaseError>> {
    return fromPromise(
      async () => {
        const result = await this.cache.del(key);
        this.logger.debug({ key, deleted: result > 0 }, 'Cache key deleted');
        return result > 0;
      },
      (error) => {
        this.logger.error({ key, error }, 'Failed to delete value from cache');
        return new CacheError('Failed to delete value', { key, error });
      }
    );
  }

  async exists(key: string): Promise<Result<boolean, BaseError>> {
    return fromPromise(
      () => this.cache.exists(key),
      (error) => {
        this.logger.error({ key, error }, 'Failed to check key existence in cache');
        return new CacheError('Failed to check key existence', { key, error });
      }
    );
  }

  async expire(key: string, ttlSeconds: number): Promise<Result<boolean, BaseError>> {
    return fromPromise(
      async () => {
        const result = await this.cache.expire(key, ttlSeconds);
        this.logger.debug({ key, ttl: ttlSeconds, success: result === 1 }, 'Cache expiration set');
        return result === 1;
      },
      (error) => {
        this.logger.error({ key, ttl: ttlSeconds, error }, 'Failed to set expiration in cache');
        return new CacheError('Failed to set expiration', { key, ttl: ttlSeconds, error });
      }
    );
  }

  async ping(): Promise<Result<string, BaseError>> {
    return fromPromise(
      () => this.cache.ping(),
      (error) => {
        this.logger.error({ error }, 'Failed to ping cache');
        return new CacheError('Failed to ping redis', { error });
      }
    );
  }
}

export { RedisRepository };
