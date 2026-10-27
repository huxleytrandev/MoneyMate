import type { RecordMetadata } from './common.types.ts';
import type { MoneyInput } from './common.types.ts';

export interface Transfer extends RecordMetadata {
  fromAssetAccountId: string;
  toAssetAccountId: string;
  amount: bigint;
  occurredAt: string;
  note?: string;
}

export type CreateTransferData = Omit<Transfer, keyof RecordMetadata>;
export type CreateTransferInput = Omit<CreateTransferData, 'amount'> & { amount: MoneyInput };
