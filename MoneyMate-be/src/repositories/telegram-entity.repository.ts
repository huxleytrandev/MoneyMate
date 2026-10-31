import { z } from 'zod';
import { monthWindow } from '../utils/month-window.ts';
import { getTableName, sql } from 'drizzle-orm';
import {
  AssetAccountModel,
  CategoryModel,
  MonthlyPlanModel,
  TransactionModel,
  TransferModel,
  AssetAdjustmentModel,
} from '../models/index.ts';
import { jsonRecord } from './sql-json.ts';
import type { Executor } from '../types/database.types.ts';
import type { ResourceName } from '../schemas/api.schema.ts';
const tables = {
  assets: AssetAccountModel,
  categories: CategoryModel,
  plans: MonthlyPlanModel,
  transactions: TransactionModel,
  transfers: TransferModel,
  adjustments: AssetAdjustmentModel,
};
export type BotRecord = Record<string, unknown> & { id: string; version: number };
function normalizeSql(expression: ReturnType<typeof sql>) {
  return sql`regexp_replace(translate(lower(${expression}), 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'), '[^a-z0-9]', '', 'g')`;
}
export function telegramEntityRepository(db: Executor) {
  async function choices(input: {
    userId: string;
    resource: ResourceName;
    search?: string;
    page?: number;
    kind?: string;
    active?: boolean;
    month?: string;
    timezone?: string;
    assetType?: string;
    categoryId?: string;
  }) {
    if (input.month)
      z.string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
        .parse(input.month);
    const table = tables[input.resource];
    const nameColumn =
      input.resource === 'transactions'
        ? 'title'
        : input.resource === 'assets' || input.resource === 'categories'
          ? 'name'
          : 'note';
    const name =
      input.resource === 'plans'
        ? sql`coalesce((select c.name from categories c where c.id=entry.category_id and c.user_id=entry.user_id),'')`
        : sql`entry.${sql.identifier(nameColumn)}`;
    const needle = input.search?.trim() ?? '';
    const reference = /^[a-f0-9-]{6,36}$/i.test(needle)
      ? sql`entry.id::text like ${needle + '%'}`
      : sql`strpos(${normalizeSql(name)}, ${normalizeSql(sql`${needle}`)}) > 0`;
    const filters = [sql`entry.user_id=${input.userId}::uuid`, sql`entry.deleted_at is null`];
    if (needle) filters.push(reference);
    if (input.assetType && input.resource === 'assets')
      filters.push(sql`entry.type=${input.assetType}`);
    if (input.kind && ['transactions', 'categories', 'plans'].includes(input.resource))
      filters.push(sql`entry.kind=${input.kind}`);
    if (input.active && ['assets', 'categories'].includes(input.resource))
      filters.push(sql`not entry.is_archived`);
    if (input.categoryId && input.resource === 'plans')
      filters.push(sql`entry.category_id=${input.categoryId}::uuid`);
    if (input.month && input.resource === 'plans')
      filters.push(sql`entry.month=${input.month + '-01'}::date`);
    if (input.month && ['transactions', 'transfers', 'adjustments'].includes(input.resource)) {
      const window = monthWindow(input.month, input.timezone ?? 'UTC');
      filters.push(
        sql`entry.occurred_at >= ${window.start}::timestamptz and entry.occurred_at < ${window.end}::timestamptz`,
      );
    }
    const rows = await db.execute<{ record: BotRecord }>(
      sql`select ${jsonRecord(table, 'entry')} || jsonb_build_object('_label',${name}) as record from ${sql.identifier(getTableName(table))} entry where ${sql.join(filters, sql` and `)} order by entry.created_at desc,entry.id desc limit 9 offset ${Math.max(0, (input.page ?? 1) - 1) * 8}`,
    );
    return { data: rows.rows.slice(0, 8).map((row) => row.record), hasMore: rows.rows.length > 8 };
  }
  return { choices };
}
