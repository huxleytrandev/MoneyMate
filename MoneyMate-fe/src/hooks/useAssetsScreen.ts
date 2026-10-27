import { groups } from '@/constants/asset-groups';
import { assetBalance } from '@/helpers/finance';
import { useFinance } from '@/hooks/useFinance';
import type { Asset, Transfer } from '@/types/finance.types';
import { useState } from 'react';
export function useAssetsScreen() {
  const { state } = useFinance();
  const [transfer, setTransfer] = useState<{ value?: Transfer } | null>(null);
  const [editor, setEditor] = useState<{ asset?: Asset } | null>(null);
  const values = state.assets.map((asset) => ({ asset, balance: assetBalance(state, asset.id) }));
  const total = values.reduce((sum, item) => sum + item.balance, 0);
  const hasNegativeBalance = values.some((item) => item.balance < 0);
  const segments = groups.map((group) => ({
    ...group,
    balance: values
      .filter((item) => item.asset.type === group.type)
      .reduce((sum, item) => sum + item.balance, 0),
    chartValue: values
      .filter((item) => item.asset.type === group.type)
      .reduce((sum, item) => sum + Math.max(item.balance, 0), 0),
  }));
  const chartTotal = segments.reduce((sum, segment) => sum + segment.chartValue, 0);
  const circumference = 2 * Math.PI * 72;

  return {
    setEditor,
    state,
    setTransfer,
    total,
    segments,
    chartTotal,
    circumference,
    hasNegativeBalance,
    values,
    transfer,
    editor,
  };
}
