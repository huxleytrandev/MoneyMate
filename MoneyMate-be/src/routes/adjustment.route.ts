import type { adjustmentController } from '../controllers/adjustment.controller.ts';
import { createResourceRoutes } from './resource.route.ts';
export function createAdjustmentRoutes(controller: ReturnType<typeof adjustmentController>) {
  const router = createResourceRoutes(controller);
  return router;
}
