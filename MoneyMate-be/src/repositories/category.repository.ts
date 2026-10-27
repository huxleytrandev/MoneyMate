import { and, eq, isNull, sql } from 'drizzle-orm';
import { CategoryModel } from '../models/index.ts';
import type { Executor } from '../types/database.types.ts';
export function categoryRepository(database: Executor) {
  const owned = (userId: string) =>
    and(eq(CategoryModel.userId, userId), isNull(CategoryModel.deletedAt));
  return {
    list: (userId: string) => database.select().from(CategoryModel).where(owned(userId)),
    find: async (userId: string, id: string) =>
      (
        await database
          .select()
          .from(CategoryModel)
          .where(and(owned(userId), eq(CategoryModel.id, id)))
      )[0],
    create: async (userId: string, data: Omit<typeof CategoryModel.$inferInsert, 'userId'>) =>
      (
        await database
          .insert(CategoryModel)
          .values({ ...data, userId })
          .returning()
      )[0],
    update: async (
      userId: string,
      id: string,
      version: number,
      data: Partial<
        Omit<typeof CategoryModel.$inferInsert, 'userId' | 'id' | 'createdAt' | 'deletedAt'>
      >,
    ) =>
      (
        await database
          .update(CategoryModel)
          .set({
            ...data,
            updatedAt: new Date().toISOString(),
            version: sql`${CategoryModel.version}+1`,
          })
          .where(and(owned(userId), eq(CategoryModel.id, id), eq(CategoryModel.version, version)))
          .returning()
      )[0],
    remove: async (userId: string, id: string, version: number) =>
      (
        await database
          .update(CategoryModel)
          .set({
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: sql`${CategoryModel.version}+1`,
          })
          .where(and(owned(userId), eq(CategoryModel.id, id), eq(CategoryModel.version, version)))
          .returning()
      )[0],
    removeAll: (userId: string) =>
      database.delete(CategoryModel).where(eq(CategoryModel.userId, userId)),
  };
}
