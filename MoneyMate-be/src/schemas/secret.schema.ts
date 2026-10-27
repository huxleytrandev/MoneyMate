import { z } from 'zod';
import { environmentSchema } from './environment.schema.ts';
import type { SecretConfig } from '../types/secret.types.ts';
const httpUrl = z
  .string()
  .trim()
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        ['http:', 'https:'].includes(url.protocol) &&
        !!url.hostname &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, 'Use a valid HTTP(S) URL');
export const secretSchema = environmentSchema
  .extend({
    SERVER_URL: httpUrl.optional(),
    FRONTEND_BASE_URL: httpUrl.optional(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: httpUrl.optional(),
  })
  .transform((data) => {
    const serverURL = (data.SERVER_URL ?? 'http://localhost:' + data.PORT + '/api').replace(
      /\/$/,
      '',
    );
    return {
      ...data,
      SERVER_URL: serverURL,
      BETTER_AUTH_URL: data.BETTER_AUTH_URL ?? serverURL + '/auth',
    };
  })
  .refine((data) => data.NODE_ENV !== 'production' || data.BETTER_AUTH_URL.startsWith('https://'), {
    path: ['BETTER_AUTH_URL'],
    message: 'Production authentication requires HTTPS',
  }) satisfies z.ZodType<SecretConfig>;
