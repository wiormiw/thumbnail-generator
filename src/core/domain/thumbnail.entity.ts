import type { ThumbnailStatus, ThumbnailFormat } from '../types';

export interface Thumbnail {
  readonly id: string;
  readonly url: string;
  readonly originalPath: string | null;
  readonly thumbnailPath: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly format: ThumbnailFormat | null;
  readonly status: ThumbnailStatus;
  readonly errorMessage: string | null;
  readonly jobId: string | null;
  readonly retryCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface NewThumbnail {
  readonly url: string;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly format?: ThumbnailFormat | null;
}

export interface ThumbnailStatusUpdate {
  readonly status: ThumbnailStatus;
  readonly thumbnailPath?: string | null;
  readonly errorMessage?: string | null;
  readonly retryCount?: number;
}
