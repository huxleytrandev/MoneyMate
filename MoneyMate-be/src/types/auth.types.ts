import type { createAuth } from '../configs/auth.config.ts';
export type Authentication = ReturnType<typeof createAuth>;
export interface AuthConfig {
  secret: string;
  baseURL: string;
  frontendBaseUrl?: string;
  production: boolean;
}
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}
