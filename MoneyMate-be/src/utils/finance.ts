import type { FinanceSnapshot } from '../types/finance-snapshot.types.ts';

function transactionBalance(state: FinanceSnapshot, assetId: string, cutoff: number) {
  return state.transactions
    .filter((transaction) => Date.parse(transaction.occurredAt) <= cutoff)
    .reduce((total, transaction) => {
      const allocated = transaction.allocations
        .filter((allocation) => allocation.assetAccountId === assetId)
        .reduce((sum, allocation) => sum + allocation.amount, 0n);
      return total + (transaction.kind === 'income' ? allocated : -allocated);
    }, 0n);
}
function transferBalance(state: FinanceSnapshot, assetId: string, cutoff: number) {
  return state.transfers
    .filter((transfer) => Date.parse(transfer.occurredAt) <= cutoff)
    .reduce((total, transfer) => {
      const incoming = transfer.toAssetAccountId === assetId ? transfer.amount : 0n;
      const outgoing = transfer.fromAssetAccountId === assetId ? transfer.amount : 0n;
      return total + incoming - outgoing;
    }, 0n);
}
function adjustmentBalance(state: FinanceSnapshot, assetId: string, cutoff: number) {
  return state.adjustments
    .filter(
      (adjustment) =>
        adjustment.assetAccountId === assetId && Date.parse(adjustment.occurredAt) <= cutoff,
    )
    .reduce((total, adjustment) => total + adjustment.deltaAmount, 0n);
}
export function balanceAt(state: FinanceSnapshot, assetId: string, asOf = Date.now()) {
  const asset = state.assets.find((candidate) => candidate.id === assetId);
  if (!asset || Date.parse(asset.openingAt) > asOf) return 0n;
  return (
    asset.openingValue +
    transactionBalance(state, assetId, asOf) +
    transferBalance(state, assetId, asOf) +
    adjustmentBalance(state, assetId, asOf)
  );
}
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
function dateFormatter(timezone: string) {
  const cached = dateFormatters.get(timezone);
  if (cached) return cached;
  if (dateFormatters.size >= 32) dateFormatters.delete(dateFormatters.keys().next().value!);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  dateFormatters.set(timezone, formatter);
  return formatter;
}
export function localDay(iso: string, timezone: string) {
  const parts = dateFormatter(timezone).formatToParts(new Date(iso));
  return ['year', 'month', 'day']
    .map((component) => parts.find((part) => part.type === component)?.value)
    .join('-');
}
function weekKey(day: string) {
  const date = new Date(day + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}
const periodFormatters: Record<string, (day: string) => string> = {
  year: (day) => day.slice(0, 4),
  quarter: (day) => day.slice(0, 4) + '-Q' + Math.ceil(Number(day.slice(5, 7)) / 3),
  month: (day) => day.slice(0, 7),
};
export function periodKey(day: string, period: string) {
  return (periodFormatters[period] ?? weekKey)(day);
}
