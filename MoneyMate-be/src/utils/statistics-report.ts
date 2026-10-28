import { localDay, periodKey } from './finance.ts';
import type {
  ReportContext,
  ReportWindow,
  PeriodTotals,
  MonthlyTotals,
  CategoryTotals,
  StatisticsAggregates,
} from '../types/statistics.types.ts';

export function reportDays(start: string, end: string) {
  const days: string[] = [];
  const date = new Date(start + 'T12:00:00Z');
  while (date.toISOString().slice(0, 10) <= end) {
    days.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return days;
}
function addAmount(values: Map<string, bigint>, key: string, amount: bigint) {
  values.set(key, (values.get(key) ?? 0n) + amount);
}
function addKind(
  values: Map<string, { income: bigint; expense: bigint }>,
  key: string,
  kind: 'income' | 'expense',
  amount: bigint,
) {
  const totals = values.get(key) ?? { income: 0n, expense: 0n };
  totals[kind] += amount;
  values.set(key, totals);
}
function wealthEvents(context: ReportContext) {
  const assets = new Map(context.state.assets.map((asset) => [asset.id, asset]));
  const events = new Map<number, bigint>();
  for (const asset of assets.values())
    addAmountAt(events, Date.parse(asset.openingAt), asset.openingValue);
  function addMovement(assetId: string, occurredAt: string, amount: bigint) {
    const asset = assets.get(assetId);
    if (!asset) return;
    addAmountAt(events, Math.max(Date.parse(asset.openingAt), Date.parse(occurredAt)), amount);
  }
  for (const transaction of context.state.transactions) {
    for (const allocation of transaction.allocations) {
      const amount = transaction.kind === 'income' ? allocation.amount : -allocation.amount;
      addMovement(allocation.assetAccountId, transaction.occurredAt, amount);
    }
  }
  for (const transfer of context.state.transfers) {
    addMovement(transfer.fromAssetAccountId, transfer.occurredAt, -transfer.amount);
    addMovement(transfer.toAssetAccountId, transfer.occurredAt, transfer.amount);
  }
  for (const adjustment of context.state.adjustments)
    addMovement(adjustment.assetAccountId, adjustment.occurredAt, adjustment.deltaAmount);
  return events;
}
function addAmountAt(events: Map<number, bigint>, timestamp: number, amount: bigint) {
  events.set(timestamp, (events.get(timestamp) ?? 0n) + amount);
}
function aggregateWealth(context: ReportContext) {
  const wealth = new Map<string, bigint>();
  let opening = 0n;
  for (const [timestamp, delta] of wealthEvents(context)) {
    const day = localDay(new Date(timestamp).toISOString(), context.timezone);
    if (day < context.start) {
      opening += delta;
      continue;
    }
    if (day > context.end || timestamp > context.now) continue;
    addAmount(wealth, day, delta);
  }
  return { opening, wealth: [...wealth].map(([day, delta]) => ({ day, delta })) };
}
function aggregateActuals(context: ReportContext) {
  const actuals = new Map<string, { income: bigint; expense: bigint }>();
  const monthly = new Map<string, { income: bigint; expense: bigint }>();
  const categories = new Map<string, bigint>();
  const endingMonth = context.end.slice(0, 7);
  for (const transaction of context.state.transactions) {
    const day = localDay(transaction.occurredAt, context.timezone);
    const month = day.slice(0, 7);
    if (day >= context.start && day <= context.end)
      addKind(actuals, day, transaction.kind, transaction.amount);
    if (month >= context.start.slice(0, 7) && month <= endingMonth)
      addKind(monthly, month, transaction.kind, transaction.amount);
    if (month === endingMonth) addAmount(categories, transaction.categoryId, transaction.amount);
  }
  return {
    actuals: [...actuals].map(([day, totals]) => ({ day, ...totals })),
    monthly: [...monthly]
      .map(([month, totals]) => ({ month, ...totals }))
      .sort((first, second) => first.month.localeCompare(second.month)),
    categories,
  };
}
function snapshotCategories(
  context: ReportContext,
  actuals: Map<string, bigint>,
): CategoryTotals[] {
  const plans = new Map<string, bigint>();
  for (const plan of context.state.plans) {
    if (plan.month.slice(0, 7) !== context.end.slice(0, 7) || plans.has(plan.categoryId)) continue;
    plans.set(plan.categoryId, plan.plannedAmount);
  }
  return context.state.categories.map((category) => {
    const planned = plans.get(category.id) ?? null;
    const actual = actuals.get(category.id) ?? 0n;
    return {
      id: category.id,
      name: category.name,
      kind: category.kind,
      planned,
      actual,
      remaining: planned === null ? null : planned - actual,
    };
  });
}
export function aggregateSnapshot(context: ReportContext): StatisticsAggregates {
  const actuals = aggregateActuals(context);
  return {
    ...aggregateWealth(context),
    ...actuals,
    categories: snapshotCategories(context, actuals.categories),
  };
}
function growthPercent(opening: bigint, closing: bigint) {
  if (opening <= 0n) return null;
  return Number(((closing - opening) * 10000n) / opening) / 100;
}
export function buildStatisticsFromAggregates(
  context: ReportWindow,
  aggregates: StatisticsAggregates,
) {
  const wealth = new Map(aggregates.wealth.map((row) => [row.day, row.delta]));
  const actuals = new Map(aggregates.actuals.map((row) => [row.day, row]));
  const periods = new Map<string, PeriodTotals>();
  let balance = aggregates.opening;
  for (const day of reportDays(context.start, context.end)) {
    balance += wealth.get(day) ?? 0n;
    const key = periodKey(day, context.period);
    const previous = periods.get(key);
    const amounts = actuals.get(day);
    periods.set(key, {
      key,
      assets: balance,
      income: (previous?.income ?? 0n) + (amounts?.income ?? 0n),
      expense: (previous?.expense ?? 0n) + (amounts?.expense ?? 0n),
    });
  }
  const series = [...periods.values()];
  return {
    series,
    monthly: aggregates.monthly,
    categories: aggregates.categories,
    growthPercent: growthPercent(aggregates.opening, series.at(-1)?.assets ?? 0n),
  };
}
// Kept for callers that need a single pure report section.
export function buildPeriodSeries(context: ReportContext) {
  return buildStatisticsFromAggregates(context, aggregateSnapshot(context)).series;
}
export function buildMonthlyTotals(context: ReportContext): MonthlyTotals[] {
  return aggregateActuals(context).monthly;
}
export function buildCategoryTotals(context: ReportContext) {
  return snapshotCategories(context, aggregateActuals(context).categories);
}
export function assetGrowth(context: ReportContext, series: PeriodTotals[]) {
  return growthPercent(aggregateWealth(context).opening, series.at(-1)?.assets ?? 0n);
}
