import { monthKey } from '@/helpers/date';
import { assetBalance, totalsForMonth, monthlyTransactions } from '@/helpers/finance';
import { useFinance } from '@/hooks/useFinance';
import { useMonthlyFinance } from '@/hooks/useMonthlyFinance';
import { colors } from '@/theme/colors';
import { useState } from 'react';
export function useDashboardScreen({
  displayName,
  onProfile,
  onAssets,
  onBudget,
  onTransactions,
}: {
  displayName: string;
  onProfile: () => void;
  onAssets: () => void;
  onBudget: () => void;
  onTransactions: () => void;
}) {
  const { refresh } = useFinance();
  const month = monthKey(new Date());
  const { state } = useMonthlyFinance(month);
  const [refreshError, setRefreshError] = useState('');
  const [add, setAdd] = useState(false);
  const transactions = monthlyTransactions(state, month).sort(
    (firstTransaction, secondTransaction) =>
      secondTransaction.occurredAt.localeCompare(firstTransaction.occurredAt),
  );
  const totals = totalsForMonth(state, month);
  const balances = state.assets.map((asset) => ({
    ...asset,
    balance: assetBalance(state, asset.id),
  }));
  const total = balances.reduce((sum, asset) => sum + asset.balance, 0);
  const expenseCategories = state.categories.filter((category) => category.kind === 'expense');
  const expenseCategoryIds = new Set(expenseCategories.map((category) => category.id));
  const plannedByCategory = new Map(
    state.plans
      .filter((plan) => plan.month === month)
      .map((plan) => [plan.categoryId, plan.amount]),
  );
  const planned = state.plans
    .filter((plan) => plan.month === month && expenseCategoryIds.has(plan.categoryId))
    .reduce((sum, plan) => sum + plan.amount, 0);
  const missing = expenseCategories.filter(
    (category) => !plannedByCategory.has(category.id),
  ).length;
  const remaining = planned - totals.expense;
  const complete = expenseCategories.length > 0 && missing === 0;
  const usage = complete && planned > 0 ? Math.round((totals.expense / planned) * 100) : undefined;
  const groups = [
    { type: 'cash', name: 'TIỀN MẶT', color: colors.amber },
    { type: 'bank', name: 'NGÂN HÀNG', color: '#FFFFFF' },
    { type: 'other', name: 'TÀI SẢN KHÁC', color: '#39BD73' },
  ];

  return {
    displayName,
    onProfile,
    state,
    onAssets,
    total,
    balances,
    groups,
    onBudget,
    complete,
    remaining,
    usage,
    totals,
    planned,
    missing,
    onTransactions,
    transactions,
    refreshError,
    refresh,
    setRefreshError,
    setAdd,
    add,
  };
}
