import type { Database } from '../types/database.types.ts';
import type { Authentication } from '../types/auth.types.ts';
import { createApiRoutes } from './api.route.ts';
import { Router } from 'express';
import createHealthRoutes, { HEALTH_ROUTES } from './health.route.ts';
export const ROUTES = {
  ...HEALTH_ROUTES,
  ROOT: { PATH: '/api' },
  API_DOCS: '/api/docs',
  OPENAPI: '/api/docs.json',
} as const;
export default function createRoutes(
  checkReadiness: () => Promise<void>,
  database?: Database,
  frontendBaseUrl?: string,
  auth?: Authentication,
) {
  const routes = Router();
  routes.use(createHealthRoutes(checkReadiness));
  if (database && auth) routes.use(createApiRoutes(database, auth, frontendBaseUrl));
  return routes;
}
