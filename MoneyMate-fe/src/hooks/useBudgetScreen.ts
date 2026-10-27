import { budgetRows, summarizeBudget } from '@/helpers/budget';
import { monthKey } from '@/helpers/date';
import { useFinance } from '@/hooks/useFinance';
import type { Category, TransactionKind } from '@/types/finance.types';
import { useState } from 'react';
export function useBudgetScreen() {
  const { state } = useFinance();
  const [month, setMonth] = useState(monthKey(new Date()));
  const [kind, setKind] = useState<TransactionKind>('expense');
  const [categoryEditor, setCategoryEditor] = useState<Category | null>(null);
  const [editor, setEditor] = useState<Category | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const rows = budgetRows(state, month, kind);
  const { plannedCount, planned, actual, complete, remaining, overspent, maxValue, message } =
    summarizeBudget(rows, kind);
  return {
    setAddingCategory,
    setMonth,
    month,
    kind,
    setKind,
    plannedCount,
    planned,
    actual,
    overspent,
    complete,
    remaining,
    message,
    rows,
    maxValue,
    setCategoryEditor,
    setEditor,
    categoryEditor,
    editor,
    addingCategory,
  };
}
