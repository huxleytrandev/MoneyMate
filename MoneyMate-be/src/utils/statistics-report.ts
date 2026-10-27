import { dayEnd } from './statistics.ts';
import { balanceAt, localDay, periodKey } from './finance.ts';
import type { FinanceSnapshot } from '../types/finance-snapshot.types.ts';
import type { ReportContext, PeriodTotals, MonthlyTotals } from '../types/statistics.types.ts';

function totalAssetsAt(context: ReportContext, cutoff: number) {
  return context.state.assets.reduce(
    (total, asset) => total + balanceAt(context.state, asset.id, cutoff),
    0n,
  );
}
function reportDays(start: string, end: string) {
  const days: string[] = [];
  const date = new Date(start + 'T12:00:00Z');
  while (date.toISOString().slice(0, 10) <= end) {
    days.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return days;
}
function assetPeriods(context: ReportContext) {
  const periods = new Map<string, PeriodTotals>();
  for (const day of reportDays(context.start, context.end)) {
    const key = periodKey(day, context.period);
    const cutoff = Math.min(dayEnd(day, context.timezone), context.now);
    periods.set(key, { key, income: 0n, expense: 0n, assets: totalAssetsAt(context, cutoff) });
  }
  return periods;
}
export function buildPeriodSeries(context: ReportContext) {
  const periods = assetPeriods(context);
  for (const transaction of context.state.transactions) {
    const day = localDay(transaction.occurredAt, context.timezone);
    if (day < context.start || day > context.end) continue;
    const totals = periods.get(periodKey(day, context.period));
    if (!totals) continue;
    totals[transaction.kind] += transaction.amount;
  }
  return [...periods.values()];
}
export function buildMonthlyTotals(context: ReportContext) {
  const monthly = new Map<string, MonthlyTotals>();
  for (const transaction of context.state.transactions) {
    const month = localDay(transaction.occurredAt, context.timezone).slice(0, 7);
    if (month < context.start.slice(0, 7) || month > context.end.slice(0, 7)) continue;
    const totals = monthly.get(month) ?? { month, income: 0n, expense: 0n };
    monthly.set(month, {
      ...totals,
      [transaction.kind]: totals[transaction.kind] + transaction.amount,
    });
  }
  return [...monthly.values()].sort((first, second) => first.month.localeCompare(second.month));
}
function categoryTotals(context: ReportContext, category: FinanceSnapshot['categories'][number]) {
  const month = context.end.slice(0, 7);
  const planned = context.state.plans.find(
    (plan) => plan.categoryId === category.id && plan.month.slice(0, 7) === month,
  )?.plannedAmount;
  const actual = context.state.transactions
    .filter(
      (transaction) =>
        transaction.categoryId === category.id &&
        localDay(transaction.occurredAt, context.timezone).slice(0, 7) === month,
    )
    .reduce((total, transaction) => total + transaction.amount, 0n);
  return {
    id: category.id,
    name: category.name,
    kind: category.kind,
    planned: planned ?? null,
    actual,
    remaining: planned === undefined ? null : planned - actual,
  };
}
export function buildCategoryTotals(context: ReportContext) {
  return context.state.categories.map((category) => categoryTotals(context, category));
}
export function assetGrowth(context: ReportContext, series: PeriodTotals[]) {
  const previousDay = new Date(Date.parse(context.start + 'T12:00:00Z') - 86400000)
    .toISOString()
    .slice(0, 10);
  const opening = totalAssetsAt(context, dayEnd(previousDay, context.timezone));
  const closing = series.at(-1)?.assets ?? 0n;
  if (opening <= 0n) return null;
  return Number(((closing - opening) * 10000n) / opening) / 100;
}
