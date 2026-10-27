import { Router } from 'express';
import type { statisticsController } from '../controllers/statistics.controller.ts';
export function createStatisticsRoutes(controller: ReturnType<typeof statisticsController>) {
  const router = Router();
  router.get('/', controller.report);
  return router;
}
