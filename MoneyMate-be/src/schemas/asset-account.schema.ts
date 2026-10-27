import type {
  CreateAssetAccountData,
  CreateAssetAccountInput,
} from '../types/asset-account.types.ts';
import { z } from 'zod';
import { moneySchema, nameSchema, noteSchema, timestampSchema } from './common.schema.ts';
export const createAssetAccountSchema = z.strictObject({
  name: nameSchema,
  type: z.enum(['cash', 'bank', 'other']),
  openingValue: moneySchema,
  openingAt: timestampSchema,
  note: noteSchema,
}) satisfies z.ZodType<CreateAssetAccountData, CreateAssetAccountInput>;
