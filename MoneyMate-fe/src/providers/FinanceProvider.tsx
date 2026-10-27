import { createDemoId } from '@/helpers/id';
import { createContext, useState, type PropsWithChildren } from 'react';
import { createDemoState } from '@/constants/demo';
import type { FinanceState, Transaction, Category, Asset } from '@/types/finance.types';
import { addTransaction, assetBalance } from '@/helpers/finance';
export const FinanceContext = createContext<{
  state: FinanceState;
  saveTransaction: (transaction: Transaction) => void;
  savePlan: (categoryId: string, month: string, amount: number) => void;
  addCategory: (category: Category) => void;
  addAsset: (asset: Asset) => void;
  adjustAsset: (assetId: string, value: number) => void;
} | null>(null);
export function FinanceProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(createDemoState);
  return (
    <FinanceContext.Provider
      value={{
        state,
        saveTransaction: (t) => setState((s) => addTransaction(s, t)),
        savePlan: (categoryId, month, amount) =>
          setState((s) => ({
            ...s,
            plans: [
              ...s.plans.filter((p) => p.categoryId !== categoryId || p.month !== month),
              { categoryId, month, amount },
            ],
          })),
        addCategory: (category) =>
          setState((s) => ({ ...s, categories: [...s.categories, category] })),
        addAsset: (asset) => setState((s) => ({ ...s, assets: [...s.assets, asset] })),
        adjustAsset: (assetId, value) =>
          setState((s) => ({
            ...s,
            adjustments: [
              ...s.adjustments,
              {
                id: createDemoId(),
                assetId,
                delta: value - assetBalance(s, assetId),
                occurredAt: new Date().toISOString(),
              },
            ],
          })),
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}
