import type { transactionController } from '../controllers/transaction.controller.ts';
import { createResourceRoutes } from './resource.route.ts';
export function createTransactionRoutes(controller: ReturnType<typeof transactionController>) {
  const router = createResourceRoutes(controller);
  return router;
}
