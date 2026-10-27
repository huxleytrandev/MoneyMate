import { loadEnvironment } from './environment.ts';
import { secretSchema } from '../schemas/secret.schema.ts';
loadEnvironment();
const result = secretSchema.safeParse(process.env);
if (!result.success) {
  const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
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
  SERVER_URL,
  FRONTEND_BASE_URL,
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
} = SECRETS;
