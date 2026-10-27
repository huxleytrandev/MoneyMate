import { and, eq, isNull, sql } from 'drizzle-orm';
import { TransactionModel } from '../models/index.ts';
import type { Executor } from '../types/database.types.ts';
export function transactionRepository(database: Executor) {
  const owned = (userId: string) =>
    and(eq(TransactionModel.userId, userId), isNull(TransactionModel.deletedAt));
  return {
    list: (userId: string) => database.select().from(TransactionModel).where(owned(userId)),
    find: async (userId: string, id: string) =>
      (
        await database
          .select()
          .from(TransactionModel)
          .where(and(owned(userId), eq(TransactionModel.id, id)))
      )[0],
    create: async (userId: string, data: Omit<typeof TransactionModel.$inferInsert, 'userId'>) =>
      (
        await database
          .insert(TransactionModel)
          .values({ ...data, userId })
          .returning()
      )[0],
    update: async (
      userId: string,
      id: string,
      version: number,
      data: Partial<
        Omit<typeof TransactionModel.$inferInsert, 'userId' | 'id' | 'createdAt' | 'deletedAt'>
      >,
    ) =>
      (
        await database
          .update(TransactionModel)
          .set({
            ...data,
            updatedAt: new Date().toISOString(),
            version: sql`${TransactionModel.version}+1`,
          })
          .where(
            and(owned(userId), eq(TransactionModel.id, id), eq(TransactionModel.version, version)),
          )
          .returning()
      )[0],
    remove: async (userId: string, id: string, version: number) =>
      (
        await database
          .update(TransactionModel)
          .set({
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: sql`${TransactionModel.version}+1`,
          })
          .where(
            and(owned(userId), eq(TransactionModel.id, id), eq(TransactionModel.version, version)),
          )
          .returning()
      )[0],
    removeAll: (userId: string) =>
      database.delete(TransactionModel).where(eq(TransactionModel.userId, userId)),
  };
}
