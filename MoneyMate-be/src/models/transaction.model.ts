import { TRANSACTION_KINDS } from '../constants/finance.constant.ts';
import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  bigint,
  timestamp,
  unique,
  index,
  check,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { auditColumns } from './common.model.ts';
import { UserModel } from './user.model.ts';
import { CategoryModel } from './category.model.ts';

export const TransactionModel = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => UserModel.id, { onDelete: 'restrict' }),
    categoryId: uuid('category_id').notNull(),
    kind: text('kind', { enum: TRANSACTION_KINDS }).notNull(),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    note: text('note'),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' }).notNull(),
    ...auditColumns(),
  },
  (transaction) => [
    unique('transactions_owner_id_unique').on(transaction.userId, transaction.id),
    foreignKey({
      columns: [transaction.userId, transaction.categoryId, transaction.kind],
      foreignColumns: [CategoryModel.userId, CategoryModel.id, CategoryModel.kind],
    }).onDelete('restrict'),
    index('transactions_owner_date_idx').on(transaction.userId, transaction.occurredAt),
    index('transactions_category_date_idx').on(
      transaction.userId,
      transaction.categoryId,
      transaction.occurredAt,
    ),
    check('transactions_amount_check', sql`"amount" > 0`),
    check('transactions_version_check', sql`"version" >= 1`),
  ],
).enableRLS();
