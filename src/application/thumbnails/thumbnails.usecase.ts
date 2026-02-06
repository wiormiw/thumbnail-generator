import { ok, err, fromTry, type Result } from '@/core/shared/result';
import { ValidationError, NotFoundError, BaseError } from '@/core/shared/errors';
import type { ILogger } from '@/core/ports';
import type { IThumbnailsRepository, ICacheRepository } from '@/core/ports';
import type {
  CreateThumbnailRequest,
  ThumbnailResponse,
  ThumbnailListResponse,
  DeleteResponse,
  IThumbnailsUseCase,
} from './dto';
import type { Thumbnail } from '@/core/types';

class ThumbnailsUseCase implements IThumbnailsUseCase {
  readonly name = 'ThumbnailsUseCase';

  constructor(
    private readonly logger: ILogger,
    private readonly thumbnailsRepo: IThumbnailsRepository,
    private readonly cacheRepo: ICacheRepository
  ) {}

  async generateThumbnail(input: CreateThumbnailRequest): Promise<Result<ThumbnailResponse>> {
    this.logger.info({ url: input.url }, 'Creating thumbnail request');

    const validation = this.validateInput(input);
    if (validation.isErr()) {
      return err(validation.error);
    }

    const createResult = await this.thumbnailsRepo.create({
      url: input.url,
      width: input.width ?? null,
      height: input.height ?? null,
      format: input.format ?? null,
    });

    if (createResult.isErr()) {
      return err(createResult.error);
    }

    this.logger.info(
      { thumbnailId: createResult.value.id, status: createResult.value.status },
      'Thumbnail request created, awaiting worker processing'
    );

    return ok(this.toResponse(createResult.value));
  }

  async getThumbnailById(id: string): Promise<Result<ThumbnailResponse>> {
    this.logger.info({ id }, 'Fetching thumbnail');

    if (!id || id.length === 0) {
      return err(new ValidationError('Invalid thumbnail ID'));
    }

    // Try cache first
    const cacheKey = `thumbnail:${id}`;
    const cachedResult = await this.cacheRepo.get<ThumbnailResponse>(cacheKey);

    if (cachedResult.isOk() && cachedResult.value !== null) {
      this.logger.debug({ id }, 'Thumbnail found in cache');
      return ok(cachedResult.value);
    }

    // Cache miss - fetch from database
    const result = await this.thumbnailsRepo.findById(id);

    if (result.isErr()) {
      return err(result.error);
    }

    if (!result.value) {
      return err(new NotFoundError(`Thumbnail not found: ${id}`));
    }

    const response = this.toResponse(result.value);

    // Store in cache for 5 minutes (300 seconds)
    await this.cacheRepo.set(cacheKey, response, 300);

    return ok(response);
  }

  async listThumbnails(
    page: number = 1,
    pageSize: number = 50
  ): Promise<Result<ThumbnailListResponse>> {
    this.logger.info({ page, pageSize }, 'Listing thumbnails');

    // Validate pagination parameters
    if (page < 1) {
      return err(new ValidationError('Page must be greater than 0'));
    }
    if (pageSize < 1 || pageSize > 100) {
      return err(new ValidationError('Page size must be between 1 and 100'));
    }

    // Get paginated data and total count in parallel
    const [thumbnailsResult, countResult] = await Promise.all([
      this.thumbnailsRepo.findAll(undefined, page, pageSize),
      this.thumbnailsRepo.count(),
    ]);

    if (thumbnailsResult.isErr()) {
      return err(thumbnailsResult.error);
    }

    if (countResult.isErr()) {
      return err(countResult.error);
    }

    const items = this.toResponseList(thumbnailsResult.value);
    return ok({
      items,
      total: countResult.value,
      page,
      pageSize,
    });
  }

  async deleteThumbnail(id: string): Promise<Result<DeleteResponse>> {
    this.logger.info({ id }, 'Deleting thumbnail');

    if (!id || id.length === 0) {
      return err(new ValidationError('Invalid thumbnail ID'));
    }

    const deleteResult = await this.thumbnailsRepo.softDelete(id);
    if (deleteResult.isErr()) {
      return err(deleteResult.error);
    }

    if (!deleteResult.value) {
      return err(new NotFoundError(`Thumbnail not found: ${id}`));
    }

    return ok({ message: 'Thumbnail deleted successfully' });
  }

  private validateInput(input: CreateThumbnailRequest): Result<void> {
    if (!input.url || input.url.trim().length === 0) {
      return err(new ValidationError('URL is required'));
    }

    const urlResult = fromTry<URL, BaseError>(
      () => new URL(input.url),
      () => new ValidationError('Invalid URL format')
    );

    if (urlResult.isErr()) {
      return err(urlResult.error);
    }

    if (input.width !== undefined && (input.width < 1 || input.width > 4096)) {
      return err(new ValidationError('Width must be between 1 and 4096'));
    }

    if (input.height !== undefined && (input.height < 1 || input.height > 4096)) {
      return err(new ValidationError('Height must be between 1 and 4096'));
    }

    return ok(undefined);
  }

  private toResponse(thumbnail: Thumbnail): ThumbnailResponse {
    return {
      id: thumbnail.id,
      url: thumbnail.url,
      originalPath: thumbnail.originalPath,
      thumbnailPath: thumbnail.thumbnailPath,
      width: thumbnail.width,
      height: thumbnail.height,
      format: thumbnail.format,
      status: thumbnail.status,
      errorMessage: thumbnail.errorMessage,
      jobId: thumbnail.jobId,
      retryCount: thumbnail.retryCount,
      createdAt: thumbnail.createdAt.toISOString(),
      updatedAt: thumbnail.updatedAt.toISOString(),
    };
  }

  private toResponseList(thumbnails: Thumbnail[]): ThumbnailResponse[] {
    return thumbnails.map((thumbnail) => ({
      id: thumbnail.id,
      url: thumbnail.url,
      originalPath: thumbnail.originalPath,
      thumbnailPath: thumbnail.thumbnailPath,
      width: thumbnail.width,
      height: thumbnail.height,
      format: thumbnail.format,
      status: thumbnail.status,
      errorMessage: thumbnail.errorMessage,
      jobId: thumbnail.jobId,
      retryCount: thumbnail.retryCount,
      createdAt: thumbnail.createdAt.toISOString(),
      updatedAt: thumbnail.updatedAt.toISOString(),
    }));
  }
}

export { ThumbnailsUseCase };
