import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDatabase } from '../configs/database.ts';
import { loadEnvironment } from '../configs/environment.ts';
async function main() {
  const database = createDatabase(loadEnvironment());
  try {
    await migrate(database.db, {
      migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)),
    });
    console.log('Database migrations applied.');
  } finally {
    await database.pool.end();
  }
}
void main().catch(() => {
  console.error('Migration failed. Check connection and permissions; credentials are not logged.');
  process.exitCode = 1;
});
