import { z } from 'zod';
import { idSchema } from './common.schema.ts';
import type { FinanceReadQuery } from '../types/finance-read.types.ts';
const month = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .refine(
    (value) => Number(value.slice(0, 4)) >= 1000 && Number(value.slice(0, 4)) <= 9998,
    'Năm phải nằm trong khoảng 1000–9998.',
  );
export const financeReadQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  month: month.optional(),
  cursor: z.string().min(1).max(500).optional(),
  kind: z.enum(['income', 'expense']).optional(),
  assetId: idSchema.optional(),
  assetType: z.enum(['cash', 'bank', 'other']).optional(),
  search: z.string().trim().max(200).optional(),
}) satisfies z.ZodType<FinanceReadQuery>;
export const stateWindowQuerySchema = financeReadQuerySchema
  .pick({ month: true, limit: true, cursor: true })
  .extend({ month, limit: z.coerce.number().int().min(1).max(100).default(50) });
