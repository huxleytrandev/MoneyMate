import { z } from 'zod';
import { repositories, loadSnapshot, withUserWrite } from '../repositories/finance.repository.ts';
import { financeWriteRepository } from '../repositories/finance-write.repository.ts';
import { reconcileSchema, versionSchema } from '../schemas/api.schema.ts';
import { idSchema } from '../schemas/common.schema.ts';
import { API_MESSAGES } from '../constants/http.constant.ts';
import { FINANCE_MESSAGES } from '../constants/finance.constant.ts';
import { AppError } from '../utils/app-error.ts';
import { requireRecord, assertVersion } from '../utils/finance-validation.ts';
import { resourcePreparers } from './finance-resource.service.ts';
import { touchMovementAssets } from './finance-movement.service.ts';
import type { Database, DatabaseTransaction } from '../types/database.types.ts';
import type {
  CreateFinanceCommand,
  UpdateFinanceCommand,
  FinanceOperationContext,
} from '../types/finance-operation.types.ts';

function operationContext(
  transaction: DatabaseTransaction,
  userId: string,
): FinanceOperationContext {
  return {
    userId,
    repositories: repositories(transaction),
    queries: financeWriteRepository(transaction, userId),
  };
}
function createBody(input: unknown) {
  const { version: _version, ...body } = z.record(z.string(), z.unknown()).parse(input);
  void _version;
  return body;
}
function updateBody(input: unknown, recordId: string) {
  const { version: _version, id: bodyId, ...body } = z.record(z.string(), z.unknown()).parse(input);
  void _version;
  if (bodyId && bodyId !== recordId) throw new AppError(422, API_MESSAGES.immutableId);
  return body;
}
async function requireCurrentRecord(
  context: FinanceOperationContext,
  command: UpdateFinanceCommand,
) {
  idSchema.parse(command.recordId);
  const current = requireRecord(
    await context.queries.findRecord(command.resource, command.recordId),
  );
  const { version } = z.object({ version: versionSchema }).parse(command.input);
  assertVersion(current, version);
  return current;
}
async function assertRemovable(context: FinanceOperationContext, command: UpdateFinanceCommand) {
  if (command.resource === 'assets' && (await context.queries.assetIsUsed(command.recordId)))
    throw new AppError(409, FINANCE_MESSAGES.usedAsset);
  if (command.resource === 'categories' && (await context.queries.categoryIsUsed(command.recordId)))
    throw new AppError(409, FINANCE_MESSAGES.usedCategory);
}
async function reconcileAsset(context: FinanceOperationContext, recordId: string, input: unknown) {
  idSchema.parse(recordId);
  const data = reconcileSchema.parse(input);
  const asset = requireRecord(await context.repositories.assets.find(context.userId, recordId));
  assertVersion(asset, data.version);
  if (asset.isArchived) throw new AppError(422, FINANCE_MESSAGES.invalidReference);
  const balance = await context.queries.assetBalance(recordId, new Date().toISOString());
  const deltaAmount = data.value - balance;
  if (deltaAmount === 0n) return asset;
  requireRecord(
    await context.repositories.assets.update(context.userId, recordId, data.version, {}),
  );
  return context.repositories.adjustments.create(context.userId, {
    assetAccountId: recordId,
    deltaAmount,
    reason: 'reconciliation',
    note: data.note,
    occurredAt: new Date().toISOString(),
  });
}
export function financeService(database: Database, existingTransaction?: DatabaseTransaction) {
  function write<Result>(
    userId: string,
    work: (transaction: DatabaseTransaction) => Promise<Result>,
  ) {
    return existingTransaction ? work(existingTransaction) : withUserWrite(database, userId, work);
  }
  async function create(command: CreateFinanceCommand) {
    const body = createBody(command.input);
    return write(command.userId, async (transaction) => {
      const context = operationContext(transaction, command.userId);
      const writer = await resourcePreparers[command.resource](context, body);
      const result = await writer.create();
      await touchMovementAssets(context, command.resource, [result]);
      return result;
    });
  }
  async function update(command: UpdateFinanceCommand) {
    return write(command.userId, async (transaction) => {
      const context = operationContext(transaction, command.userId);
      const current = await requireCurrentRecord(context, command);
      const body = updateBody(command.input, command.recordId);
      const writer = await resourcePreparers[command.resource](
        { ...context, current, recordId: command.recordId },
        body,
      );
      const result = await writer.update(command.recordId, current.version);
      await touchMovementAssets(context, command.resource, [result, current]);
      return result;
    });
  }
  async function remove(command: UpdateFinanceCommand) {
    return write(command.userId, async (transaction) => {
      const context = operationContext(transaction, command.userId);
      const current = await requireCurrentRecord(context, command);
      await assertRemovable(context, command);
      await touchMovementAssets(context, command.resource, [current]);
      return requireRecord(
        await context.repositories[command.resource].remove(
          command.userId,
          command.recordId,
          current.version,
        ),
      );
    });
  }
  return {
    snapshot: (userId: string) =>
      database.transaction((transaction) => loadSnapshot(transaction, userId), {
        isolationLevel: 'repeatable read',
      }),
    create,
    update,
    remove,
    reconcile: (userId: string, recordId: string, input: unknown) =>
      write(userId, (transaction) =>
        reconcileAsset(operationContext(transaction, userId), recordId, input),
      ),
  };
}
