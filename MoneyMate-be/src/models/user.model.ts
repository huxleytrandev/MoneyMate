import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  boolean,
  date,
  check,
} from 'drizzle-orm/pg-core';
export const UserModel = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 254 }).notNull().unique(),
    displayName: varchar('display_name', { length: 100 }).notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    gender: text('gender'),
    dateOfBirth: date('date_of_birth', { mode: 'string' }),
    avatarData: text('avatar_data'),
    // Retained for staged schema cleanup; Better Auth never reads this legacy column.
    legacyPasswordHash: text('password_hash'),
    timezone: text('timezone').default('Asia/Ho_Chi_Minh').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('users_created_idx').on(table.createdAt),
    check(
      'users_gender_check',
      sql`gender is null or gender in ('male', 'female', 'other', 'undisclosed')`,
    ),
  ],
).enableRLS();
