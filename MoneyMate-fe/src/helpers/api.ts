import type { ApiAdjustment, ApiFinanceState } from '@/types/api.types';
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
    ...data.assets.flatMap((asset) => [
      asset.openingValue,
      ...(asset.currentBalance === undefined ? [] : [asset.currentBalance]),
    ]),
    ...(data.summary
      ? [data.summary.income, data.summary.expense, ...Object.values(data.summary.actualByCategory)]
      : []),
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
export function mapTransaction(transaction: ApiFinanceState['transactions'][number]) {
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
export function mapAdjustment(adjustment: ApiAdjustment) {
  return {
    ...adjustment,
    assetId: adjustment.assetAccountId,
    delta: exactNumber(adjustment.deltaAmount),
  };
}
export function mapFinanceState(data: ApiFinanceState): FinanceState {
  assertSafeTotal(data);
  return {
    assets: data.assets.map((asset) => ({
      ...asset,
      openingValue: exactNumber(asset.openingValue),
      currentBalance:
        asset.currentBalance === undefined ? undefined : exactNumber(asset.currentBalance),
    })),
    summary: data.summary
      ? {
          month: data.summary.month,
          income: exactNumber(data.summary.income),
          expense: exactNumber(data.summary.expense),
          transactionCount: data.summary.transactionCount,
          actualByCategory: Object.fromEntries(
            Object.entries(data.summary.actualByCategory).map(([categoryId, amount]) => [
              categoryId,
              exactNumber(amount),
            ]),
          ),
        }
      : undefined,
    page: data.page,
    categories: data.categories,
    plans: data.plans.map((plan) => ({
      ...plan,
      month: plan.month.slice(0, 7),
      amount: exactNumber(plan.plannedAmount),
    })),
    transactions: data.transactions.map(mapTransaction),
    adjustments: data.adjustments.map(mapAdjustment),
    transfers: data.transfers.map(mapTransfer),
  };
}
