import type { FinanceState, Transaction } from '../types/finance.types';
import { monthKey, getFinanceTimezone } from './date.ts';
interface FinanceIndex {
  timezone: string | undefined;
  assets: Map<string, FinanceState['assets'][number]>;
  categories: Map<string, FinanceState['categories'][number]>;
  balances: Map<string, number>;
  byMonth: Map<string, Transaction[]>;
  actualByMonth: Map<string, Map<string, number>>;
}
const indexes = new WeakMap<FinanceState, FinanceIndex>();
function addBalance(balances: Map<string, number>, assetId: string, amount: number) {
  balances.set(assetId, (balances.get(assetId) ?? 0) + amount);
}
function indexTransactions(state: FinanceState, index: FinanceIndex) {
  for (const transaction of state.transactions) {
    const month = monthKey(new Date(transaction.occurredAt));
    const transactions = index.byMonth.get(month) ?? [];
    transactions.push(transaction);
    index.byMonth.set(month, transactions);
    const actual = index.actualByMonth.get(month) ?? new Map<string, number>();
    actual.set(
      transaction.categoryId,
      (actual.get(transaction.categoryId) ?? 0) + transaction.amount,
    );
    index.actualByMonth.set(month, actual);
    for (const allocation of transaction.allocations)
      addBalance(
        index.balances,
        allocation.assetId,
        transaction.kind === 'income' ? allocation.amount : -allocation.amount,
      );
  }
}
export function financeIndex(state: FinanceState) {
  const cached = indexes.get(state);
  if (cached && cached.timezone === getFinanceTimezone()) return cached;
  const index: FinanceIndex = {
    timezone: getFinanceTimezone(),
    assets: new Map(state.assets.map((asset) => [asset.id, asset])),
    categories: new Map(state.categories.map((category) => [category.id, category])),
    balances: new Map(state.assets.map((asset) => [asset.id, asset.openingValue])),
    byMonth: new Map(),
    actualByMonth: new Map(),
  };
  indexTransactions(state, index);
  for (const transfer of state.transfers ?? []) {
    addBalance(index.balances, transfer.fromAssetId, -transfer.amount);
    addBalance(index.balances, transfer.toAssetId, transfer.amount);
  }
  for (const adjustment of state.adjustments)
    addBalance(index.balances, adjustment.assetId, adjustment.delta);
  for (const asset of state.assets)
    if (asset.currentBalance !== undefined) index.balances.set(asset.id, asset.currentBalance);
  indexes.set(state, index);
  return index;
}
export function monthlyTransactions(state: FinanceState, month: string) {
  return [...(financeIndex(state).byMonth.get(month) ?? [])];
}
export function assetBalance(state: FinanceState, assetId: string) {
  return financeIndex(state).balances.get(assetId) ?? 0;
}
export function monthlyTotals(transactions: Transaction[]) {
  const totals = { income: 0, expense: 0 };
  for (const transaction of transactions) totals[transaction.kind] += transaction.amount;
  return totals;
}
export function totalsForMonth(state: FinanceState, month: string) {
  if (state.summary?.month === month)
    return { income: state.summary.income, expense: state.summary.expense };
  return monthlyTotals(monthlyTransactions(state, month));
}
export function categoryActual(state: FinanceState, categoryId: string, month: string) {
  if (state.summary?.month === month) return state.summary.actualByCategory[categoryId] ?? 0;
  return financeIndex(state).actualByMonth.get(month)?.get(categoryId) ?? 0;
}
export function addTransaction(state: FinanceState, transaction: Transaction): FinanceState {
  const index = financeIndex(state);
  if (index.categories.get(transaction.categoryId)?.kind !== transaction.kind)
    throw new Error('Hãy chọn danh mục phù hợp.');
  if (transaction.allocations.some((allocation) => !index.assets.has(allocation.assetId)))
    throw new Error('Nguồn tiền không tồn tại.');
  if (
    transaction.allocations.reduce((total, allocation) => total + allocation.amount, 0) !==
    transaction.amount
  )
    throw new Error('Phân bổ phải bằng số tiền giao dịch.');
  return { ...state, transactions: [transaction, ...state.transactions] };
}
