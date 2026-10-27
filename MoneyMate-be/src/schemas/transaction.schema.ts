import type { CreateTransactionData, CreateTransactionInput } from '../types/transaction.types.ts';
import { z } from 'zod';
import {
  idSchema,
  kindSchema,
  noteSchema,
  positiveMoneySchema,
  timestampSchema,
} from './common.schema.ts';
import { transactionAllocationSchema } from './transaction-allocation.schema.ts';
export const createTransactionSchema = z
  .strictObject({
    categoryId: idSchema,
    kind: kindSchema,
    amount: positiveMoneySchema,
    title: z.string().trim().normalize('NFC').min(1).max(200),
    note: noteSchema,
    occurredAt: timestampSchema,
    allocations: z.array(transactionAllocationSchema).min(1).max(100),
  })
  .superRefine((data, context) => {
    const total = data.allocations.reduce((sum, item) => sum + item.amount, 0n);
    if (total !== data.amount)
      context.addIssue({
        code: 'custom',
        path: ['allocations'],
        message: 'Allocation total must equal transaction amount',
      });
    const ids = data.allocations.map((item) => item.assetAccountId);
    if (new Set(ids).size !== ids.length)
      context.addIssue({
        code: 'custom',
        path: ['allocations'],
        message: 'Duplicate asset accounts are not allowed',
      });
  }) satisfies z.ZodType<CreateTransactionData, CreateTransactionInput>;
