import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { environmentSchema } from '../schemas/environment.schema.ts';
import type { Environment } from '../types/environment.types.ts';

export function loadEnvironment(): Environment {
  config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
  const result = environmentSchema.safeParse(process.env);
  if (!result.success) {
    // Field names only: never print raw environment values or credentials.
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
    throw new Error(
      'Invalid backend configuration: ' + fields.join(', ') + '. Check MoneyMate-be/.env.',
    );
  }
  return result.data;
}
