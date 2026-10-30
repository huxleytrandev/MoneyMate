import { z } from 'zod';
export const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'Nhập họ và tên.').max(100, 'Tên tối đa 100 ký tự.'),
  gender: z.enum(['male', 'female', 'other', 'undisclosed']).nullable(),
  dateOfBirth: z.iso
    .date()
    .refine(
      (value) => value >= '1900-01-01' && value <= new Date().toISOString().slice(0, 10),
      'Ngày sinh không hợp lệ.',
    )
    .nullable(),
  avatarData: z
    .string()
    .max(180000, 'Ảnh quá lớn.')
    .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/, 'Ảnh không hợp lệ.')
    .nullable(),
});
