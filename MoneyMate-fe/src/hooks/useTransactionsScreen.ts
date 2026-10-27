import { monthKey } from '@/helpers/date';
import { monthlyTotals } from '@/helpers/finance';
import {
  groupTransactionsByDay,
  normalizeSearch,
  searchTransactions,
} from '@/helpers/transaction-search';
import { useFinance } from '@/hooks/useFinance';
import { Filter } from '@/types/transaction-filter.types';
import { useState } from 'react';
export function useTransactionsScreen() {
  const { state } = useFinance();
  const [month, setMonth] = useState(monthKey(new Date()));
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const search = normalizeSearch(query.trim());
  const transactions = searchTransactions(state, { month, filter, query });
  const totals = monthlyTotals(transactions);
  const grouped = groupTransactionsByDay(transactions);

  return {
    setAdding,
    query,
    setQuery,
    setMonth,
    month,
    filter,
    setFilter,
    totals,
    transactions,
    search,
    grouped,
    state,
    adding,
  };
}
