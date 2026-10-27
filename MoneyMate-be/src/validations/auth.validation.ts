import { z } from 'zod';
import { USER } from '../constants/user.constant.ts';
export const emailValidation = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email('Email chưa hợp lệ.'));
export const passwordValidation = z
  .string()
  .min(USER.passwordMin, 'Mật khẩu cần ít nhất 12 ký tự.')
  .max(USER.passwordMax);
export const displayNameValidation = z.string().trim().normalize('NFC').min(1).max(100);
export const timezoneValidation = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, 'Múi giờ không hợp lệ.');
export const registerValidation = z.strictObject({
  email: emailValidation,
  password: passwordValidation,
  displayName: displayNameValidation,
  timezone: timezoneValidation.default(USER.timezone),
});
export const loginValidation = z.strictObject({
  email: emailValidation,
  password: z.string().min(1).max(USER.passwordMax),
});
