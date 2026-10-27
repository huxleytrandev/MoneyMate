import { ASSET_TYPES } from '../constants/finance.constant.ts';
import type {
  CreateAssetAccountData,
  CreateAssetAccountInput,
} from '../types/asset-account.types.ts';
import { z } from 'zod';
import { moneySchema, nameSchema, noteSchema, timestampSchema } from './common.schema.ts';
export const createAssetAccountSchema = z.strictObject({
  name: nameSchema,
  type: z.enum(ASSET_TYPES),
  openingValue: moneySchema,
  openingAt: timestampSchema,
  note: noteSchema,
}) satisfies z.ZodType<CreateAssetAccountData, CreateAssetAccountInput>;
