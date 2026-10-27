import { mapFinanceState } from '@/helpers/api';
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
export function useFinanceData() {
  const [state, setState] = useState<FinanceState>(emptyFinanceState);
  const currentState = useRef(state);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    const nextState = mapFinanceState(await fetchState());
    currentState.current = nextState;
    setState(nextState);
  }, []);
  useEffect(() => {
    let active = true;
    fetchState()
      .then((data) => {
        if (!active) return;
        const nextState = mapFinanceState(data);
        currentState.current = nextState;
        setState(nextState);
      })
      .catch((failure: Error) => {
        if (active) setError(failure.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
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
  return { state, getState: () => currentState.current, loading, error, setError, refresh, retry };
}
