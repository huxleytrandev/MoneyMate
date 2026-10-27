import type { categoryController } from '../controllers/category.controller.ts';
import { createResourceRoutes } from './resource.route.ts';
export function createCategoryRoutes(controller: ReturnType<typeof categoryController>) {
  const router = createResourceRoutes(controller);
  return router;
}
