import type { ApiFinanceState } from '@/types/api.types';
import type { FinanceState } from '@/types/finance.types';
export function exactNumber(value: string) {
  if (!/^-?\d+$/.test(value)) throw new Error('Dữ liệu tiền không hợp lệ.');
  const amount = Number(value);
  if (!Number.isSafeInteger(amount))
    throw new Error('Số tiền vượt giới hạn hiển thị an toàn của ứng dụng.');
  return amount;
}
function assertSafeTotal(data: ApiFinanceState) {
  const amounts = [
    ...data.assets.map((asset) => asset.openingValue),
    ...data.transactions.flatMap((transaction) => [
      transaction.amount,
      ...transaction.allocations.map((allocation) => allocation.amount),
    ]),
    ...data.plans.map((plan) => plan.plannedAmount),
    ...data.adjustments.map((adjustment) => adjustment.deltaAmount),
    ...data.transfers.map((transfer) => transfer.amount),
  ];
  const bound = amounts.reduce((sum, value) => sum + absoluteAmount(value), 0n);
  if (bound > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error('Dữ liệu vượt giới hạn tính toán an toàn trên thiết bị.');
}
function absoluteAmount(value: string) {
  const amount = BigInt(value);
  return amount < 0n ? -amount : amount;
}
function mapTransaction(transaction: ApiFinanceState['transactions'][number]) {
  return {
    ...transaction,
    amount: exactNumber(transaction.amount),
    allocations: transaction.allocations.map((allocation) => ({
      assetId: allocation.assetAccountId,
      amount: exactNumber(allocation.amount),
    })),
  };
}
function mapTransfer(transfer: ApiFinanceState['transfers'][number]) {
  return {
    ...transfer,
    fromAssetId: transfer.fromAssetAccountId,
    toAssetId: transfer.toAssetAccountId,
    amount: exactNumber(transfer.amount),
    note: transfer.note ?? undefined,
  };
}
export function mapFinanceState(data: ApiFinanceState): FinanceState {
  assertSafeTotal(data);
  return {
    assets: data.assets.map((asset) => ({
      ...asset,
      openingValue: exactNumber(asset.openingValue),
    })),
    categories: data.categories,
    plans: data.plans.map((plan) => ({
      ...plan,
      month: plan.month.slice(0, 7),
      amount: exactNumber(plan.plannedAmount),
    })),
    transactions: data.transactions.map(mapTransaction),
    adjustments: data.adjustments.map((adjustment) => ({
      ...adjustment,
      assetId: adjustment.assetAccountId,
      delta: exactNumber(adjustment.deltaAmount),
    })),
    transfers: data.transfers.map(mapTransfer),
  };
}
