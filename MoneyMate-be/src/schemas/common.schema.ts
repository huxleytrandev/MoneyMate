import { z } from 'zod';

export const idSchema = z.uuid();
export const nameSchema = z.string().trim().normalize('NFC').min(1).max(100);
export const noteSchema = z.string().trim().normalize('NFC').max(2000).optional();
export const kindSchema = z.enum(['income', 'expense']);
export const timestampSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value).toISOString());

// Exact integer VND, compatible with PostgreSQL bigint. JSON clients should send digit strings.
const integerInput = z
  .union([
    z
      .string()
      .trim()
      .regex(/^-?\d+$/),
    z.number().int().safe(),
  ])
  .transform((value) => BigInt(value))
  .refine(
    (value) => value >= -9223372036854775808n && value <= 9223372036854775807n,
    'Outside PostgreSQL bigint range',
  );
export const moneySchema = integerInput.refine(
  (value) => value >= 0n,
  'Amount must be nonnegative',
);
export const positiveMoneySchema = moneySchema.refine(
  (value) => value > 0n,
  'Amount must be positive',
);
export const signedMoneySchema = integerInput.refine(
  (value) => value !== 0n,
  'Adjustment must not be zero',
);
export const monthSchema = z.iso
  .date()
  .refine((value) => value.endsWith('-01'), 'Use the first day of the month');
