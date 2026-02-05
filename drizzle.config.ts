import type { Config } from 'drizzle-kit';

export default {
  schema: './src/infrastructure/persistence/database/postgres/schemas',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://user:password@localhost:5432/dbname',
  },
} satisfies Config;
