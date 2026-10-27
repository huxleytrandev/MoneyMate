import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
export const AuthVerificationModel = pgTable(
  'auth_verifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('auth_verifications_identifier_idx').on(table.identifier)],
).enableRLS();
