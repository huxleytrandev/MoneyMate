import type { RecordMetadata } from './common.types.ts';
import type { MoneyInput } from './common.types.ts';

export interface AssetAccount extends RecordMetadata {
  name: string;
  type: 'cash' | 'bank' | 'other';
  openingValue: bigint;
  openingAt: string;
  note?: string;
  isArchived: boolean;
}

export type CreateAssetAccountData = Omit<AssetAccount, keyof RecordMetadata | 'isArchived'>;
export type CreateAssetAccountInput = Omit<CreateAssetAccountData, 'openingValue'> & {
  openingValue: MoneyInput;
};
