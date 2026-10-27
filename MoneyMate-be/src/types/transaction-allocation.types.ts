import type { MoneyInput } from './common.types.ts';

export interface TransactionAllocation {
  id: string;
  userId: string;
  transactionId: string;
  assetAccountId: string;
  amount: bigint;
  createdAt: string;
  updatedAt: string;
}

export type AllocationData = Pick<TransactionAllocation, 'assetAccountId' | 'amount'>;
export type AllocationInput = Omit<AllocationData, 'amount'> & { amount: MoneyInput };
