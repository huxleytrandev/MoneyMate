import { z } from 'zod';
import { AVATAR_MAX_BYTES, GENDERS } from '../constants/profile.constant.ts';
import { displayNameValidation } from '../validations/auth.validation.ts';
import type { UserProfile } from '../types/profile.types.ts';

export const birthDateSchema = z.iso
  .date()
  .refine(
    (value) => value >= '1900-01-01' && value <= new Date().toISOString().slice(0, 10),
    'Ngày sinh phải từ năm 1900 đến hôm nay.',
  );
function validAvatar(value: string) {
  if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
  const bytes = Buffer.from(value.slice(value.indexOf(',') + 1), 'base64');
  return (
    bytes.length >= 4 &&
    bytes.length <= AVATAR_MAX_BYTES &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes.at(-2) === 255 &&
    bytes.at(-1) === 217
  );
}
export const profileSchema = z.strictObject({
  displayName: displayNameValidation,
  gender: z.enum(GENDERS).nullable(),
  dateOfBirth: birthDateSchema.nullable(),
  avatarData: z
    .string()
    .max(180000)
    .refine(validAvatar, 'Ảnh phải là JPEG và không vượt quá 128 KB.')
    .nullable(),
}) satisfies z.ZodType<UserProfile>;
