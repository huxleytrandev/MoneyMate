import type { FinanceState } from '../types/finance.types';
import { monthKey } from '../helpers/date.ts';
export function createDemoState(): FinanceState {
  const now = new Date();
  const month = monthKey(now);
  const at = (day: number) =>
    new Date(now.getFullYear(), now.getMonth(), Math.min(day, now.getDate()), 12).toISOString();
  const base = { createdAt: now.toISOString(), updatedAt: now.toISOString() };
  return {
    assets: [
      { id: 'cash', name: 'Tiền mặt', type: 'cash', openingValue: 2000000 },
      { id: 'bank', name: 'Vietcombank', type: 'bank', openingValue: 6200000 },
      { id: 'other', name: 'Tiết kiệm & đầu tư', type: 'other', openingValue: 20000000 },
    ],
    categories: [
      { id: 'food', name: 'Ăn uống', kind: 'expense' },
      { id: 'travel', name: 'Đi lại', kind: 'expense' },
      { id: 'home', name: 'Nhà ở', kind: 'expense' },
      { id: 'salary', name: 'Lương', kind: 'income' },
      { id: 'freelance', name: 'Làm thêm', kind: 'income' },
    ],
    transactions: [
      {
        ...base,
        id: 'salary',
        title: 'Lương tháng này',
        categoryId: 'salary',
        kind: 'income',
        amount: 18000000,
        occurredAt: at(1),
        allocations: [{ assetId: 'bank', amount: 18000000 }],
      },
      {
        ...base,
        id: 'rent',
        title: 'Tiền thuê nhà',
        categoryId: 'home',
        kind: 'expense',
        amount: 4500000,
        occurredAt: at(5),
        allocations: [{ assetId: 'bank', amount: 4500000 }],
      },
      {
        ...base,
        id: 'groceries',
        title: 'Đi chợ cuối tuần',
        categoryId: 'food',
        kind: 'expense',
        amount: 425000,
        occurredAt: at(24),
        allocations: [{ assetId: 'cash', amount: 425000 }],
      },
      {
        ...base,
        id: 'coffee',
        title: 'Một chút cà phê',
        categoryId: 'food',
        kind: 'expense',
        amount: 55000,
        occurredAt: at(25),
        allocations: [{ assetId: 'cash', amount: 55000 }],
      },
      {
        ...base,
        id: 'travel',
        title: 'Di chuyển',
        categoryId: 'travel',
        kind: 'expense',
        amount: 120000,
        occurredAt: at(26),
        allocations: [{ assetId: 'cash', amount: 120000 }],
      },
    ],
    plans: [
      { categoryId: 'food', month, amount: 3000000 },
      { categoryId: 'travel', month, amount: 1000000 },
      { categoryId: 'home', month, amount: 4500000 },
      { categoryId: 'salary', month, amount: 20000000 },
      { categoryId: 'freelance', month, amount: 5000000 },
    ],
    adjustments: [],
  };
}
