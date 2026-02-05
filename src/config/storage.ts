import { S3Client } from 'bun';
import { env } from './env';
import { createModuleLogger } from './logger';
import { StorageError } from '@/core/errors';

const logger = createModuleLogger('Storage');

let storageClient: S3Client | null = null;

function getStorageClient(): S3Client {
  if (!storageClient) {
    throw new StorageError('Storage client has not been initialized');
  }
  return storageClient;
}

const initStorageClient = async () => {
  if (storageClient) return;

  storageClient = new S3Client({
    endpoint: env.STORAGE_ENDPOINT,
    accessKeyId: env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
  });

  try {
    await storageClient.file('test-connection').exists();
    logger.info({ endpoint: env.STORAGE_ENDPOINT }, 'Storage connected');
  } catch (error) {
    logger.error({ error }, 'Storage connection failed');
    storageClient = null;
    throw error;
  }
};

const closeStorageClient = () => {
  if (storageClient) {
    storageClient = null;
    logger.info('Storage client closed');
  }
};

export { getStorageClient, initStorageClient, closeStorageClient };
