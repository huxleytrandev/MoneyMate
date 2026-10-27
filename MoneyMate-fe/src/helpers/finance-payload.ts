import type { PlanInput } from '../types/finance-context.types';
import type { Asset, Category, FinanceState, Transaction, Transfer } from '../types/finance.types';
import { ApiError } from './api-error.ts';

export function transactionPayload(transaction: Transaction) {
  return {
    title: transaction.title,
    kind: transaction.kind,
    categoryId: transaction.categoryId,
    amount: String(transaction.amount),
    occurredAt: transaction.occurredAt,
    allocations: transaction.allocations.map((allocation) => ({
      assetAccountId: allocation.assetId,
      amount: String(allocation.amount),
    })),
  };
}
export function assetPayload(asset: Asset) {
  return {
    name: asset.name,
    type: asset.type,
    openingValue: String(asset.openingValue),
    openingAt: asset.openingAt,
    isArchived: asset.isArchived ?? false,
    version: asset.version,
  };
}
export function categoryPayload(category: Category) {
  return {
    name: category.name,
    kind: category.kind,
    isArchived: category.isArchived ?? false,
    version: category.version,
  };
}
export function transferPayload(transfer: Transfer) {
  return {
    fromAssetAccountId: transfer.fromAssetId,
    toAssetAccountId: transfer.toAssetId,
    amount: String(transfer.amount),
    occurredAt: transfer.occurredAt,
    note: transfer.note,
  };
}
export function preparePlan(state: FinanceState, input: PlanInput) {
  const existing = state.plans.find(
    (plan) => plan.categoryId === input.categoryId && plan.month === input.month,
  );
  assertPlanExpectation(existing, input.expectedVersion);
  const category = state.categories.find((candidate) => candidate.id === input.categoryId);
  if (!category) throw new Error('Danh mục không tồn tại.');
  const body = {
    categoryId: input.categoryId,
    kind: category.kind,
    month: input.month + '-01',
    plannedAmount: String(input.amount),
  };
  return { existing, body };
}
function assertPlanExpectation(existing: unknown, expectedVersion: PlanInput['expectedVersion']) {
  if (expectedVersion === undefined) return;
  const expectedMissing = expectedVersion === null;
  if (expectedMissing === Boolean(existing))
    throw new ApiError(409, 'Kế hoạch đã thay đổi. Hãy tải lại.');
}
