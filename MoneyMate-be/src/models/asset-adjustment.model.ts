import { ADJUSTMENT_REASONS } from '../constants/finance.constant.ts';
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
    reason: text('reason', { enum: ADJUSTMENT_REASONS }).notNull(),
    note: text('note').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' }).notNull(),
    ...auditColumns(),
  },
  (adjustment) => [
    index('adjustments_active_owner_date_idx')
      .on(adjustment.userId, adjustment.occurredAt.desc(), adjustment.id.desc())
      .where(sql`"deleted_at" is null`),
    foreignKey({
      name: 'adjustments_owner_asset_fk',
      columns: [adjustment.userId, adjustment.assetAccountId],
      foreignColumns: [AssetAccountModel.userId, AssetAccountModel.id],
    }).onDelete('restrict'),
    index('adjustments_asset_date_idx').on(
      adjustment.userId,
      adjustment.assetAccountId,
      adjustment.occurredAt,
    ),
    check('adjustments_amount_check', sql`"delta_amount" <> 0`),
    check('adjustments_reason_check', sql`"reason" in ('valuation','reconciliation')`),
    check('adjustments_note_check', sql`length(trim("note")) > 0`),
    check('asset_adjustments_version_check', sql`"version" >= 1`),
  ],
).enableRLS();
