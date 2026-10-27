import type { Environment } from './environment.types.ts';

export interface SecretConfig extends Environment {
  ACCESS_EXPIRES_IN: string;
  REFRESH_EXPIRES_IN: string;
  SALT_ROUNDS: number;
  SERVER_URL: string;
  FRONTEND_BASE_URL?: string;
}
