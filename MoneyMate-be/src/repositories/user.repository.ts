import { and, eq } from 'drizzle-orm';
import { UserModel, AuthAccountModel } from '../models/index.ts';
import type { Executor } from '../types/database.types.ts';
export function userRepository(database: Executor) {
  return {
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
