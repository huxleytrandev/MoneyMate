import { z } from 'zod';
import type { LoginInput, RegisterInput } from '../types/auth.types';
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Email chưa hợp lệ.')),
  password: z.string().min(1, 'Nhập mật khẩu.'),
}) satisfies z.ZodType<LoginInput>;
export const registerSchema = z
  .object({
    displayName: z.string().trim().normalize('NFC').min(1, 'Nhập tên hiển thị.').max(100),
    email: z.string().trim().toLowerCase().pipe(z.email('Email chưa hợp lệ.')),
    password: z.string().min(12, 'Mật khẩu cần ít nhất 12 ký tự.').max(128),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận chưa khớp.',
  }) satisfies z.ZodType<RegisterInput>;
