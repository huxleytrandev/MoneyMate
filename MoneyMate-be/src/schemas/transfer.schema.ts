import type { CreateTransferData, CreateTransferInput } from '../types/transfer.types.ts';
import { z } from 'zod';
import { idSchema, noteSchema, positiveMoneySchema, timestampSchema } from './common.schema.ts';
export const createTransferSchema = z
  .strictObject({
    fromAssetAccountId: idSchema,
    toAssetAccountId: idSchema,
    amount: positiveMoneySchema,
    occurredAt: timestampSchema,
    note: noteSchema,
  })
  .refine((data) => data.fromAssetAccountId !== data.toAssetAccountId, {
    path: ['toAssetAccountId'],
    message: 'Source and destination must differ',
  }) satisfies z.ZodType<CreateTransferData, CreateTransferInput>;
