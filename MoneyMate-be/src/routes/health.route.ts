import { Router } from 'express';
export const HEALTH_ROUTES = { HEALTH: '/health', READY: '/ready' } as const;

export default function createHealthRoutes(checkReadiness: () => Promise<void>) {
  const routes = Router();
  routes.get(HEALTH_ROUTES.HEALTH, (_request, response) => {
    response.json({ status: 'ok', service: 'MoneyMate-be' });
  });
  routes.get(HEALTH_ROUTES.READY, async (_request, response) => {
    try {
      await checkReadiness();
      response.json({ status: 'ready', database: 'connected' });
    } catch {
      response.status(503).json({ status: 'not_ready', database: 'unavailable' });
    }
  });
  return routes;
}
