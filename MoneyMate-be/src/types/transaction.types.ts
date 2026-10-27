import type { RecordMetadata } from './common.types.ts';
import type { MoneyInput } from './common.types.ts';
import type { AllocationData, AllocationInput } from './transaction-allocation.types.ts';

export interface Transaction extends RecordMetadata {
  categoryId: string;
  kind: 'income' | 'expense';
  amount: bigint;
  title: string;
  note?: string;
  occurredAt: string;
}

export type CreateTransactionData = Omit<Transaction, keyof RecordMetadata> & {
  allocations: AllocationData[];
};
export type CreateTransactionInput = Omit<CreateTransactionData, 'amount' | 'allocations'> & {
  amount: MoneyInput;
  allocations: AllocationInput[];
};
