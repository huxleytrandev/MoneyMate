import { sqlLocalTime } from '../utils/sql-timezone.ts';
import { sql } from 'drizzle-orm';
import type { Executor } from '../types/database.types.ts';
import type { RawStatisticsAggregates, StatisticsAggregates } from '../types/statistics.types.ts';

interface StatisticsQuery {
  userId: string;
  timezone: string;
  start: string;
  end: string;
  now: number;
}
import { dayEnd } from '../utils/statistics.ts';

function dayBefore(day: string) {
  return new Date(Date.parse(day + 'T12:00:00Z') - 86400000).toISOString().slice(0, 10);
}
function beginningOfDay(day: string, timezone: string) {
  return dayEnd(dayBefore(day), timezone) + 1;
}
function reportBoundaries(input: StatisticsQuery) {
  const firstMonth = (input.start < input.end ? input.start : input.end).slice(0, 7) + '-01';
  const nextMonth = new Date(input.end.slice(0, 7) + '-01T12:00:00Z');
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  return {
    start: new Date(beginningOfDay(input.start, input.timezone)).toISOString(),
    cutoff: new Date(Math.min(dayEnd(input.end, input.timezone) + 1, input.now + 1)).toISOString(),
    monthStart: new Date(beginningOfDay(firstMonth, input.timezone)).toISOString(),
    monthEnd: new Date(
      beginningOfDay(nextMonth.toISOString().slice(0, 10), input.timezone),
    ).toISOString(),
  };
}

function decodeAggregates(raw: RawStatisticsAggregates): StatisticsAggregates {
  return {
    opening: BigInt(raw.opening),
    wealth: raw.wealth.map((row) => ({ day: row.day, delta: BigInt(row.delta) })),
    actuals: raw.actuals.map((row) => ({
      day: row.day,
      income: BigInt(row.income),
      expense: BigInt(row.expense),
    })),
    monthly: raw.monthly.map((row) => ({
      month: row.month,
      income: BigInt(row.income),
      expense: BigInt(row.expense),
    })),
    categories: raw.categories.map((row) => {
      const planned = row.planned === null ? null : BigInt(row.planned);
      const actual = BigInt(row.actual);
      return { ...row, planned, actual, remaining: planned === null ? null : planned - actual };
    }),
  };
}
export function statisticsRepository(database: Executor) {
  async function aggregate(input: StatisticsQuery) {
    const boundaries = reportBoundaries(input);
    const eventLocalTime = sqlLocalTime(sql`event.occurred_at`, input.timezone);
    const transactionLocalTime = sqlLocalTime(sql`transaction.occurred_at`, input.timezone);
    const result = await database.execute<{ payload: RawStatisticsAggregates }>(sql`
      WITH parameters AS (
        SELECT ${input.userId}::uuid AS owner_id,
          ${input.start}::date AS start_day, ${input.end}::date AS end_day,
          ${boundaries.start}::timestamptz AS start_at,
          ${boundaries.cutoff}::timestamptz AS cutoff,
          ${boundaries.monthStart}::timestamptz AS month_start,
          ${boundaries.monthEnd}::timestamptz AS month_end
      ), assets AS MATERIALIZED (
        SELECT asset.id, asset.opening_at, asset.opening_value
        FROM asset_accounts asset, parameters parameter
        WHERE asset.user_id = parameter.owner_id AND asset.deleted_at IS NULL
      ), wealth_events AS (
        SELECT asset.opening_at AS occurred_at, asset.opening_value::numeric AS delta FROM assets asset
        UNION ALL
        SELECT greatest(transaction.occurred_at, asset.opening_at),
          CASE WHEN transaction.kind = 'income' THEN allocation.amount::numeric ELSE -allocation.amount::numeric END
        FROM transactions transaction
        JOIN transaction_allocations allocation ON allocation.transaction_id = transaction.id AND allocation.user_id = transaction.user_id
        JOIN assets asset ON asset.id = allocation.asset_account_id
        JOIN parameters parameter ON transaction.user_id = parameter.owner_id
        WHERE transaction.deleted_at IS NULL
        UNION ALL
        SELECT greatest(adjustment.occurred_at, asset.opening_at), adjustment.delta_amount::numeric
        FROM asset_adjustments adjustment JOIN assets asset ON asset.id = adjustment.asset_account_id
        JOIN parameters parameter ON adjustment.user_id = parameter.owner_id
        WHERE adjustment.deleted_at IS NULL
        UNION ALL
        SELECT greatest(transfer.occurred_at, asset.opening_at), -transfer.amount::numeric
        FROM transfers transfer JOIN assets asset ON asset.id = transfer.from_asset_account_id
        JOIN parameters parameter ON transfer.user_id = parameter.owner_id
        WHERE transfer.deleted_at IS NULL
        UNION ALL
        SELECT greatest(transfer.occurred_at, asset.opening_at), transfer.amount::numeric
        FROM transfers transfer JOIN assets asset ON asset.id = transfer.to_asset_account_id
        JOIN parameters parameter ON transfer.user_id = parameter.owner_id
        WHERE transfer.deleted_at IS NULL
      ), wealth_summary AS MATERIALIZED (
        SELECT CASE WHEN event.occurred_at < parameter.start_at THEN '__opening'
            ELSE to_char(${eventLocalTime}, 'YYYY-MM-DD') END AS day,
          sum(event.delta)::text AS delta
        FROM wealth_events event CROSS JOIN parameters parameter
        WHERE event.occurred_at < parameter.start_at OR event.occurred_at < parameter.cutoff
        GROUP BY 1
      ), localized_transactions AS MATERIALIZED (
        SELECT transaction.category_id, transaction.kind, transaction.amount,
          to_char(${transactionLocalTime}, 'YYYY-MM-DD') AS day,
          to_char(${transactionLocalTime}, 'YYYY-MM') AS month
        FROM transactions transaction CROSS JOIN parameters parameter
        WHERE transaction.user_id = parameter.owner_id AND transaction.deleted_at IS NULL
          AND transaction.occurred_at >= parameter.month_start AND transaction.occurred_at < parameter.month_end
      ), daily_actuals AS (
        SELECT transaction.day,
          coalesce(sum(transaction.amount) FILTER (WHERE transaction.kind = 'income'), 0)::text AS income,
          coalesce(sum(transaction.amount) FILTER (WHERE transaction.kind = 'expense'), 0)::text AS expense
        FROM localized_transactions transaction CROSS JOIN parameters parameter
        WHERE transaction.day >= parameter.start_day::text AND transaction.day <= parameter.end_day::text
        GROUP BY transaction.day
      ), monthly_actuals AS (
        SELECT transaction.month,
          coalesce(sum(transaction.amount) FILTER (WHERE transaction.kind = 'income'), 0)::text AS income,
          coalesce(sum(transaction.amount) FILTER (WHERE transaction.kind = 'expense'), 0)::text AS expense
        FROM localized_transactions transaction CROSS JOIN parameters parameter
        WHERE transaction.month >= to_char(parameter.start_day, 'YYYY-MM') AND transaction.month <= to_char(parameter.end_day, 'YYYY-MM')
        GROUP BY transaction.month
      ), category_actuals AS (
        SELECT transaction.category_id, sum(transaction.amount) AS actual
        FROM localized_transactions transaction CROSS JOIN parameters parameter
        WHERE transaction.month = to_char(parameter.end_day, 'YYYY-MM')
        GROUP BY transaction.category_id
      ), category_totals AS (
        SELECT category.id, category.name, category.kind, plan.planned_amount::text AS planned,
          coalesce(actual.actual, 0)::text AS actual
        FROM categories category CROSS JOIN parameters parameter
        LEFT JOIN monthly_category_plans plan ON plan.user_id = parameter.owner_id
          AND plan.category_id = category.id AND plan.month = date_trunc('month', parameter.end_day)::date AND plan.deleted_at IS NULL
        LEFT JOIN category_actuals actual ON actual.category_id = category.id
        WHERE category.user_id = parameter.owner_id AND category.deleted_at IS NULL
        ORDER BY category.created_at, category.id
      )
      SELECT json_build_object(
        'opening', coalesce((SELECT delta FROM wealth_summary WHERE day = '__opening'), '0'),
        'wealth', coalesce((SELECT json_agg(row_to_json(row)) FROM (SELECT day, delta FROM wealth_summary WHERE day <> '__opening') row), '[]'::json),
        'actuals', coalesce((SELECT json_agg(row_to_json(row)) FROM daily_actuals row), '[]'::json),
        'monthly', coalesce((SELECT json_agg(row_to_json(row) ORDER BY row.month) FROM monthly_actuals row), '[]'::json),
        'categories', coalesce((SELECT json_agg(row_to_json(row)) FROM category_totals row), '[]'::json)
      ) AS payload
    `);
    return decodeAggregates(result.rows[0].payload);
  }
  return { aggregate };
}
