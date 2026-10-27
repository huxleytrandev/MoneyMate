import type { planController } from '../controllers/plan.controller.ts';
import { createResourceRoutes } from './resource.route.ts';
export function createPlanRoutes(controller: ReturnType<typeof planController>) {
  const router = createResourceRoutes(controller);
  return router;
}
