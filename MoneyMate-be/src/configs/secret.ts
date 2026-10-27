import { loadEnvironment } from './environment.ts';
import { secretSchema } from '../schemas/secret.schema.ts';

// loadEnvironment loads MoneyMate-be/.env without overwriting existing environment values.
loadEnvironment();
const result = secretSchema.safeParse(process.env);
if (!result.success) {
  const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
  // Never log Zod issues or environment values: they can contain credentials.
  throw new Error(
    'Invalid secret configuration: ' + fields.join(', ') + '. Check MoneyMate-be/.env.',
  );
}

export const SECRETS = Object.freeze(result.data);
export const {
  NODE_ENV,
  HOST,
  PORT,
  DATABASE_URL,
  DB_POOL_MAX,
  DB_CONNECTION_TIMEOUT_MS,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
  SALT_ROUNDS,
  SERVER_URL,
  FRONTEND_BASE_URL,
} = SECRETS;
