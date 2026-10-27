import type { transferController } from '../controllers/transfer.controller.ts';
import { createResourceRoutes } from './resource.route.ts';
export function createTransferRoutes(controller: ReturnType<typeof transferController>) {
  const router = createResourceRoutes(controller);
  return router;
}
