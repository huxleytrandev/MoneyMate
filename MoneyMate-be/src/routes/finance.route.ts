import { Router } from 'express';
import type { financeController } from '../controllers/finance.controller.ts';
export function createFinanceRoutes(controller: ReturnType<typeof financeController>) {
  const router = Router();
  router.get('/state', controller.state);
  return router;
}
