import type { Result } from '@/core/shared/result';
import type { ThumbnailFormat, ThumbnailStatus } from '@/core/types';

// Request DTOs
export interface CreateThumbnailRequest {
  url: string;
  width?: number;
  height?: number;
  format?: ThumbnailFormat;
}

// Response DTOs
export interface ThumbnailResponse {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  format: string | null;
  status: ThumbnailStatus;
  thumbnailPath: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Use case interface
export interface IThumbnailsUseCase {
  readonly name: string;
  generateThumbnail(input: CreateThumbnailRequest): Promise<Result<ThumbnailResponse>>;
  getThumbnailById(id: string): Promise<Result<ThumbnailResponse>>;
  listThumbnails(): Promise<Result<ThumbnailResponse[]>>;
  deleteThumbnail(id: string): Promise<Result<void>>;
}
