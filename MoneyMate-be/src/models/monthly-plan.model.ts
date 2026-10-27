import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  bigint,
  date,
  uniqueIndex,
  check,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { auditColumns } from './common.model.ts';
import { UserModel } from './user.model.ts';
import { CategoryModel } from './category.model.ts';

export const MonthlyPlanModel = pgTable(
  'monthly_category_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => UserModel.id, { onDelete: 'restrict' }),
    categoryId: uuid('category_id').notNull(),
    kind: text('kind', { enum: ['income', 'expense'] }).notNull(),
    month: date('month', { mode: 'string' }).notNull(),
    plannedAmount: bigint('planned_amount', { mode: 'bigint' }).notNull(),
    note: text('note'),
    ...auditColumns(),
  },
  (t) => [
    foreignKey({
      columns: [t.userId, t.categoryId, t.kind],
      foreignColumns: [CategoryModel.userId, CategoryModel.id, CategoryModel.kind],
    }).onDelete('restrict'),
    uniqueIndex('plans_active_category_month_unique')
      .on(t.userId, t.categoryId, t.month)
      .where(sql`"deleted_at" is null`),
    check('plans_month_check', sql`extract(day from "month") = 1`),
    check('plans_amount_check', sql`"planned_amount" >= 0`),
    check('monthly_category_plans_version_check', sql`"version" >= 1`),
  ],
).enableRLS();
