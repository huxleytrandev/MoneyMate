import { TRANSACTION_KINDS } from '../constants/finance.constant.ts';
import { sql } from 'drizzle-orm';
import {
  pgTable,
  index,
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
    kind: text('kind', { enum: TRANSACTION_KINDS }).notNull(),
    month: date('month', { mode: 'string' }).notNull(),
    plannedAmount: bigint('planned_amount', { mode: 'bigint' }).notNull(),
    note: text('note'),
    ...auditColumns(),
  },
  (plan) => [
    index('plans_active_owner_month_idx')
      .on(plan.userId, plan.month)
      .where(sql`"deleted_at" is null`),
    foreignKey({
      columns: [plan.userId, plan.categoryId, plan.kind],
      foreignColumns: [CategoryModel.userId, CategoryModel.id, CategoryModel.kind],
    }).onDelete('restrict'),
    uniqueIndex('plans_active_category_month_unique')
      .on(plan.userId, plan.categoryId, plan.month)
      .where(sql`"deleted_at" is null`),
    check('plans_month_check', sql`extract(day from "month") = 1`),
    check('plans_amount_check', sql`"planned_amount" >= 0`),
    check('monthly_category_plans_version_check', sql`"version" >= 1`),
  ],
).enableRLS();
