import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { UserModel } from './user.model.ts';
export const LegacySessionModel = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => UserModel.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (transaction) => [
    index('sessions_owner_idx').on(transaction.userId),
    index('sessions_expiry_idx').on(transaction.expiresAt),
  ],
).enableRLS();
