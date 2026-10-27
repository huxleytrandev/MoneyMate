import { createSchemas } from '../schemas/api.schema.ts';
import { FINANCE_MESSAGES } from '../constants/finance.constant.ts';
import type { FinanceOperationContext, RecordWriter } from '../types/finance-operation.types.ts';
import { AppError } from '../utils/app-error.ts';
import {
  requireRecord,
  assetHasMovements,
  categoryIsUsed,
  assertNotFuture,
  assertMovementDate,
  assertActiveCategory,
} from '../utils/finance-validation.ts';

function recordCommands<Input, Record>(
  repository: RecordWriter<Input, Record>,
  context: FinanceOperationContext,
  data: Input,
) {
  return {
    create: () => repository.create(context.userId, data),
    update: async (recordId: string, version: number) =>
      requireRecord(await repository.update(context.userId, recordId, version, data)),
  };
}
function assertAssetHistory(
  context: FinanceOperationContext,
  data: ReturnType<typeof createSchemas.assets.parse>,
) {
  if (!context.recordId || !assetHasMovements(context.state, context.recordId)) return;
  const original = requireRecord(
    context.state.assets.find((asset) => asset.id === context.recordId),
  );
  const changed =
    data.openingValue !== original.openingValue ||
    data.openingAt !== new Date(original.openingAt).toISOString() ||
    data.type !== original.type;
  if (changed) throw new AppError(409, FINANCE_MESSAGES.usedAsset);
}
function prepareAsset(context: FinanceOperationContext, input: unknown) {
  const data = createSchemas.assets.parse(input);
  assertNotFuture(data.openingAt);
  assertAssetHistory(context, data);
  return recordCommands(context.repositories.assets, context, data);
}
function assertUniqueCategory(
  context: FinanceOperationContext,
  data: ReturnType<typeof createSchemas.categories.parse>,
) {
  const duplicate = context.state.categories.some(
    (category) =>
      category.id !== context.recordId &&
      category.kind === data.kind &&
      category.name.toLocaleLowerCase('vi') === data.name.toLocaleLowerCase('vi'),
  );
  if (duplicate) throw new AppError(409, FINANCE_MESSAGES.duplicateCategory);
}
function assertCategoryHistory(
  context: FinanceOperationContext,
  data: ReturnType<typeof createSchemas.categories.parse>,
) {
  if (!context.recordId || !categoryIsUsed(context.state, context.recordId)) return;
  const original = requireRecord(
    context.state.categories.find((category) => category.id === context.recordId),
  );
  if (original.kind !== data.kind) throw new AppError(409, FINANCE_MESSAGES.usedCategory);
}
function prepareCategory(context: FinanceOperationContext, input: unknown) {
  const data = createSchemas.categories.parse(input);
  assertUniqueCategory(context, data);
  assertCategoryHistory(context, data);
  return recordCommands(context.repositories.categories, context, data);
}
function preparePlan(context: FinanceOperationContext, input: unknown) {
  const data = createSchemas.plans.parse(input);
  assertActiveCategory(context.state, data);
  return recordCommands(context.repositories.plans, context, data);
}
async function replaceAllocations<TransactionRecord extends { id: string }>(
  context: FinanceOperationContext,
  transaction: TransactionRecord,
  allocations: ReturnType<typeof createSchemas.transactions.parse>['allocations'],
) {
  await context.repositories.allocations.replace(context.userId, transaction.id, allocations);
  return { ...transaction, allocations };
}
function prepareTransaction(context: FinanceOperationContext, input: unknown) {
  const data = createSchemas.transactions.parse(input);
  assertActiveCategory(context.state, data);
  assertMovementDate(context.state, {
    assetIds: data.allocations.map((allocation) => allocation.assetAccountId),
    occurredAt: data.occurredAt,
  });
  const { allocations, ...transactionData } = data;
  const commands = recordCommands(context.repositories.transactions, context, transactionData);
  return {
    create: async () => replaceAllocations(context, await commands.create(), allocations),
    update: async (recordId: string, version: number) =>
      replaceAllocations(context, await commands.update(recordId, version), allocations),
  };
}
function prepareTransfer(context: FinanceOperationContext, input: unknown) {
  const data = createSchemas.transfers.parse(input);
  assertMovementDate(context.state, {
    assetIds: [data.fromAssetAccountId, data.toAssetAccountId],
    occurredAt: data.occurredAt,
  });
  return recordCommands(context.repositories.transfers, context, data);
}
function prepareAdjustment(context: FinanceOperationContext, input: unknown) {
  const data = createSchemas.adjustments.parse(input);
  assertMovementDate(context.state, {
    assetIds: [data.assetAccountId],
    occurredAt: data.occurredAt,
  });
  return recordCommands(context.repositories.adjustments, context, data);
}

export const resourcePreparers = {
  assets: prepareAsset,
  categories: prepareCategory,
  plans: preparePlan,
  transactions: prepareTransaction,
  transfers: prepareTransfer,
  adjustments: prepareAdjustment,
};
