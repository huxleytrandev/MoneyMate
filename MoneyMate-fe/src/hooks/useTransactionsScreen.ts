import { monthKey } from '@/helpers/date';
import { normalizeSearch } from '@/helpers/transaction-search';
import { transactionSections } from '@/helpers/transaction-page';
import { useFinance } from '@/hooks/useFinance';
import { useDebouncedValue } from './useDebouncedValue';
import { useTransactionPages } from './useTransactionPages';
import type { Filter } from '@/types/transaction-filter.types';
import { useMemo, useState } from 'react';

export function useTransactionsScreen() {
  const { state, revision } = useFinance();
  const [month, setMonth] = useState(monthKey(new Date()));
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const search = useDebouncedValue(query.trim());
  const kind = filter === 'income' || filter === 'expense' ? filter : undefined;
  const assetType =
    filter === 'cash' || filter === 'bank' || filter === 'other' ? filter : undefined;
  const result = useTransactionPages({ month, kind, assetType, search, limit: 50 }, revision);
  const sections = useMemo(() => transactionSections(result.page), [result.page]);
  return {
    setAdding,
    query,
    setQuery,
    setMonth,
    month,
    filter,
    setFilter,
    totals: result.page.totals,
    totalCount: result.page.totals.total,
    transactions: result.page.data,
    search: normalizeSearch(query.trim()),
    sections,
    state,
    adding,
    loading: result.loading,
    loadingMore: result.loadingMore,
    hasMore: result.page.page.hasMore,
    loadMore: result.loadMore,
    error: result.error,
    retry: result.retry,
  };
}
