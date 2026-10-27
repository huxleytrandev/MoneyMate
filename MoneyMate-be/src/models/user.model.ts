import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';

export const UserModel = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 254 }).notNull().unique(),
    displayName: varchar('display_name', { length: 100 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    timezone: text('timezone').default('Asia/Ho_Chi_Minh').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (t) => [index('users_created_idx').on(t.createdAt)],
).enableRLS();
