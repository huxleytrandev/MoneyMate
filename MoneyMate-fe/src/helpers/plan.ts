import type { TransactionKind } from '../types/finance.types';

const remainingDescriptions = { expense: 'Còn được chi ', income: 'Còn cần thu ' };
const exceededDescriptions = { expense: 'Vượt kế hoạch ', income: 'Vượt mục tiêu ' };
export function planDescription(kind: TransactionKind, remaining: number | undefined) {
  if (remaining === undefined) return 'Chưa lập kế hoạch';
  return remaining >= 0 ? remainingDescriptions[kind] : exceededDescriptions[kind];
}
export function planProgress(planned: number | undefined, actual: number) {
  if (planned && planned > 0) return Math.min(actual / planned, 1);
  return actual > 0 ? 1 : 0;
}
