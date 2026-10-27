import type { CreateMonthlyPlanData, CreateMonthlyPlanInput } from '../types/monthly-plan.types.ts';
import { z } from 'zod';
import { idSchema, kindSchema, moneySchema, monthSchema, noteSchema } from './common.schema.ts';
export const createMonthlyPlanSchema = z.strictObject({
  categoryId: idSchema,
  kind: kindSchema,
  month: monthSchema,
  plannedAmount: moneySchema,
  note: noteSchema,
}) satisfies z.ZodType<CreateMonthlyPlanData, CreateMonthlyPlanInput>;
