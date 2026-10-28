import { sql } from 'drizzle-orm';
import {
  AssetAccountModel,
  CategoryModel,
  MonthlyPlanModel,
  TransferModel,
  AssetAdjustmentModel,
} from '../models/index.ts';
import type { Executor } from '../types/database.types.ts';
import type {
  FinanceReadQuery,
  ReadUser,
  TransactionReadResult,
} from '../types/finance-read.types.ts';
import { jsonRecord } from './sql-json.ts';
import { transactionReadCtes, transactionPageColumns } from './transaction-read.repository.ts';

interface StateWindowRow extends TransactionReadResult {
  assets: unknown[];
  categories: unknown[];
  plans: unknown[];
  transfers: unknown[];
  adjustments: unknown[];
  actualByCategory: Record<string, string>;
}
function assetBalanceCtes(userId: string) {
  return sql`owned_assets AS (
    SELECT * FROM asset_accounts WHERE user_id=${userId} AND deleted_at IS NULL
  ), balance_movements AS (
    SELECT allocation.asset_account_id AS asset_id,
      sum(CASE WHEN entry.kind='income' THEN allocation.amount ELSE -allocation.amount END) AS amount
      FROM transaction_allocations allocation
      JOIN LATERAL (
        -- Keep the primary-key lookup inside this barrier: fresh owners can have stale row estimates.
        SELECT movement.kind, movement.user_id, movement.deleted_at, movement.occurred_at
        FROM transactions movement WHERE movement.id=allocation.transaction_id OFFSET 0
      ) entry ON entry.user_id=${userId} AND entry.deleted_at IS NULL AND entry.occurred_at<=now()
      WHERE allocation.user_id=${userId}
      GROUP BY allocation.asset_account_id
    UNION ALL SELECT from_asset_account_id, -sum(amount) FROM transfers
      WHERE user_id=${userId} AND deleted_at IS NULL AND occurred_at<=now() GROUP BY from_asset_account_id
    UNION ALL SELECT to_asset_account_id, sum(amount) FROM transfers
      WHERE user_id=${userId} AND deleted_at IS NULL AND occurred_at<=now() GROUP BY to_asset_account_id
    UNION ALL SELECT asset_account_id, sum(delta_amount) FROM asset_adjustments
      WHERE user_id=${userId} AND deleted_at IS NULL AND occurred_at<=now() GROUP BY asset_account_id
  ), balances AS (SELECT asset_id, sum(amount) AS amount FROM balance_movements GROUP BY asset_id)`;
}
export function stateWindowRepository(database: Executor) {
  async function read(user: ReadUser, query: FinanceReadQuery & { month: string }) {
    const assets = jsonRecord(AssetAccountModel, 'asset');
    const categories = jsonRecord(CategoryModel, 'category');
    const plans = jsonRecord(MonthlyPlanModel, 'plan');
    const transfers = jsonRecord(TransferModel, 'transfer');
    const adjustments = jsonRecord(AssetAdjustmentModel, 'adjustment');
    const result = await database.execute<StateWindowRow>(sql`
      WITH ${transactionReadCtes(user, query)}, ${assetBalanceCtes(user.id)}
      SELECT ${transactionPageColumns(user.id)},
      coalesce((SELECT jsonb_agg(${assets} || jsonb_build_object('currentBalance',
        (CASE WHEN asset.opening_at>now() THEN 0 ELSE asset.opening_value+coalesce(balance.amount,0) END)::text)
        ORDER BY asset.created_at, asset.id) FROM owned_assets asset
        LEFT JOIN balances balance ON balance.asset_id=asset.id),'[]'::jsonb) AS assets,
      coalesce((SELECT jsonb_agg(${categories} ORDER BY category.sort_order,category.created_at,category.id)
        FROM categories category WHERE category.user_id=${user.id} AND category.deleted_at IS NULL),'[]'::jsonb) AS categories,
      coalesce((SELECT jsonb_agg(${plans} ORDER BY plan.category_id) FROM monthly_category_plans plan
        WHERE plan.user_id=${user.id} AND plan.deleted_at IS NULL AND plan.month=${query.month + '-01'}::date),'[]'::jsonb) AS plans,
      coalesce((SELECT jsonb_agg(${transfers} ORDER BY transfer.occurred_at DESC,transfer.id DESC)
        FROM (SELECT * FROM transfers WHERE user_id=${user.id} AND deleted_at IS NULL
          ORDER BY occurred_at DESC NULLS LAST,id DESC NULLS LAST LIMIT ${query.limit}) transfer),'[]'::jsonb) AS transfers,
      coalesce((SELECT jsonb_agg(${adjustments} ORDER BY adjustment.occurred_at DESC,adjustment.id DESC)
        FROM (SELECT * FROM asset_adjustments WHERE user_id=${user.id} AND deleted_at IS NULL
          ORDER BY occurred_at DESC NULLS LAST,id DESC NULLS LAST LIMIT ${query.limit}) adjustment),'[]'::jsonb) AS adjustments,
      coalesce((SELECT jsonb_object_agg(category_id,amount::text) FROM
        (SELECT category_id,sum(amount) AS amount FROM filtered_entries GROUP BY category_id) actual),'{}'::jsonb) AS "actualByCategory"
    `);
    return result.rows[0];
  }
  return { read };
}
