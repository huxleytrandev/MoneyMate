import { sensitiveActionLimit } from '../configs/rate-limit.config.ts';
import { Router } from 'express';
import type { userController } from '../controllers/user.controller.ts';
export function createUserRoutes(controller: ReturnType<typeof userController>) {
  const router = Router();
  const limitSensitiveActions = sensitiveActionLimit();
  router.get('/me', controller.me);
  router.get('/me/profile', controller.profile);
  router.put('/me/profile', limitSensitiveActions, controller.updateProfile);
  router.post('/me/verify-password', limitSensitiveActions, controller.verifyPassword);
  router.delete('/me', limitSensitiveActions, controller.remove);
  return router;
}
