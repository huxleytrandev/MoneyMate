import { databaseErrorMessage } from '../utils/database-error.ts';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as models from '../models/index.ts';
import pg from 'pg';
import type { Environment } from '../types/environment.types.ts';

export function createDatabase(environment: Environment) {
  const pool = new pg.Pool({
    connectionString: environment.DATABASE_URL,
    max: environment.DB_POOL_MAX,
    connectionTimeoutMillis: environment.DB_CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: 30000,
    query_timeout: 5000,
  });
  pool.on('error', () => console.error('Unexpected PostgreSQL pool connection error.'));
  return { pool, db: drizzle(pool, { schema: models }) };
}

export async function checkDatabase(database: ReturnType<typeof createDatabase>): Promise<void> {
  await database.pool.query('SELECT 1 AS connected');
}

export async function connectDB(environment: Environment) {
  const database = createDatabase(environment);
  try {
    await checkDatabase(database);
    return database;
  } catch (error: unknown) {
    await database.pool.end();
    throw new Error(databaseErrorMessage(error), { cause: error });
  }
}
