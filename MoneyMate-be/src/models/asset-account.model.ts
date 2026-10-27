import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  bigint,
  timestamp,
  boolean,
  unique,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { auditColumns } from './common.model.ts';
import { UserModel } from './user.model.ts';

export const AssetAccountModel = pgTable(
  'asset_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => UserModel.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 100 }).notNull(),
    type: text('type', { enum: ['cash', 'bank', 'other'] }).notNull(),
    openingValue: bigint('opening_value', { mode: 'bigint' }).notNull(),
    openingAt: timestamp('opening_at', { withTimezone: true, mode: 'string' }).notNull(),
    note: text('note'),
    isArchived: boolean('is_archived').default(false).notNull(),
    ...auditColumns(),
  },
  (t) => [
    unique('assets_owner_id_unique').on(t.userId, t.id),
    index('assets_owner_idx').on(t.userId),
    check('assets_type_check', sql`'cash' = "type" or "type" in ('bank','other')`),
    check('assets_value_check', sql`"opening_value" >= 0`),
    check('asset_accounts_version_check', sql`"version" >= 1`),
  ],
).enableRLS();
