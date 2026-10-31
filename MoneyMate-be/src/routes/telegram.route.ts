import { Router } from 'express';
import { sensitiveActionLimit } from '../configs/rate-limit.config.ts';
import type { telegramController } from '../controllers/telegram.controller.ts';
export function createTelegramRoutes(controller: ReturnType<typeof telegramController>) {
  const router = Router();
  const limit = sensitiveActionLimit();
  router.get('/status', controller.status);
  router.post('/link-requests', limit, controller.issue);
  router.post('/confirm', limit, controller.confirm);
  router.delete('/link', limit, controller.revoke);
  return router;
}
