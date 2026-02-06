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
  originalPath: string | null;
  thumbnailPath: string | null;
  width: number | null;
  height: number | null;
  format: ThumbnailFormat | null;
  status: ThumbnailStatus;
  errorMessage: string | null;
  jobId: string | null;
  retryCount: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface ThumbnailListResponse {
  items: ThumbnailResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DeleteResponse {
  message: string;
}

// Use case interface
export interface IThumbnailsUseCase {
  readonly name: string;
  generateThumbnail(input: CreateThumbnailRequest): Promise<Result<ThumbnailResponse>>;
  getThumbnailById(id: string): Promise<Result<ThumbnailResponse>>;
  listThumbnails(page?: number, pageSize?: number): Promise<Result<ThumbnailListResponse>>;
  deleteThumbnail(id: string): Promise<Result<DeleteResponse>>;
}
