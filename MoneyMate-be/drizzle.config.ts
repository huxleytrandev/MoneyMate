import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/models/*.model.ts',
  out: './drizzle',
  strict: true,
  verbose: true,
});
