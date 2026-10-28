import { sql, getTableName } from 'drizzle-orm';
import {
  AssetAccountModel,
  CategoryModel,
  MonthlyPlanModel,
  TransactionModel,
  TransferModel,
  AssetAdjustmentModel,
  TransactionAllocationModel,
} from '../models/index.ts';
import type { Executor } from '../types/database.types.ts';
import type { ResourceName } from '../schemas/api.schema.ts';
import type { FinanceReadQuery } from '../types/finance-read.types.ts';
import { jsonRecord } from './sql-json.ts';
const tables = {
  assets: AssetAccountModel,
  categories: CategoryModel,
  plans: MonthlyPlanModel,
  transactions: TransactionModel,
  transfers: TransferModel,
  adjustments: AssetAdjustmentModel,
};
export function resourceReadRepository(database: Executor) {
  async function page(userId: string, resource: ResourceName, query: FinanceReadQuery) {
    const table = tables[resource],
      record = jsonRecord(table, 'entry');
    const historyFilter =
      resource === 'adjustments' && query.assetId
        ? sql`AND asset_account_id=${query.assetId}::uuid`
        : sql.raw('');
    const sortColumn = sql.identifier(
      resource === 'transfers' || resource === 'adjustments' ? 'occurred_at' : 'created_at',
    );
    const rowSortColumn = sql`entry.${sortColumn}`;
    const result = await database.execute<{ data: unknown[]; total: number }>(sql`
      WITH owned AS NOT MATERIALIZED (
        SELECT * FROM ${sql.identifier(getTableName(table))} WHERE user_id=${userId} AND deleted_at IS NULL ${historyFilter}
      ), rows AS (SELECT * FROM owned ORDER BY ${sortColumn} DESC NULLS LAST,id DESC NULLS LAST LIMIT ${query.limit} OFFSET ${(query.page - 1) * query.limit})
      SELECT coalesce((SELECT jsonb_agg(${record} ORDER BY ${rowSortColumn} DESC NULLS LAST,entry.id DESC NULLS LAST) FROM rows entry),'[]'::jsonb) AS data,
        (SELECT count(*)::integer FROM owned) AS total
    `);
    return result.rows[0];
  }
  async function find(userId: string, resource: ResourceName, id: string) {
    const table = tables[resource],
      record = jsonRecord(table, 'entry');
    const allocations =
      resource === 'transactions'
        ? sql` || jsonb_build_object('allocations',coalesce((SELECT jsonb_agg(${jsonRecord(TransactionAllocationModel, 'allocation')} ORDER BY allocation.id)
        FROM transaction_allocations allocation WHERE allocation.user_id=${userId} AND allocation.transaction_id=entry.id),'[]'::jsonb))`
        : sql.raw('');
    const result = await database.execute<{ record: Record<string, unknown> }>(sql`
      SELECT ${record}${allocations} AS record FROM ${sql.identifier(getTableName(table))} entry
      WHERE entry.user_id=${userId} AND entry.id=${id}::uuid AND entry.deleted_at IS NULL LIMIT 1
    `);
    return result.rows[0]?.record;
  }
  return { page, find };
}
