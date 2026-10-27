import { and, eq, isNull, sql, inArray } from 'drizzle-orm';
import { AssetAccountModel } from '../models/index.ts';
import type { Executor } from '../types/database.types.ts';
export function assetRepository(database: Executor) {
  const owned = (userId: string) =>
    and(eq(AssetAccountModel.userId, userId), isNull(AssetAccountModel.deletedAt));
  return {
    touchAll: async (userId: string, ids: string[]) => {
      if (ids.length)
        await database
          .update(AssetAccountModel)
          .set({
            updatedAt: new Date().toISOString(),
            version: sql`${AssetAccountModel.version}+1`,
          })
          .where(and(owned(userId), inArray(AssetAccountModel.id, ids)));
    },
    list: (userId: string) => database.select().from(AssetAccountModel).where(owned(userId)),
    find: async (userId: string, id: string) =>
      (
        await database
          .select()
          .from(AssetAccountModel)
          .where(and(owned(userId), eq(AssetAccountModel.id, id)))
      )[0],
    create: async (userId: string, data: Omit<typeof AssetAccountModel.$inferInsert, 'userId'>) =>
      (
        await database
          .insert(AssetAccountModel)
          .values({ ...data, userId })
          .returning()
      )[0],
    update: async (
      userId: string,
      id: string,
      version: number,
      data: Partial<
        Omit<typeof AssetAccountModel.$inferInsert, 'userId' | 'id' | 'createdAt' | 'deletedAt'>
      >,
    ) =>
      (
        await database
          .update(AssetAccountModel)
          .set({
            ...data,
            updatedAt: new Date().toISOString(),
            version: sql`${AssetAccountModel.version}+1`,
          })
          .where(
            and(
              owned(userId),
              eq(AssetAccountModel.id, id),
              eq(AssetAccountModel.version, version),
            ),
          )
          .returning()
      )[0],
    remove: async (userId: string, id: string, version: number) =>
      (
        await database
          .update(AssetAccountModel)
          .set({
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: sql`${AssetAccountModel.version}+1`,
          })
          .where(
            and(
              owned(userId),
              eq(AssetAccountModel.id, id),
              eq(AssetAccountModel.version, version),
            ),
          )
          .returning()
      )[0],
    removeAll: (userId: string) =>
      database.delete(AssetAccountModel).where(eq(AssetAccountModel.userId, userId)),
  };
}
