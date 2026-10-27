import { useContext } from 'react';
import { FinanceContext } from '@/providers/FinanceProvider';
export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error('FinanceProvider missing');
  return value;
}
