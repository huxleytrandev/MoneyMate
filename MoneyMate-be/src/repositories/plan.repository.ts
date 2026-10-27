import { and, eq, isNull, sql } from 'drizzle-orm';
import { MonthlyPlanModel } from '../models/index.ts';
import type { Executor } from '../types/database.types.ts';
export function planRepository(database: Executor) {
  const owned = (userId: string) =>
    and(eq(MonthlyPlanModel.userId, userId), isNull(MonthlyPlanModel.deletedAt));
  return {
    list: (userId: string) => database.select().from(MonthlyPlanModel).where(owned(userId)),
    find: async (userId: string, id: string) =>
      (
        await database
          .select()
          .from(MonthlyPlanModel)
          .where(and(owned(userId), eq(MonthlyPlanModel.id, id)))
      )[0],
    create: async (userId: string, data: Omit<typeof MonthlyPlanModel.$inferInsert, 'userId'>) =>
      (
        await database
          .insert(MonthlyPlanModel)
          .values({ ...data, userId })
          .returning()
      )[0],
    update: async (
      userId: string,
      id: string,
      version: number,
      data: Partial<
        Omit<typeof MonthlyPlanModel.$inferInsert, 'userId' | 'id' | 'createdAt' | 'deletedAt'>
      >,
    ) =>
      (
        await database
          .update(MonthlyPlanModel)
          .set({
            ...data,
            updatedAt: new Date().toISOString(),
            version: sql`${MonthlyPlanModel.version}+1`,
          })
          .where(
            and(owned(userId), eq(MonthlyPlanModel.id, id), eq(MonthlyPlanModel.version, version)),
          )
          .returning()
      )[0],
    remove: async (userId: string, id: string, version: number) =>
      (
        await database
          .update(MonthlyPlanModel)
          .set({
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: sql`${MonthlyPlanModel.version}+1`,
          })
          .where(
            and(owned(userId), eq(MonthlyPlanModel.id, id), eq(MonthlyPlanModel.version, version)),
          )
          .returning()
      )[0],
    removeAll: (userId: string) =>
      database.delete(MonthlyPlanModel).where(eq(MonthlyPlanModel.userId, userId)),
  };
}
