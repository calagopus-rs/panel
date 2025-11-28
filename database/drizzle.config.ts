import { filesystem } from '@rjweb/utils';
import { defineConfig } from 'drizzle-kit';

const env = filesystem.env('../.env', { async: false });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  breakpoints: false,
  migrations: {
    prefix: process.env.MODE === 'extension' ? 'timestamp' : 'index',
  },
  dbCredentials: {
    url: env.DATABASE_URL_PRIMARY ?? env.DATABASE_URL,
  },
});
