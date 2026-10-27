import type { FinanceState, Transaction } from '../types/finance.types';
import { monthKey } from './date.ts';
export function monthlyTransactions(state: FinanceState, month: string) {
  return state.transactions.filter((t) => monthKey(new Date(t.occurredAt)) === month);
}
export function assetBalance(state: FinanceState, id: string) {
  const opening = state.assets.find((a) => a.id === id)?.openingValue ?? 0;
  const movements = state.transactions.reduce(
    (sum, t) =>
      sum +
      t.allocations
        .filter((a) => a.assetId === id)
        .reduce((s, a) => s + (t.kind === 'income' ? a.amount : -a.amount), 0),
    0,
  );
  return (
    opening +
    movements +
    state.adjustments.filter((a) => a.assetId === id).reduce((s, a) => s + a.delta, 0)
  );
}
export function monthlyTotals(transactions: Transaction[]) {
  return transactions.reduce((s, t) => ({ ...s, [t.kind]: s[t.kind] + t.amount }), {
    income: 0,
    expense: 0,
  });
}
export function categoryActual(state: FinanceState, categoryId: string, month: string) {
  return monthlyTransactions(state, month)
    .filter((t) => t.categoryId === categoryId)
    .reduce((s, t) => s + t.amount, 0);
}
export function addTransaction(state: FinanceState, transaction: Transaction): FinanceState {
  const category = state.categories.find(
    (c) => c.id === transaction.categoryId && c.kind === transaction.kind,
  );
  if (!category) throw new Error('Hãy chọn danh mục phù hợp.');
  if (transaction.allocations.some((a) => !state.assets.some((asset) => asset.id === a.assetId)))
    throw new Error('Nguồn tiền không tồn tại.');
  if (transaction.allocations.reduce((s, a) => s + a.amount, 0) !== transaction.amount)
    throw new Error('Phân bổ phải bằng số tiền giao dịch.');
  return { ...state, transactions: [transaction, ...state.transactions] };
}
