import type { AssetKind, FinanceState, Transaction, TransactionKind } from '../types/finance.types';
import { dateKey } from './date.ts';
import { monthlyTransactions } from './finance.ts';
export type TransactionFilter = 'all' | TransactionKind | AssetKind;
export function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}
function matchesSource(state: FinanceState, transaction: Transaction, filter: TransactionFilter) {
  if (filter === 'all') return true;
  if (filter === 'income' || filter === 'expense') return transaction.kind === filter;
  return transaction.allocations.some(
    (allocation) => state.assets.find((asset) => asset.id === allocation.assetId)?.type === filter,
  );
}
function searchableText(state: FinanceState, transaction: Transaction) {
  const category =
    state.categories.find((candidate) => candidate.id === transaction.categoryId)?.name ?? '';
  const sources = transaction.allocations
    .map((allocation) => state.assets.find((asset) => asset.id === allocation.assetId)?.name ?? '')
    .join(' ');
  return normalizeSearch(
    [transaction.title, category, sources, String(transaction.amount)].join(' '),
  );
}
export function searchTransactions(
  state: FinanceState,
  input: { month: string; filter: TransactionFilter; query: string },
) {
  const query = normalizeSearch(input.query.trim());
  return monthlyTransactions(state, input.month)
    .filter(
      (transaction) =>
        matchesSource(state, transaction, input.filter) &&
        searchableText(state, transaction).includes(query),
    )
    .sort((first, second) => Date.parse(second.occurredAt) - Date.parse(first.occurredAt));
}
export function groupTransactionsByDay(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    const day = dateKey(new Date(transaction.occurredAt));
    groups.set(day, [...(groups.get(day) ?? []), transaction]);
  }
  return groups;
}
