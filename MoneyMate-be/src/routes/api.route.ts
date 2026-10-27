import { Router } from 'express';
import type { Database } from '../types/database.types.ts';
import type { Authentication } from '../types/auth.types.ts';
import { userService } from '../services/user.service.ts';
import { financeService } from '../services/finance.service.ts';
import { statisticsService } from '../services/statistics.service.ts';
import { financeController } from '../controllers/finance.controller.ts';
import { statisticsController } from '../controllers/statistics.controller.ts';
import { userController } from '../controllers/user.controller.ts';
import { requireAuth } from '../middlewares/auth.middleware.ts';
import { browserOrigin } from '../middlewares/security.middleware.ts';

import { createUserRoutes } from './user.route.ts';
import { createFinanceRoutes } from './finance.route.ts';
import { createStatisticsRoutes } from './statistics.route.ts';
import { assetController } from '../controllers/asset.controller.ts';
import { createAssetRoutes } from './asset.route.ts';
import { categoryController } from '../controllers/category.controller.ts';
import { createCategoryRoutes } from './category.route.ts';
import { planController } from '../controllers/plan.controller.ts';
import { createPlanRoutes } from './plan.route.ts';
import { transactionController } from '../controllers/transaction.controller.ts';
import { createTransactionRoutes } from './transaction.route.ts';
import { transferController } from '../controllers/transfer.controller.ts';
import { createTransferRoutes } from './transfer.route.ts';
import { adjustmentController } from '../controllers/adjustment.controller.ts';
import { createAdjustmentRoutes } from './adjustment.route.ts';

export function createApiRoutes(db: Database, auth: Authentication, frontendBaseUrl?: string) {
  const router = Router();
  const finance = financeService(db);
  router.use(browserOrigin(frontendBaseUrl));
  router.use(requireAuth(auth));
  router.use('/users', createUserRoutes(userController(userService(db, auth))));
  router.use(createFinanceRoutes(financeController(finance)));
  router.use('/statistics', createStatisticsRoutes(statisticsController(statisticsService(db))));
  router.use('/assets', createAssetRoutes(assetController(finance)));
  router.use('/categories', createCategoryRoutes(categoryController(finance)));
  router.use('/plans', createPlanRoutes(planController(finance)));
  router.use('/transactions', createTransactionRoutes(transactionController(finance)));
  router.use('/transfers', createTransferRoutes(transferController(finance)));
  router.use('/adjustments', createAdjustmentRoutes(adjustmentController(finance)));
  return router;
}
