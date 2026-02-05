/**
 * Result Pattern, You probably already know it :)
 */
import type { BaseError } from './errors/BaseError';

type Result<T, E extends BaseError = BaseError> = Ok<T, E> | Err<T, E>;

// Use declare fields to ensure consistent hidden class shape
class Ok<T, E extends BaseError> {
  declare readonly _tag: 'Ok';
  declare readonly value: T;

  constructor(value: T) {
    this._tag = 'Ok';
    this.value = value;
  }

  isOk(): this is Ok<T, E> {
    return true;
  }

  isErr(): this is Err<T, E> {
    return false;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapErr(): never {
    throw new Error(`Called unwrapErr on Ok: ${JSON.stringify(this.value)}`);
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Ok(fn(this.value));
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  match<U>(matcher: { ok: (value: T) => U; err: (err: E) => U }): U {
    return matcher.ok(this.value);
  }
}

class Err<T, E extends BaseError> {
  declare readonly _tag: 'Err';
  declare readonly error: E;

  constructor(error: E) {
    this._tag = 'Err';
    this.error = error;
  }

  isOk(): this is Ok<T, E> {
    return false;
  }

  isErr(): this is Err<T, E> {
    return true;
  }

  unwrap(): never {
    throw this.error;
  }

  unwrapErr(): E {
    return this.error;
  }

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return new Err(this.error) as unknown as Result<U, E>;
  }

  flatMap<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return new Err(this.error) as unknown as Result<U, E>;
  }

  match<U>(matcher: { ok: (value: T) => U; err: (err: E) => U }): U {
    return matcher.err(this.error);
  }
}

// Constructors
const ok = <T, E extends BaseError = BaseError>(value: T): Result<T, E> => new Ok(value);

const err = <T, E extends BaseError = BaseError>(error: E): Result<T, E> => new Err(error);

// Wrap synchronous function that might throw
const fromTry = <T, E extends BaseError>(
  fn: () => T,
  onError: (error: unknown) => E
): Result<T, E> => {
  try {
    return ok(fn());
  } catch (e) {
    return err(onError(e));
  }
};

// Wrap async function that might throw
const fromPromise = async <T, E extends BaseError>(
  fn: () => Promise<T>,
  onError: (error: unknown) => E
): Promise<Result<T, E>> => {
  try {
    return ok(await fn());
  } catch (e) {
    return err(onError(e));
  }
};

export { type Result, Ok, Err, ok, err, fromTry, fromPromise };
