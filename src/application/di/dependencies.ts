import type { IThumbnailsRepository, IStorageRepository, ICacheRepository } from '@/core/ports';
import type { ILogger } from '@/core/ports';
import type { IThumbnailsUseCase } from '@/application/thumbnails';

export interface Dependencies {
  // Use cases (application layer)
  readonly thumbnails: IThumbnailsUseCase;

  // Repositories (infrastructure layer)
  readonly storage: IStorageRepository;
  readonly cache: ICacheRepository;
  readonly thumbnailsRepo: IThumbnailsRepository;

  // Core utilities
  readonly logger: ILogger;
}

export function createDependencies({
  logger,
  storageRepository,
  cacheRepository,
  thumbnailsRepository,
  thumbnailsUseCase,
}: {
  logger: ILogger;
  storageRepository: IStorageRepository;
  cacheRepository: ICacheRepository;
  thumbnailsRepository: IThumbnailsRepository;
  thumbnailsUseCase: IThumbnailsUseCase;
}): Dependencies {
  return {
    thumbnails: thumbnailsUseCase,
    storage: storageRepository,
    cache: cacheRepository,
    thumbnailsRepo: thumbnailsRepository,
    logger,
  };
}
