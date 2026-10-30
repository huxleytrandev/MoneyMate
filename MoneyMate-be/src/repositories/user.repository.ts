import { and, eq } from 'drizzle-orm';
import { UserModel, AuthAccountModel } from '../models/index.ts';
import type { Executor } from '../types/database.types.ts';
import type { UserProfile } from '../types/profile.types.ts';
export function userRepository(database: Executor) {
  const profileColumns = {
    displayName: UserModel.displayName,
    gender: UserModel.gender,
    dateOfBirth: UserModel.dateOfBirth,
    avatarData: UserModel.avatarData,
  };
  return {
    profile: async (userId: string) =>
      (await database.select(profileColumns).from(UserModel).where(eq(UserModel.id, userId)))[0],
    updateProfile: async (userId: string, profile: UserProfile) =>
      (
        await database
          .update(UserModel)
          .set({ ...profile, updatedAt: new Date() })
          .where(eq(UserModel.id, userId))
          .returning(profileColumns)
      )[0],
    byId: async (id: string) =>
      (await database.select().from(UserModel).where(eq(UserModel.id, id)))[0],
    credential: async (userId: string) =>
      (
        await database
          .select()
          .from(AuthAccountModel)
          .where(
            and(eq(AuthAccountModel.userId, userId), eq(AuthAccountModel.providerId, 'credential')),
          )
      )[0],
    upgradePassword: (input: { userId: string; previousHash: string; password: string }) =>
      database
        .update(AuthAccountModel)
        .set({ password: input.password, updatedAt: new Date() })
        .where(
          and(
            eq(AuthAccountModel.userId, input.userId),
            eq(AuthAccountModel.password, input.previousHash),
          ),
        ),
    remove: (id: string) => database.delete(UserModel).where(eq(UserModel.id, id)),
  };
}
