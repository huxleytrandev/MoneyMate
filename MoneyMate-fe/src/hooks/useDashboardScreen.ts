import { monthKey } from '@/helpers/date';
import { assetBalance, monthlyTotals, monthlyTransactions } from '@/helpers/finance';
import { useFinance } from '@/hooks/useFinance';
import { colors } from '@/theme/colors';
import { useState } from 'react';
export function useDashboardScreen({
  displayName,
  onLogout,
  onAssets,
  onBudget,
  onTransactions,
}: {
  displayName: string;
  onLogout: () => void;
  onAssets: () => void;
  onBudget: () => void;
  onTransactions: () => void;
}) {
  const { state, refresh } = useFinance();
  const [refreshError, setRefreshError] = useState('');
  const [add, setAdd] = useState(false);
  const [profile, setProfile] = useState(false);
  const month = monthKey(new Date());
  const transactions = monthlyTransactions(state, month).sort(
    (firstTransaction, secondTransaction) =>
      secondTransaction.occurredAt.localeCompare(firstTransaction.occurredAt),
  );
  const totals = monthlyTotals(transactions);
  const balances = state.assets.map((asset) => ({
    ...asset,
    balance: assetBalance(state, asset.id),
  }));
  const total = balances.reduce((sum, asset) => sum + asset.balance, 0);
  const expenseCategories = state.categories.filter((category) => category.kind === 'expense');
  const planned = state.plans
    .filter(
      (plan) =>
        plan.month === month &&
        expenseCategories.some((category) => category.id === plan.categoryId),
    )
    .reduce((sum, plan) => sum + plan.amount, 0);
  const missing = expenseCategories.filter(
    (category) =>
      !state.plans.some((plan) => plan.categoryId === category.id && plan.month === month),
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
    onLogout,
    setProfile,
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
    profile,
    add,
  };
}
