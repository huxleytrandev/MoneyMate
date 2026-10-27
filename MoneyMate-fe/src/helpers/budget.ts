import type { BudgetRow } from '../types/budget.types';
import type { FinanceState, TransactionKind } from '../types/finance.types';
import { categoryActual } from './finance.ts';

export function budgetRows(state: FinanceState, month: string, kind: TransactionKind): BudgetRow[] {
  return state.categories
    .filter((category) => category.kind === kind)
    .map((category) => ({
      category,
      planned: state.plans.find((plan) => plan.categoryId === category.id && plan.month === month)
        ?.amount,
      actual: categoryActual(state, category.id, month),
    }));
}
function completedBudgetMessage(kind: TransactionKind, remaining: number) {
  const messages = {
    expense: {
      exceeded: 'Đã vượt ngân sách',
      reached: 'Đã dùng hết ngân sách',
      remaining: 'Còn có thể chi',
    },
    income: {
      exceeded: 'Thu nhập vượt mục tiêu',
      reached: 'Đã đạt mục tiêu thu nhập',
      remaining: 'Còn cần thu',
    },
  };
  if (remaining < 0) return messages[kind].exceeded;
  if (remaining === 0) return messages[kind].reached;
  return messages[kind].remaining;
}
function budgetMessage(input: {
  complete: boolean;
  plannedCount: number;
  categoryCount: number;
  kind: TransactionKind;
  remaining: number;
}) {
  if (input.complete) return completedBudgetMessage(input.kind, input.remaining);
  if (input.plannedCount === 0) return 'Chưa có kế hoạch cho tháng này.';
  return input.categoryCount - input.plannedCount + ' danh mục chưa đặt kế hoạch.';
}
export function summarizeBudget(rows: BudgetRow[], kind: TransactionKind) {
  const plannedCount = rows.filter((row) => row.planned !== undefined).length;
  const planned = rows.reduce((total, row) => total + (row.planned ?? 0), 0);
  const actual = rows.reduce((total, row) => total + row.actual, 0);
  const complete = rows.length > 0 && plannedCount === rows.length;
  const remaining = planned - actual;
  return {
    plannedCount,
    planned,
    actual,
    complete,
    remaining,
    overspent: complete && kind === 'expense' && remaining < 0,
    maxValue: Math.max(1, ...rows.flatMap((row) => [row.planned ?? 0, row.actual])),
    message: budgetMessage({ complete, plannedCount, categoryCount: rows.length, kind, remaining }),
  };
}
