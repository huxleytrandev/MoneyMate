import type { RecordMetadata } from './common.types.ts';
import type { MoneyInput } from './common.types.ts';

export interface AssetAdjustment extends RecordMetadata {
  assetAccountId: string;
  deltaAmount: bigint;
  reason: 'valuation' | 'reconciliation';
  note: string;
  occurredAt: string;
}

export type CreateAssetAdjustmentData = Omit<AssetAdjustment, keyof RecordMetadata>;
export type CreateAssetAdjustmentInput = Omit<CreateAssetAdjustmentData, 'deltaAmount'> & {
  deltaAmount: MoneyInput;
};
