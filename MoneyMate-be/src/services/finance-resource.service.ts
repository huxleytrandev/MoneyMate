import { createSchemas } from '../schemas/api.schema.ts';
import { FINANCE_MESSAGES } from '../constants/finance.constant.ts';
import type { FinanceOperationContext, RecordWriter } from '../types/finance-operation.types.ts';
import { AppError } from '../utils/app-error.ts';
import {
  requireRecord,
  assertNotFuture,
  assertMovementReferences,
  assertCategoryReference,
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
async function assertAssetHistory(
  context: FinanceOperationContext,
  data: ReturnType<typeof createSchemas.assets.parse>,
) {
  if (!context.recordId) return;
  const original = requireRecord(context.current);
  if (!('openingValue' in original)) throw new AppError(404, FINANCE_MESSAGES.notFound);
  const changed =
    data.openingValue !== original.openingValue ||
    data.openingAt !== new Date(original.openingAt).toISOString() ||
    data.type !== original.type;
  if (changed && (await context.queries.assetIsUsed(context.recordId)))
    throw new AppError(409, FINANCE_MESSAGES.usedAsset);
}
async function prepareAsset(context: FinanceOperationContext, input: unknown) {
  const data = createSchemas.assets.parse(input);
  assertNotFuture(data.openingAt);
  await assertAssetHistory(context, data);
  return recordCommands(context.repositories.assets, context, data);
}
async function assertUniqueCategory(
  context: FinanceOperationContext,
  data: ReturnType<typeof createSchemas.categories.parse>,
) {
  if (await context.queries.categoryNameExists({ ...data, excludeId: context.recordId }))
    throw new AppError(409, FINANCE_MESSAGES.duplicateCategory);
}
async function assertCategoryHistory(
  context: FinanceOperationContext,
  data: ReturnType<typeof createSchemas.categories.parse>,
) {
  if (!context.recordId) return;
  const original = requireRecord(context.current);
  if (!('kind' in original) || !('name' in original))
    throw new AppError(404, FINANCE_MESSAGES.notFound);
  if (original.kind !== data.kind && (await context.queries.categoryIsUsed(context.recordId)))
    throw new AppError(409, FINANCE_MESSAGES.usedCategory);
}
async function prepareCategory(context: FinanceOperationContext, input: unknown) {
  const data = createSchemas.categories.parse(input);
  await assertUniqueCategory(context, data);
  await assertCategoryHistory(context, data);
  return recordCommands(context.repositories.categories, context, data);
}
async function preparePlan(context: FinanceOperationContext, input: unknown) {
  const data = createSchemas.plans.parse(input);
  assertCategoryReference(await context.queries.activeCategory(data));
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
async function prepareTransaction(context: FinanceOperationContext, input: unknown) {
  const data = createSchemas.transactions.parse(input);
  assertNotFuture(data.occurredAt);
  const assetIds = data.allocations.map((allocation) => allocation.assetAccountId);
  assertMovementReferences(
    await context.queries.movementReferences({ ...data, assetIds }),
    assetIds,
  );
  const { allocations, ...transactionData } = data;
  const commands = recordCommands(context.repositories.transactions, context, transactionData);
  return {
    create: async () => replaceAllocations(context, await commands.create(), allocations),
    update: async (recordId: string, version: number) =>
      replaceAllocations(context, await commands.update(recordId, version), allocations),
  };
}
async function prepareTransfer(context: FinanceOperationContext, input: unknown) {
  const data = createSchemas.transfers.parse(input);
  assertNotFuture(data.occurredAt);
  const assetIds = [data.fromAssetAccountId, data.toAssetAccountId];
  assertMovementReferences(
    await context.queries.movementReferences({ ...data, assetIds }),
    assetIds,
  );
  return recordCommands(context.repositories.transfers, context, data);
}
async function prepareAdjustment(context: FinanceOperationContext, input: unknown) {
  const data = createSchemas.adjustments.parse(input);
  assertNotFuture(data.occurredAt);
  const assetIds = [data.assetAccountId];
  assertMovementReferences(
    await context.queries.movementReferences({ ...data, assetIds }),
    assetIds,
  );
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
