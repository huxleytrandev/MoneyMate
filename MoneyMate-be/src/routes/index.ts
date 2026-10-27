import { Router } from 'express';
import createHealthRoutes, { HEALTH_ROUTES } from './health.route.ts';

export const ROUTES = {
  ...HEALTH_ROUTES,
  ROOT: { PATH: '/api' },
  API_DOCS: '/api/docs',
  OPENAPI: '/api/docs.json',
} as const;

export default function createRoutes(checkReadiness: () => Promise<void>) {
  const routes = Router();
  routes.use(createHealthRoutes(checkReadiness));
  // Mount future user.route.ts, transaction.route.ts, etc. here.
  return routes;
}
