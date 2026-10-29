import { useMemo, useState } from 'react';
import { financeIndex, categoryActual } from '@/helpers/finance';
import { useFinance } from '@/hooks/useFinance';
import { useMonthlyFinance } from '@/hooks/useMonthlyFinance';
import { useTransactionPages } from '@/hooks/useTransactionPages';
import type { Transaction } from '@/types/finance.types';
type Editor =
  | { type: 'category' }
  | { type: 'plan' }
  | { type: 'new' }
  | { type: 'transaction'; transaction: Transaction };
export function useCategoryDetail(id: string, initialMonth: string) {
  const [month, setMonth] = useState(initialMonth);
  const [editor, setEditor] = useState<Editor | null>(null);
  const { revision } = useFinance();
  const monthly = useMonthlyFinance(month);
  const index = useMemo(() => financeIndex(monthly.state), [monthly.state]);
  const category = index.categories.get(id);
  const result = useTransactionPages({ month, categoryId: id, limit: 50 }, revision);
  const plan = monthly.state.plans.find(
    (record) => record.categoryId === id && record.month === month,
  );
  const actual = category ? categoryActual(monthly.state, id, month) : 0;
  return {
    ...result,
    category,
    month,
    setMonth,
    editor,
    setEditor,
    state: monthly.state,
    index,
    planned: plan?.amount,
    actual,
    monthlyLoading: monthly.loading,
    monthlyError: monthly.error,
    retryMonth: monthly.retry,
  };
}
