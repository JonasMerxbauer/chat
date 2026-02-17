import { defineConfig } from 'drizzle-kit';
import { env } from '~/env';

const pgURL = env.ZERO_UPSTREAM_DB;

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  strict: true,
  dbCredentials: {
    url: pgURL,
  },
});
