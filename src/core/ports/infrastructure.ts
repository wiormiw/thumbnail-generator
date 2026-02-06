interface ILogger {
  level: string;
  info(obj: unknown, msg?: string): void;
  warn(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
  debug(obj: unknown, msg?: string): void;
  child(bindings: Record<string, unknown>): ILogger;
}

interface IDatabaseClient {
  query<T = unknown>(sql: TemplateStringsArray, ...bindings: unknown[]): Promise<T[]>;
  transaction<T>(callback: (tx: unknown) => Promise<T>): Promise<T>;
}

interface ICacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<'OK'>;
  set(key: string, value: string, mode: 'EX', seconds: number): Promise<'OK'>;
  set(key: string, value: string, mode: 'PX', milliseconds: number): Promise<'OK'>;
  del(...keys: string[]): Promise<number>;
  exists(key: string): Promise<boolean>;
  expire(key: string, seconds: number): Promise<number>;
  ping(): Promise<'PONG'>;
  ping(message: string): Promise<string>;
}

interface IS3File {
  exists(): Promise<boolean>;
  write(data: string | Buffer | Uint8Array, options?: { type?: string }): Promise<number>;
  delete(): Promise<void>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface IStorageClient {
  file(key: string): IS3File;
  list(options?: { prefix?: string; bucket?: string }): Promise<Bun.S3ListObjectsResponse>;
}

export type { ILogger, IDatabaseClient, ICacheClient, IStorageClient, IS3File };
