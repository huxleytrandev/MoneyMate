import type { AllocationData, AllocationInput } from '../types/transaction-allocation.types.ts';
import { z } from 'zod';
import { idSchema, positiveMoneySchema } from './common.schema.ts';
export const transactionAllocationSchema = z.strictObject({
  assetAccountId: idSchema,
  amount: positiveMoneySchema,
}) satisfies z.ZodType<AllocationData, AllocationInput>;
