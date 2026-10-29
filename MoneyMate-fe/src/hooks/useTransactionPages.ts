import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchTransactions } from '@/services/finance.service';
import { mapTransactionPage } from '@/helpers/transaction-page';
import type { TransactionPage, TransactionQuery } from '@/types/transaction-page.types';

const emptyPage: TransactionPage = {
  data: [],
  totals: { income: 0, expense: 0, total: 0 },
  page: { nextCursor: null, hasMore: false },
};
interface LoadedPage {
  key: string;
  page: TransactionPage;
  error: string;
}
function mergePages(previous: TransactionPage, next: TransactionPage): TransactionPage {
  const records = new Map(previous.data.map((transaction) => [transaction.id, transaction]));
  for (const transaction of next.data) records.set(transaction.id, transaction);
  return { ...next, data: [...records.values()] };
}
export function useTransactionPages(query: TransactionQuery, revision: number) {
  const [loaded, setLoaded] = useState<LoadedPage | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [appending, setAppending] = useState<string | null>(null);
  const requests = useRef(new Set<AbortController>());
  const currentKey = useRef('');
  const appendKey = useRef<string | null>(null);
  const input = useMemo(
    () => ({
      month: query.month,
      categoryId: query.categoryId,
      kind: query.kind,
      assetType: query.assetType,
      search: query.search,
      limit: query.limit,
      cursor: query.cursor,
    }),
    [
      query.month,
      query.categoryId,
      query.kind,
      query.assetType,
      query.search,
      query.limit,
      query.cursor,
    ],
  );
  const key = JSON.stringify([input, revision, attempt]);
  useEffect(() => {
    currentKey.current = key;
    const controller = new AbortController();
    requests.current.add(controller);
    fetchTransactions(input, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted)
          setLoaded({ key, page: mapTransactionPage(result), error: '' });
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setLoaded({ key, page: emptyPage, error: failure.message });
      })
      .finally(() => requests.current.delete(controller));
    const activeRequests = requests.current;
    return () => {
      for (const request of activeRequests) request.abort();
      activeRequests.clear();
    };
  }, [input, key]);
  const matches = loaded?.key === key;
  const page = matches ? loaded.page : emptyPage;
  const error = matches ? loaded.error : '';
  async function loadMore() {
    if (
      !matches ||
      !page.page.hasMore ||
      !page.page.nextCursor ||
      appendKey.current === key ||
      error
    )
      return;
    const controller = new AbortController();
    requests.current.add(controller);
    appendKey.current = key;
    setAppending(key);
    try {
      const nextPage = mapTransactionPage(
        await fetchTransactions({ ...input, cursor: page.page.nextCursor }, controller.signal),
      );
      if (controller.signal.aborted || currentKey.current !== key) return;
      setLoaded((previous) =>
        previous?.key === key
          ? { key, page: mergePages(previous.page, nextPage), error: '' }
          : previous,
      );
    } catch (failure) {
      if (!controller.signal.aborted && currentKey.current === key)
        setLoaded((previous) =>
          previous?.key === key
            ? {
                ...previous,
                error: failure instanceof Error ? failure.message : 'Không thể tải tiếp.',
              }
            : previous,
        );
    } finally {
      requests.current.delete(controller);
      if (appendKey.current === key) appendKey.current = null;
      setAppending((activeKey) => (activeKey === key ? null : activeKey));
    }
  }
  return {
    page,
    error,
    loading: !matches,
    loadingMore: appending === key,
    loadMore,
    retry: () => setAttempt((value) => value + 1),
  };
}
