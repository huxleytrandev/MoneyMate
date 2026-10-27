import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  unique,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { auditColumns } from './common.model.ts';
import { UserModel } from './user.model.ts';

export const CategoryModel = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => UserModel.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 100 }).notNull(),
    kind: text('kind', { enum: ['income', 'expense'] }).notNull(),
    icon: varchar('icon', { length: 50 }),
    color: varchar('color', { length: 7 }),
    sortOrder: integer('sort_order').default(0).notNull(),
    isArchived: boolean('is_archived').default(false).notNull(),
    ...auditColumns(),
  },
  (t) => [
    unique('categories_owner_id_kind_unique').on(t.userId, t.id, t.kind),
    index('categories_owner_idx').on(t.userId),
    check('categories_kind_check', sql`"kind" in ('income','expense')`),
    check('categories_sort_check', sql`"sort_order" >= 0`),
    check('categories_version_check', sql`"version" >= 1`),
  ],
).enableRLS();
