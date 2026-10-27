import { FINANCE_MESSAGES } from '../constants/finance.constant.ts';
import type { FinanceSnapshot } from '../types/finance-snapshot.types.ts';
import { AppError } from './app-error.ts';

export function requireRecord<Record>(record: Record | undefined): Record {
  if (!record) throw new AppError(404, FINANCE_MESSAGES.notFound);
  return record;
}
export function assertVersion(record: { version: number }, version: number) {
  if (record.version !== version) throw new AppError(409, FINANCE_MESSAGES.conflict);
}
export function assetHasMovements(state: FinanceSnapshot, assetId: string) {
  return (
    state.transactions.some((transaction) =>
      transaction.allocations.some((allocation) => allocation.assetAccountId === assetId),
    ) ||
    state.transfers.some(
      (transfer) =>
        transfer.fromAssetAccountId === assetId || transfer.toAssetAccountId === assetId,
    ) ||
    state.adjustments.some((adjustment) => adjustment.assetAccountId === assetId)
  );
}
export function categoryIsUsed(state: FinanceSnapshot, categoryId: string) {
  return (
    state.transactions.some((transaction) => transaction.categoryId === categoryId) ||
    state.plans.some((plan) => plan.categoryId === categoryId)
  );
}
export function assertNotFuture(occurredAt: string) {
  if (Date.parse(occurredAt) > Date.now() + 60000) throw new AppError(422, FINANCE_MESSAGES.date);
}
export function assertMovementDate(
  state: FinanceSnapshot,
  movement: { assetIds: string[]; occurredAt: string },
) {
  assertNotFuture(movement.occurredAt);
  for (const assetId of movement.assetIds) {
    const asset = state.assets.find(
      (candidate) => candidate.id === assetId && !candidate.isArchived,
    );
    if (!asset) throw new AppError(422, FINANCE_MESSAGES.invalidReference);
    if (Date.parse(asset.openingAt) > Date.parse(movement.occurredAt))
      throw new AppError(422, FINANCE_MESSAGES.date);
  }
}
export function assertActiveCategory(
  state: FinanceSnapshot,
  reference: { categoryId: string; kind: string },
) {
  const category = state.categories.find(
    (candidate) =>
      candidate.id === reference.categoryId &&
      candidate.kind === reference.kind &&
      !candidate.isArchived,
  );
  if (!category) throw new AppError(422, FINANCE_MESSAGES.invalidReference);
}
