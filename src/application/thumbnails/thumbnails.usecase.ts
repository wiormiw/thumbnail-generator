import { ok, err, fromTry, type Result } from '@/core/shared/result';
import { ValidationError, NotFoundError, BaseError } from '@/core/shared/errors';
import type { ILogger } from '@/core/ports';
import type { IThumbnailsRepository } from '@/core/ports';
import type {
  CreateThumbnailRequest,
  ThumbnailResponse,
  IThumbnailsUseCase,
} from './dto';
import type { ThumbnailStatus } from '@/core/types';

class ThumbnailsUseCase implements IThumbnailsUseCase {
  readonly name = 'ThumbnailsUseCase';

  constructor(
    private readonly logger: ILogger,
    private readonly thumbnailsRepo: IThumbnailsRepository
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
      status: 'pending',
    });

    if (createResult.isErr()) {
      return createResult;
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

    const result = await this.thumbnailsRepo.findById(id);

    if (result.isErr()) {
      return err(result.error);
    }

    if (!result.value) {
      return err(new NotFoundError(`Thumbnail not found: ${id}`));
    }

    return ok(this.toResponse(result.value));
  }

  async listThumbnails(): Promise<Result<ThumbnailResponse[]>> {
    this.logger.info('Listing thumbnails');

    const result = await this.thumbnailsRepo.findAll();

    if (result.isErr()) {
      return result;
    }

    const responses: ThumbnailResponse[] = [];

    for (let i = 0; i < result.value.length; i++) {
      const thumbnail = result.value[i];
      if (thumbnail) {
        responses.push(this.toResponse(thumbnail));
      }
    }

    return ok(responses);
  }

  async deleteThumbnail(id: string): Promise<Result<void>> {
    this.logger.info({ id }, 'Deleting thumbnail');

    if (!id || id.length === 0) {
      return err(new ValidationError('Invalid thumbnail ID'));
    }

    const existsResult = await this.thumbnailsRepo.findById(id);
    if (existsResult.isErr()) {
      return err(existsResult.error);
    }

    if (!existsResult.value) {
      return err(new NotFoundError(`Thumbnail not found: ${id}`));
    }

    const deleteResult = await this.thumbnailsRepo.softDelete(id);
    if (deleteResult.isErr()) {
      return err(deleteResult.error);
    }

    return ok(undefined);
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

  private toResponse(thumbnail: {
    id: string;
    url: string;
    width: number | null;
    height: number | null;
    format: string | null;
    status: ThumbnailStatus;
    thumbnailPath: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ThumbnailResponse {
    return {
      id: thumbnail.id,
      url: thumbnail.url,
      width: thumbnail.width,
      height: thumbnail.height,
      format: thumbnail.format,
      status: thumbnail.status,
      thumbnailPath: thumbnail.thumbnailPath ?? null,
      createdAt: thumbnail.createdAt,
      updatedAt: thumbnail.updatedAt,
    };
  }
}

export { ThumbnailsUseCase };
