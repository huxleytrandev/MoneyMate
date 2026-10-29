import { sqlLocalTime } from '../utils/sql-timezone.ts';
import { monthWindow } from '../utils/month-window.ts';
import { sql, type SQL } from 'drizzle-orm';
import { TransactionModel, TransactionAllocationModel } from '../models/index.ts';
import type { Executor } from '../types/database.types.ts';
import type {
  FinanceReadQuery,
  ReadUser,
  TransactionReadResult,
} from '../types/finance-read.types.ts';
import { decodeTransactionCursor } from '../utils/pagination.ts';
import { jsonRecord } from './sql-json.ts';

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}
function literalLike(value: string) {
  return '%' + normalizeSearch(value).replace(/[\\%_]/g, (character) => '\\' + character) + '%';
}
function monthPredicate(month: string, timezone: string) {
  const window = monthWindow(month, timezone);
  return sql`entry.occurred_at >= ${window.start}::timestamptz AND entry.occurred_at < ${window.end}::timestamptz`;
}
function searchPredicate(search: string, userId: string) {
  const pattern = literalLike(search);
  return sql`replace(regexp_replace(normalize(lower(concat(
    entry.title, ' ', entry.amount::text, ' ',
    (SELECT category.name FROM categories category WHERE category.id=entry.category_id AND category.user_id=${userId}), ' ',
    (SELECT string_agg(asset.name, ' ') FROM transaction_allocations allocation
      JOIN asset_accounts asset ON asset.id=allocation.asset_account_id AND asset.user_id=${userId}
      WHERE allocation.user_id=${userId} AND allocation.transaction_id=entry.id)
  )), NFD), U&'[\\0300-\\036f]', '', 'g'), 'đ', 'd') LIKE ${pattern}`;
}
function transactionPredicates(user: ReadUser, query: FinanceReadQuery) {
  const filters: SQL[] = [sql`entry.user_id=${user.id} AND entry.deleted_at IS NULL`];
  if (query.month) filters.push(monthPredicate(query.month, user.timezone));
  if (query.categoryId) filters.push(sql`entry.category_id=${query.categoryId}::uuid`);
  if (query.kind) filters.push(sql`entry.kind=${query.kind}`);
  if (query.assetType)
    filters.push(sql`EXISTS (
    SELECT 1 FROM transaction_allocations allocation JOIN asset_accounts asset
      ON asset.id=allocation.asset_account_id AND asset.user_id=${user.id}
    WHERE allocation.user_id=${user.id} AND allocation.transaction_id=entry.id AND asset.type=${query.assetType}
  )`);
  if (query.search) filters.push(searchPredicate(query.search, user.id));
  return sql.join(filters, sql.raw(' AND '));
}
function cursorPredicate(cursor?: string) {
  const position = decodeTransactionCursor(cursor);
  if (!position) return sql`true`;
  return sql`(occurred_at, id) < (${position.occurredAt}::timestamptz, ${position.id}::uuid)`;
}
// Keep the page lookup correlated by primary key: stale owner statistics must not rescan the whole history for each selected row.
export function transactionReadCtes(user: ReadUser, query: FinanceReadQuery) {
  const offset = query.cursor ? 0 : (query.page - 1) * query.limit;
  const materialization = sql.raw(query.search ? 'MATERIALIZED' : 'NOT MATERIALIZED');
  const localizedDate = sqlLocalTime(sql`occurred_at`, user.timezone);
  return sql`filtered_entries AS ${materialization} (
    SELECT entry.id,entry.occurred_at,entry.amount,entry.kind,entry.category_id
    FROM transactions entry WHERE ${transactionPredicates(user, query)}
  ), paged_entries AS (
    SELECT entry.* FROM (
      SELECT id FROM filtered_entries WHERE ${cursorPredicate(query.cursor)}
      ORDER BY occurred_at DESC NULLS LAST,id DESC NULLS LAST LIMIT ${query.limit + 1} OFFSET ${offset}
    ) selected
    JOIN LATERAL (
      SELECT * FROM transactions WHERE id=selected.id OFFSET 0
    ) entry ON entry.user_id=${user.id}
  ), actual_days AS (
    SELECT (${localizedDate})::date::text AS day,
      coalesce(sum(amount) FILTER (WHERE kind='income'),0) AS income,
      coalesce(sum(amount) FILTER (WHERE kind='expense'),0) AS expense,
      count(*) AS total
    FROM filtered_entries GROUP BY day
  )`;
}
export function transactionPageColumns(userId: string) {
  const transaction = jsonRecord(TransactionModel, 'page_entry');
  const allocation = jsonRecord(TransactionAllocationModel, 'allocation');
  return sql`
    coalesce((SELECT jsonb_agg(${transaction} || jsonb_build_object('allocations',
      coalesce((SELECT jsonb_agg(${allocation} ORDER BY allocation.id)
        FROM transaction_allocations allocation
        WHERE allocation.user_id=${userId} AND allocation.transaction_id=page_entry.id), '[]'::jsonb)
    ) ORDER BY page_entry.occurred_at DESC, page_entry.id DESC) FROM paged_entries page_entry),'[]'::jsonb) AS data,
    (SELECT jsonb_build_object('income',coalesce(sum(income),0)::text,
      'expense',coalesce(sum(expense),0)::text,'total',coalesce(sum(total),0)::integer) FROM actual_days) AS totals,
    coalesce((SELECT jsonb_object_agg(day,jsonb_build_object('income',income::text,'expense',expense::text))
      FROM actual_days),'{}'::jsonb) AS "dayTotals"
  `;
}
export function transactionReadRepository(database: Executor) {
  async function page(user: ReadUser, query: FinanceReadQuery) {
    const result = await database.execute<TransactionReadResult>(sql`
      WITH ${transactionReadCtes(user, query)} SELECT ${transactionPageColumns(user.id)}
    `);
    return result.rows[0];
  }
  return { page };
}
