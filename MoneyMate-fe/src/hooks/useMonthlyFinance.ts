import { useFinance } from './useFinance';
import { useEffect, useMemo, useState } from 'react';
export function useMonthlyFinance(month: string) {
  const { state, monthStates, loadMonth, revision } = useFinance();
  const cached = monthStates[month];
  const [attempt, setAttempt] = useState(0);
  const key = month + ':' + revision + ':' + attempt;
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  useEffect(() => {
    let active = true;
    if (!cached)
      loadMonth(month).catch((error: Error) => {
        if (active) setFailure({ key, message: error.message });
      });
    return () => {
      active = false;
    };
  }, [cached, key, month, loadMonth]);
  const error = !cached && failure?.key === key ? failure.message : '';
  const selected = useMemo(
    () => cached ?? { ...state, plans: [], transactions: [], summary: undefined },
    [cached, state],
  );
  return {
    state: selected,
    loading: !cached && !error,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
