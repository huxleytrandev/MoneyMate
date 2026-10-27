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

export const AssetAdjustmentModel = pgTable(
  'asset_adjustments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => UserModel.id, { onDelete: 'restrict' }),
    assetAccountId: uuid('asset_account_id').notNull(),
    deltaAmount: bigint('delta_amount', { mode: 'bigint' }).notNull(),
    reason: text('reason', { enum: ['valuation', 'reconciliation'] }).notNull(),
    note: text('note').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' }).notNull(),
    ...auditColumns(),
  },
  (t) => [
    foreignKey({
      name: 'adjustments_owner_asset_fk',
      columns: [t.userId, t.assetAccountId],
      foreignColumns: [AssetAccountModel.userId, AssetAccountModel.id],
    }).onDelete('restrict'),
    index('adjustments_asset_date_idx').on(t.userId, t.assetAccountId, t.occurredAt),
    check('adjustments_amount_check', sql`"delta_amount" <> 0`),
    check('adjustments_reason_check', sql`"reason" in ('valuation','reconciliation')`),
    check('adjustments_note_check', sql`length(trim("note")) > 0`),
    check('asset_adjustments_version_check', sql`"version" >= 1`),
  ],
).enableRLS();
