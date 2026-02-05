import { timestamp } from 'drizzle-orm/pg-core';

const auditFields = {
  createdAt: timestamp('created_at', { withTimezone: true, precision: 6 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, precision: 6 }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, precision: 6 }),
};

export { auditFields };
