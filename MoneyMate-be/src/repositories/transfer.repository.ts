import { and, eq, isNull, sql } from 'drizzle-orm';
import { TransferModel } from '../models/index.ts';
import type { Executor } from '../types/database.types.ts';
export function transferRepository(database: Executor) {
  const owned = (userId: string) =>
    and(eq(TransferModel.userId, userId), isNull(TransferModel.deletedAt));
  return {
    list: (userId: string) => database.select().from(TransferModel).where(owned(userId)),
    find: async (userId: string, id: string) =>
      (
        await database
          .select()
          .from(TransferModel)
          .where(and(owned(userId), eq(TransferModel.id, id)))
      )[0],
    create: async (userId: string, data: Omit<typeof TransferModel.$inferInsert, 'userId'>) =>
      (
        await database
          .insert(TransferModel)
          .values({ ...data, userId })
          .returning()
      )[0],
    update: async (
      userId: string,
      id: string,
      version: number,
      data: Partial<
        Omit<typeof TransferModel.$inferInsert, 'userId' | 'id' | 'createdAt' | 'deletedAt'>
      >,
    ) =>
      (
        await database
          .update(TransferModel)
          .set({
            ...data,
            updatedAt: new Date().toISOString(),
            version: sql`${TransferModel.version}+1`,
          })
          .where(and(owned(userId), eq(TransferModel.id, id), eq(TransferModel.version, version)))
          .returning()
      )[0],
    remove: async (userId: string, id: string, version: number) =>
      (
        await database
          .update(TransferModel)
          .set({
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: sql`${TransferModel.version}+1`,
          })
          .where(and(owned(userId), eq(TransferModel.id, id), eq(TransferModel.version, version)))
          .returning()
      )[0],
    removeAll: (userId: string) =>
      database.delete(TransferModel).where(eq(TransferModel.userId, userId)),
  };
}
