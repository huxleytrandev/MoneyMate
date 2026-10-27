import type { Environment } from './environment.types.ts';
export interface SecretConfig extends Environment {
  SERVER_URL: string;
  FRONTEND_BASE_URL?: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}
