import type { Executor } from '../types/database.types.ts';
import { profileSchema } from '../schemas/profile.schema.ts';
import { requireRecord } from '../utils/finance-validation.ts';
import { userRepository } from '../repositories/user.repository.ts';
export function profileService(database: Executor) {
  const users = userRepository(database);
  const profile = async (userId: string) => requireRecord(await users.profile(userId));
  const updateProfile = async (userId: string, body: unknown) =>
    requireRecord(await users.updateProfile(userId, profileSchema.parse(body)));
  return { profile, updateProfile };
}
