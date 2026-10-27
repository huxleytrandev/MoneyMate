import type { Database } from './database.types.ts';
import type { AuthConfig } from './auth.types.ts';
export interface ApplicationConfig {
  checkReadiness: () => Promise<void>;
  frontendBaseUrl?: string;
  database?: Database;
  environment?: 'production' | 'development';
  auth?: AuthConfig;
}
