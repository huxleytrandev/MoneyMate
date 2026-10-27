import { z } from 'zod';
import { localDateTime } from '../helpers/date.ts';
import type { TransactionDraft } from '../types/finance.types';
export const amountSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, 'Nhập số nguyên VND, không dùng dấu phân cách.')
  .transform(Number)
  .refine(
    (value) => Number.isSafeInteger(value) && value >= 0 && value <= 1000000000000,
    'Số tiền không hợp lệ.',
  );
export const positiveAmountSchema = amountSchema.refine(
  (value) => value > 0,
  'Số tiền phải lớn hơn 0.',
);
export const transactionSchema = z
  .object({
    title: z.string().trim().min(1, 'Nhập tên giao dịch.').max(200),
    categoryId: z.string().min(1, 'Chọn hoặc tạo danh mục trước khi lưu.'),
    kind: z.enum(['income', 'expense']),
    amount: positiveAmountSchema,
    date: z.string(),
    time: z.string(),
    allocations: z
      .array(z.object({ assetId: z.string().min(1), amount: positiveAmountSchema }))
      .min(1, 'Phân bổ giao dịch vào nguồn tiền.'),
  })
  .superRefine((value, ctx) => {
    if (!localDateTime(value.date, value.time))
      ctx.addIssue({
        code: 'custom',
        path: ['date'],
        message: 'Ngày giờ chưa hợp lệ (YYYY-MM-DD và HH:mm).',
      });
    if (
      value.allocations.reduce((total, allocation) => total + allocation.amount, 0) !== value.amount
    )
      ctx.addIssue({
        code: 'custom',
        path: ['allocations'],
        message: 'Tổng phân bổ phải bằng số tiền giao dịch.',
      });
    if (
      new Set(value.allocations.map((allocation) => allocation.assetId)).size !==
      value.allocations.length
    )
      ctx.addIssue({ code: 'custom', message: 'Không chọn nguồn tiền trùng nhau.' });
  }) satisfies z.ZodType<unknown, TransactionDraft>;
export const assetSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên tài sản.').max(100),
  type: z.enum(['cash', 'bank', 'other']),
  openingValue: amountSchema,
});
export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên danh mục.').max(100),
  kind: z.enum(['income', 'expense']),
});
