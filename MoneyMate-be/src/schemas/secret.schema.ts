import { z } from 'zod';
import { environmentSchema } from './environment.schema.ts';
import type { SecretConfig } from '../types/secret.types.ts';

const duration = z
  .string()
  .regex(/^[1-9]\d*(s|m|h|d)$/, 'Use a positive duration such as 15m or 7d');
export const secretSchema = environmentSchema
  .extend({
    ACCESS_EXPIRES_IN: duration.default('15m'),
    REFRESH_EXPIRES_IN: duration.default('7d'),
    SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(10),
    SERVER_URL: z.httpUrl().optional(),
    FRONTEND_BASE_URL: z.httpUrl().optional(),
  })
  .transform((data) => ({
    ...data,
    SERVER_URL: (data.SERVER_URL ?? 'http://localhost:' + data.PORT + '/api').replace(/\/$/, ''),
  })) satisfies z.ZodType<SecretConfig>;
