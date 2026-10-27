import type { CreateCategoryData, CreateCategoryInput } from '../types/category.types.ts';
import { z } from 'zod';
import { kindSchema, nameSchema } from './common.schema.ts';
export const createCategorySchema = z.strictObject({
  name: nameSchema,
  kind: kindSchema,
  icon: z.string().trim().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .transform((value) => value.toUpperCase())
    .optional(),
  sortOrder: z.number().int().nonnegative().default(0),
}) satisfies z.ZodType<CreateCategoryData, CreateCategoryInput>;
