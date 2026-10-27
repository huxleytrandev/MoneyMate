import { FinanceContext } from '@/providers/FinanceProvider';
import { useContext } from 'react';
export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error('FinanceProvider missing');
  return value;
}
