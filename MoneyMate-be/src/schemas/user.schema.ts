import { z } from 'zod';
import {
  displayNameValidation,
  emailValidation,
  passwordValidation,
} from '../validations/auth.validation.ts';
export {
  registerValidation as registerUserSchema,
  loginValidation as loginUserSchema,
} from '../validations/auth.validation.ts';
export const updateUserSchema = z
  .strictObject({
    displayName: displayNameValidation.optional(),
    email: emailValidation.optional(),
    currentPassword: z.string().min(1).max(128).optional(),
    newPassword: passwordValidation.optional(),
  })
  .refine((data) => !!(data.displayName || data.email || data.newPassword), 'Không có thay đổi.')
  .refine(
    (data) => !(data.email || data.newPassword) || !!data.currentPassword,
    'Cần mật khẩu hiện tại khi đổi email hoặc mật khẩu.',
  );
export const deleteUserSchema = z.strictObject({ password: z.string().min(1).max(128) });
