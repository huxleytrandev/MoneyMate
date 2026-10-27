import { sensitiveActionLimit } from '../configs/rate-limit.config.ts';
import { Router } from 'express';
import type { userController } from '../controllers/user.controller.ts';
export function createUserRoutes(controller: ReturnType<typeof userController>) {
  const router = Router();
  const limitSensitiveActions = sensitiveActionLimit();
  router.get('/me', controller.me);
  router.post('/me/verify-password', limitSensitiveActions, controller.verifyPassword);
  router.delete('/me', limitSensitiveActions, controller.remove);
  return router;
}
