import { mapFinanceState } from '@/helpers/api';
import { monthKey } from '@/helpers/date';
import { fetchState } from '@/services/finance.service';
import type { FinanceState } from '@/types/finance.types';
import { useCallback, useEffect, useRef, useState } from 'react';

const emptyFinanceState: FinanceState = {
  assets: [],
  categories: [],
  plans: [],
  transactions: [],
  adjustments: [],
  transfers: [],
};
interface PendingMonth {
  controller: AbortController;
  request: Promise<void>;
}
const monthCacheLimit = 3;
export function useFinanceData() {
  const [state, setState] = useState<FinanceState>(emptyFinanceState);
  const [monthStates, setMonthStates] = useState<Record<string, FinanceState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const currentState = useRef(state);
  const cachedMonths = useRef(new Map<string, FinanceState>());
  const pendingMonths = useRef(new Map<string, PendingMonth>());
  const generation = useRef(0);
  const mounted = useRef(true);

  const storeMonth = useCallback((month: string, nextState: FinanceState) => {
    cachedMonths.current.delete(month);
    cachedMonths.current.set(month, nextState);
    if (cachedMonths.current.size > monthCacheLimit)
      cachedMonths.current.delete(cachedMonths.current.keys().next().value!);
    if (mounted.current) setMonthStates(Object.fromEntries(cachedMonths.current));
    if (month !== monthKey(new Date())) return;
    currentState.current = nextState;
    if (mounted.current) setState(nextState);
  }, []);
  const loadMonth = useCallback(
    (month: string): Promise<void> => {
      if (cachedMonths.current.has(month)) return Promise.resolve();
      const pending = pendingMonths.current.get(month);
      if (pending) return pending.request;
      const controller = new AbortController();
      const requestGeneration = generation.current;
      const request = fetchState(month, controller.signal)
        .then((data) => {
          if (requestGeneration !== generation.current || controller.signal.aborted) return;
          storeMonth(month, mapFinanceState(data));
        })
        .finally(() => {
          if (pendingMonths.current.get(month)?.controller === controller)
            pendingMonths.current.delete(month);
        });
      pendingMonths.current.set(month, { controller, request });
      return request;
    },
    [storeMonth],
  );
  const refresh = useCallback(async () => {
    const requestGeneration = ++generation.current;
    for (const pending of pendingMonths.current.values()) pending.controller.abort();
    pendingMonths.current.clear();
    cachedMonths.current.clear();
    const month = monthKey(new Date());
    const data = mapFinanceState(await fetchState(month));
    if (requestGeneration !== generation.current) return;
    storeMonth(month, data);
    if (mounted.current) setRevision((value) => value + 1);
  }, [storeMonth]);
  useEffect(() => {
    mounted.current = true;
    let active = true;
    const activeRequests = pendingMonths.current;
    loadMonth(monthKey(new Date()))
      .catch((failure: Error) => {
        if (active && mounted.current) setError(failure.message);
      })
      .finally(() => {
        if (active && mounted.current) setLoading(false);
      });
    return () => {
      active = false;
      mounted.current = false;
      for (const pending of activeRequests.values()) pending.controller.abort();
      activeRequests.clear();
    };
  }, [loadMonth]);
  async function retry() {
    setLoading(true);
    try {
      await refresh();
      setError('');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Chưa thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }
  return {
    state,
    monthStates,
    revision,
    loadMonth,
    getState: () => currentState.current,
    getStateForMonth: (month: string) => cachedMonths.current.get(month) ?? currentState.current,
    loading,
    error,
    setError,
    refresh,
    retry,
  };
}
