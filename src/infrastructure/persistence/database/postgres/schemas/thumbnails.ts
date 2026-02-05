import { pgTable, varchar, integer, text, index } from 'drizzle-orm/pg-core';
import { auditFields } from './audit';
import { thumbnailFormats, thumbnailStatuses } from '@/core/types';

const thumbnails = pgTable(
  'thumbnails',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    url: text('url').notNull(),
    originalPath: varchar('original_path', { length: 512 }),
    thumbnailPath: varchar('thumbnail_path', { length: 512 }),
    width: integer('width'),
    height: integer('height'),
    format: varchar('format', { enum: thumbnailFormats }),
    status: varchar('status', { enum: thumbnailStatuses }).default('pending').notNull(),
    errorMessage: text('error_message'),
    jobId: varchar('job_id', { length: 255 }), // External worker job ID
    retryCount: integer('retry_count').default(0).notNull(),
    // Audit fields
    ...auditFields,
  },
  (table) => [
    index('thumbnails_status_idx').on(table.status),
    index('thumbnails_job_id_idx').on(table.jobId),
    index('thumbnails_created_at_idx').on(table.createdAt),
  ]
);

type Thumbnail = typeof thumbnails.$inferSelect;
type NewThumbnail = typeof thumbnails.$inferInsert;

export { thumbnails, type Thumbnail, type NewThumbnail };
