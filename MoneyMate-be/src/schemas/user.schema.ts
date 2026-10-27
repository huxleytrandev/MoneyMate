import type { RegisterUserData, RegisterUserInput } from '../types/user.types.ts';
import { z } from 'zod';
export const registerUserSchema = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().normalize('NFC').min(1).max(100),
  timezone: z
    .string()
    .trim()
    .refine((value) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, 'Invalid timezone')
    .default('Asia/Ho_Chi_Minh'),
}) satisfies z.ZodType<RegisterUserData, RegisterUserInput>;
