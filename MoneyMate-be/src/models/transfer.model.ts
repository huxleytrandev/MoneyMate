import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  bigint,
  timestamp,
  index,
  check,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { auditColumns } from './common.model.ts';
import { UserModel } from './user.model.ts';
import { AssetAccountModel } from './asset-account.model.ts';

export const TransferModel = pgTable(
  'transfers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => UserModel.id, { onDelete: 'restrict' }),
    fromAssetAccountId: uuid('from_asset_account_id').notNull(),
    toAssetAccountId: uuid('to_asset_account_id').notNull(),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' }).notNull(),
    note: text('note'),
    ...auditColumns(),
  },
  (t) => [
    foreignKey({
      name: 'transfers_source_owner_fk',
      columns: [t.userId, t.fromAssetAccountId],
      foreignColumns: [AssetAccountModel.userId, AssetAccountModel.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'transfers_target_owner_fk',
      columns: [t.userId, t.toAssetAccountId],
      foreignColumns: [AssetAccountModel.userId, AssetAccountModel.id],
    }).onDelete('restrict'),
    index('transfers_source_date_idx').on(t.userId, t.fromAssetAccountId, t.occurredAt),
    index('transfers_target_date_idx').on(t.userId, t.toAssetAccountId, t.occurredAt),
    check(
      'transfers_different_accounts_check',
      sql`"from_asset_account_id" <> "to_asset_account_id"`,
    ),
    check('transfers_amount_check', sql`"amount" > 0`),
    check('transfers_version_check', sql`"version" >= 1`),
  ],
).enableRLS();
