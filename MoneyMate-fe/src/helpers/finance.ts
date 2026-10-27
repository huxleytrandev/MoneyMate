import type { FinanceState, Transaction } from '../types/finance.types';
import { monthKey } from './date.ts';
export function monthlyTransactions(state: FinanceState, month: string) {
  return state.transactions.filter(
    (transaction) => monthKey(new Date(transaction.occurredAt)) === month,
  );
}
export function assetBalance(state: FinanceState, id: string) {
  const opening = state.assets.find((asset) => asset.id === id)?.openingValue ?? 0;
  const movements = state.transactions.reduce(
    (sum, transaction) =>
      sum +
      transaction.allocations
        .filter((allocation) => allocation.assetId === id)
        .reduce(
          (total, allocation) =>
            total + (transaction.kind === 'income' ? allocation.amount : -allocation.amount),
          0,
        ),
    0,
  );
  return (
    opening +
    movements +
    (state.transfers ?? []).reduce(
      (sum, transfer) =>
        sum +
        (transfer.toAssetId === id ? transfer.amount : 0) -
        (transfer.fromAssetId === id ? transfer.amount : 0),
      0,
    ) +
    state.adjustments
      .filter((adjustment) => adjustment.assetId === id)
      .reduce((total, adjustment) => total + adjustment.delta, 0)
  );
}
export function monthlyTotals(transactions: Transaction[]) {
  return transactions.reduce(
    (total, transaction) => ({
      ...total,
      [transaction.kind]: total[transaction.kind] + transaction.amount,
    }),
    {
      income: 0,
      expense: 0,
    },
  );
}
export function categoryActual(state: FinanceState, categoryId: string, month: string) {
  return monthlyTransactions(state, month)
    .filter((transaction) => transaction.categoryId === categoryId)
    .reduce((total, transaction) => total + transaction.amount, 0);
}
export function addTransaction(state: FinanceState, transaction: Transaction): FinanceState {
  const category = state.categories.find(
    (category) => category.id === transaction.categoryId && category.kind === transaction.kind,
  );
  if (!category) throw new Error('Hãy chọn danh mục phù hợp.');
  if (
    transaction.allocations.some(
      (allocation) => !state.assets.some((asset) => asset.id === allocation.assetId),
    )
  )
    throw new Error('Nguồn tiền không tồn tại.');
  if (
    transaction.allocations.reduce((total, allocation) => total + allocation.amount, 0) !==
    transaction.amount
  )
    throw new Error('Phân bổ phải bằng số tiền giao dịch.');
  return { ...state, transactions: [transaction, ...state.transactions] };
}
