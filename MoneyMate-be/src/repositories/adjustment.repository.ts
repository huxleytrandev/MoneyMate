import { and, eq, isNull, sql } from 'drizzle-orm';
import { AssetAdjustmentModel } from '../models/index.ts';
import type { Executor } from '../types/database.types.ts';
export function adjustmentRepository(database: Executor) {
  const owned = (userId: string) =>
    and(eq(AssetAdjustmentModel.userId, userId), isNull(AssetAdjustmentModel.deletedAt));
  return {
    list: (userId: string) => database.select().from(AssetAdjustmentModel).where(owned(userId)),
    find: async (userId: string, id: string) =>
      (
        await database
          .select()
          .from(AssetAdjustmentModel)
          .where(and(owned(userId), eq(AssetAdjustmentModel.id, id)))
      )[0],
    create: async (
      userId: string,
      data: Omit<typeof AssetAdjustmentModel.$inferInsert, 'userId'>,
    ) =>
      (
        await database
          .insert(AssetAdjustmentModel)
          .values({ ...data, userId })
          .returning()
      )[0],
    update: async (
      userId: string,
      id: string,
      version: number,
      data: Partial<
        Omit<typeof AssetAdjustmentModel.$inferInsert, 'userId' | 'id' | 'createdAt' | 'deletedAt'>
      >,
    ) =>
      (
        await database
          .update(AssetAdjustmentModel)
          .set({
            ...data,
            updatedAt: new Date().toISOString(),
            version: sql`${AssetAdjustmentModel.version}+1`,
          })
          .where(
            and(
              owned(userId),
              eq(AssetAdjustmentModel.id, id),
              eq(AssetAdjustmentModel.version, version),
            ),
          )
          .returning()
      )[0],
    remove: async (userId: string, id: string, version: number) =>
      (
        await database
          .update(AssetAdjustmentModel)
          .set({
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: sql`${AssetAdjustmentModel.version}+1`,
          })
          .where(
            and(
              owned(userId),
              eq(AssetAdjustmentModel.id, id),
              eq(AssetAdjustmentModel.version, version),
            ),
          )
          .returning()
      )[0],
    removeAll: (userId: string) =>
      database.delete(AssetAdjustmentModel).where(eq(AssetAdjustmentModel.userId, userId)),
  };
}
