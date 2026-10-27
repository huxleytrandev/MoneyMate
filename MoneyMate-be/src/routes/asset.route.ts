import type { assetController } from '../controllers/asset.controller.ts';
import { createResourceRoutes } from './resource.route.ts';
export function createAssetRoutes(controller: ReturnType<typeof assetController>) {
  const router = createResourceRoutes(controller);
  router.post('/:id/reconcile', controller.reconcile);
  return router;
}
