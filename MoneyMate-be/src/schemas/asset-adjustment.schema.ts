import type {
  CreateAssetAdjustmentData,
  CreateAssetAdjustmentInput,
} from '../types/asset-adjustment.types.ts';
import { z } from 'zod';
import { idSchema, signedMoneySchema, timestampSchema } from './common.schema.ts';
export const createAssetAdjustmentSchema = z.strictObject({
  assetAccountId: idSchema,
  deltaAmount: signedMoneySchema,
  reason: z.enum(['valuation', 'reconciliation']),
  note: z.string().trim().normalize('NFC').min(1).max(2000),
  occurredAt: timestampSchema,
}) satisfies z.ZodType<CreateAssetAdjustmentData, CreateAssetAdjustmentInput>;
