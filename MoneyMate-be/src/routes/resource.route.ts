import { Router } from 'express';
import type { ResourceController } from '../types/controller.types.ts';

// Shared URL pattern only; each domain supplies its own HTTP handlers.
export function createResourceRoutes(controller: ResourceController) {
  const router = Router();
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}
