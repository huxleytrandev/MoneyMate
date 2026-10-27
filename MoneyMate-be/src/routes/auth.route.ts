import type { Express } from 'express';
import { toNodeHandler } from 'better-auth/node';
import type { Authentication } from '../types/auth.types.ts';
export function mountAuthRoutes(app: Express, auth: Authentication) {
  app.all('/api/auth/{*path}', toNodeHandler(auth));
}
