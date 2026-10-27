import { z } from 'zod';
import { repositories, loadSnapshot, withUserWrite } from '../repositories/finance.repository.ts';
import { reconcileSchema, versionSchema } from '../schemas/api.schema.ts';
import { idSchema } from '../schemas/common.schema.ts';
import { API_MESSAGES } from '../constants/http.constant.ts';
import { FINANCE_MESSAGES } from '../constants/finance.constant.ts';
import { AppError } from '../utils/app-error.ts';
import { balanceAt } from '../utils/finance.ts';
import {
  requireRecord,
  assertVersion,
  assetHasMovements,
  categoryIsUsed,
} from '../utils/finance-validation.ts';
import { resourcePreparers } from './finance-resource.service.ts';
import { touchMovementAssets } from './finance-movement.service.ts';
import type { Database, DatabaseTransaction } from '../types/database.types.ts';
import type {
  CreateFinanceCommand,
  UpdateFinanceCommand,
  FinanceOperationContext,
} from '../types/finance-operation.types.ts';

async function operationContext(transaction: DatabaseTransaction, command: CreateFinanceCommand) {
  return {
    userId: command.userId,
    state: await loadSnapshot(transaction, command.userId),
    repositories: repositories(transaction),
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
function requireCurrentRecord(context: FinanceOperationContext, command: UpdateFinanceCommand) {
  idSchema.parse(command.recordId);
  const current = requireRecord(
    context.state[command.resource].find((record) => record.id === command.recordId),
  );
  const { version } = z.object({ version: versionSchema }).parse(command.input);
  assertVersion(current, version);
  return current;
}
function assertRemovable(context: FinanceOperationContext, command: UpdateFinanceCommand) {
  if (command.resource === 'assets' && assetHasMovements(context.state, command.recordId))
    throw new AppError(409, FINANCE_MESSAGES.usedAsset);
  if (command.resource === 'categories' && categoryIsUsed(context.state, command.recordId))
    throw new AppError(409, FINANCE_MESSAGES.usedCategory);
}
async function reconcileAsset(context: FinanceOperationContext, recordId: string, input: unknown) {
  idSchema.parse(recordId);
  const data = reconcileSchema.parse(input);
  const asset = requireRecord(context.state.assets.find((candidate) => candidate.id === recordId));
  assertVersion(asset, data.version);
  if (asset.isArchived) throw new AppError(422, FINANCE_MESSAGES.invalidReference);
  const deltaAmount = data.value - balanceAt(context.state, recordId);
  if (deltaAmount === 0n) return asset;
  await context.repositories.assets.update(context.userId, recordId, data.version, {});
  return context.repositories.adjustments.create(context.userId, {
    assetAccountId: recordId,
    deltaAmount,
    reason: 'reconciliation',
    note: data.note,
    occurredAt: new Date().toISOString(),
  });
}
export function financeService(database: Database) {
  async function create(command: CreateFinanceCommand) {
    return withUserWrite(database, command.userId, async (transaction) => {
      const context = await operationContext(transaction, command);
      const result = await resourcePreparers[command.resource](
        context,
        createBody(command.input),
      ).create();
      await touchMovementAssets(context, command.resource, [result]);
      return result;
    });
  }
  async function update(command: UpdateFinanceCommand) {
    return withUserWrite(database, command.userId, async (transaction) => {
      const context = {
        ...(await operationContext(transaction, command)),
        recordId: command.recordId,
      };
      const current = requireCurrentRecord(context, command);
      const body = updateBody(command.input, command.recordId);
      const result = await resourcePreparers[command.resource](context, body).update(
        command.recordId,
        current.version,
      );
      await touchMovementAssets(context, command.resource, [result, current]);
      return result;
    });
  }
  async function remove(command: UpdateFinanceCommand) {
    return withUserWrite(database, command.userId, async (transaction) => {
      const context = await operationContext(transaction, command);
      const current = requireCurrentRecord(context, command);
      assertRemovable(context, command);
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
      withUserWrite(database, userId, async (transaction) => {
        const context = await operationContext(transaction, { userId, resource: 'assets', input });
        return reconcileAsset(context, recordId, input);
      }),
  };
}
