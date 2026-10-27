import { databaseErrorMessage } from '../utils/database-error.ts';
import { createDatabase, checkDatabase } from '../configs/database.ts';
import { loadEnvironment } from '../configs/environment.ts';

async function main() {
  const database = createDatabase(loadEnvironment());
  try {
    await checkDatabase(database);
    console.log('PostgreSQL connection successful.');
  } catch (error: unknown) {
    throw new Error(databaseErrorMessage(error), { cause: error });
  } finally {
    await database.pool.end();
  }
}
void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Database check failed.');
  process.exitCode = 1;
});
