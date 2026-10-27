import { API_MESSAGES } from '../constants/http.constant.ts';
import { z } from 'zod';
import { idSchema, moneySchema, nameSchema } from './common.schema.ts';
import { createAssetAccountSchema } from './asset-account.schema.ts';
import { createCategorySchema } from './category.schema.ts';
import { createMonthlyPlanSchema } from './monthly-plan.schema.ts';
import { createTransactionSchema } from './transaction.schema.ts';
import { createTransferSchema } from './transfer.schema.ts';
import { createAssetAdjustmentSchema } from './asset-adjustment.schema.ts';
import { RESOURCE_NAMES, REPORT_PERIODS } from '../constants/finance.constant.ts';
export { RESOURCE_NAMES };
export type ResourceName = (typeof RESOURCE_NAMES)[number];
const identity = { id: idSchema.optional() };
export const createSchemas = {
  assets: createAssetAccountSchema.safeExtend({ ...identity, isArchived: z.boolean().optional() }),
  categories: createCategorySchema.safeExtend({ ...identity, isArchived: z.boolean().optional() }),
  plans: createMonthlyPlanSchema.safeExtend(identity),
  transactions: createTransactionSchema.safeExtend(identity),
  transfers: createTransferSchema.safeExtend(identity),
  adjustments: createAssetAdjustmentSchema.safeExtend(identity),
};
export const versionSchema = z.number().int().positive();
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
export const reconcileSchema = z.strictObject({
  value: moneySchema,
  version: versionSchema,
  note: nameSchema.default(API_MESSAGES.reconciliation),
});
export const statisticsQuerySchema = z
  .object({
    start: z.iso.date(),
    end: z.iso.date(),
    period: z.enum(REPORT_PERIODS).default('month'),
  })
  .refine(
    (value) =>
      value.start <= value.end &&
      (Date.parse(value.end) - Date.parse(value.start)) / 86400000 <= 731,
    API_MESSAGES.reportRange,
  );
