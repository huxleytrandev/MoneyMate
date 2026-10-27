import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  bigint,
  timestamp,
  unique,
  index,
  check,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { UserModel } from './user.model.ts';
import { AssetAccountModel } from './asset-account.model.ts';
import { TransactionModel } from './transaction.model.ts';

export const TransactionAllocationModel = pgTable(
  'transaction_allocations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => UserModel.id, { onDelete: 'restrict' }),
    transactionId: uuid('transaction_id').notNull(),
    assetAccountId: uuid('asset_account_id').notNull(),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.userId, t.transactionId],
      foreignColumns: [TransactionModel.userId, TransactionModel.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'allocations_owner_asset_fk',
      columns: [t.userId, t.assetAccountId],
      foreignColumns: [AssetAccountModel.userId, AssetAccountModel.id],
    }).onDelete('restrict'),
    unique('allocations_transaction_asset_unique').on(t.transactionId, t.assetAccountId),
    index('allocations_asset_idx').on(t.userId, t.assetAccountId),
    check('allocations_amount_check', sql`"amount" > 0`),
  ],
).enableRLS();
