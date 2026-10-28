import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { financeWriteRepository } from '../src/repositories/finance-write.repository.ts';
import { repositories } from '../src/repositories/finance.repository.ts';
import { resourcePreparers } from '../src/services/finance-resource.service.ts';
import { touchMovementAssets } from '../src/services/finance-movement.service.ts';
import { assertMovementReferences } from '../src/utils/finance-validation.ts';
import type { Executor } from '../src/types/database.types.ts';
import type { FinanceOperationContext } from '../src/types/finance-operation.types.ts';
import { AppError } from '../src/utils/app-error.ts';

const userId = '550e8400-e29b-41d4-a716-446655440000';
const firstAssetId = '550e8400-e29b-41d4-a716-446655440001';
const secondAssetId = '550e8400-e29b-41d4-a716-446655440002';
const thirdAssetId = '550e8400-e29b-41d4-a716-446655440003';
const openingAt = '2020-01-01T00:00:00.000Z';

function queryHarness(row: Record<string, unknown> = {}) {
  const queries: { sql: string; params: unknown[] }[] = [];
  const database = {
    execute: async (statement: Parameters<PgDialect['sqlToQuery']>[0]) => {
      queries.push(new PgDialect().sqlToQuery(statement));
      return { rows: [row] };
    },
    select: () => {
      throw new Error('Unbounded record selection is not allowed in this test');
    },
  } as unknown as Executor;
  const context: FinanceOperationContext = {
    userId,
    repositories: repositories(database),
    queries: financeWriteRepository(database, userId),
  };
  return { queries, context };
}
test('write reference checks use one owner-scoped aggregate for only the requested assets', async () => {
  const harness = queryHarness({ categoryValid: true, assetCount: 2, openingValid: true });
  const references = await harness.context.queries.movementReferences({
    assetIds: [firstAssetId, secondAssetId, firstAssetId],
    occurredAt: openingAt,
  });
  assert.deepEqual(references, { categoryValid: true, assetCount: 2, openingValid: true });
  assert.equal(harness.queries.length, 1);
  assert.match(harness.queries[0].sql, /count\(\*\)/);
  assert.equal(harness.queries[0].params.filter((value) => value === firstAssetId).length, 1);
  assert.ok(harness.queries[0].params.includes(userId));
});
test('usage and balance queries aggregate on PostgreSQL and preserve bigint precision', async () => {
  const harness = queryHarness({ used: true, balance: '9007199254740993' });
  assert.equal(await harness.context.queries.assetIsUsed(firstAssetId), true);
  assert.equal(await harness.context.queries.categoryIsUsed(secondAssetId), true);
  assert.equal(
    await harness.context.queries.assetBalance(firstAssetId, openingAt),
    9007199254740993n,
  );
  assert.equal(harness.queries.length, 3);
  assert.match(harness.queries[0].sql, /select exists/);
  assert.match(harness.queries[1].sql, /deleted_at is null/);
  assert.match(harness.queries[2].sql, /sum\(/);
  assert.ok(harness.queries.every((query) => query.params.includes(userId)));
});
test('renaming a used asset avoids history reads; changing its opening value remains blocked', async () => {
  const { context } = queryHarness();
  let historyChecks = 0;
  context.recordId = firstAssetId;
  context.current = {
    id: firstAssetId,
    userId,
    name: 'Cash',
    type: 'cash',
    openingValue: 100n,
    openingAt,
    note: null,
    isArchived: false,
    version: 1,
    createdAt: openingAt,
    updatedAt: openingAt,
    deletedAt: null,
  };
  context.queries.assetIsUsed = async () => {
    historyChecks++;
    return true;
  };
  await resourcePreparers.assets(context, {
    name: 'Renamed cash',
    type: 'cash',
    openingValue: '100',
    openingAt,
  });
  assert.equal(historyChecks, 0);
  await assert.rejects(
    () =>
      resourcePreparers.assets(context, {
        name: 'Cash',
        type: 'cash',
        openingValue: '200',
        openingAt,
      }),
    (failure) => failure instanceof AppError && failure.status === 409,
  );
  assert.equal(historyChecks, 1);
});
test('asset version touches include removed and newly selected allocation sources exactly once', async () => {
  const { context } = queryHarness();
  let touchedIds: string[] = [];
  context.repositories.assets.touchAll = async (_owner, ids) => {
    touchedIds = ids;
  };
  await touchMovementAssets(context, 'transactions', [
    { allocations: [{ assetAccountId: firstAssetId }, { assetAccountId: secondAssetId }] },
    { allocations: [{ assetAccountId: secondAssetId }, { assetAccountId: thirdAssetId }] },
  ]);
  assert.deepEqual(new Set(touchedIds), new Set([firstAssetId, secondAssetId, thirdAssetId]));
  assert.equal(touchedIds.length, 3);
});
test('bounded reference validation still rejects missing owners, archived sources and invalid opening dates', () => {
  const invalidReferences = [
    { categoryValid: false, assetCount: 1, openingValid: true },
    { categoryValid: true, assetCount: 0, openingValid: true },
    { categoryValid: true, assetCount: 1, openingValid: false },
  ];
  for (const invalid of invalidReferences)
    assert.throws(
      () => assertMovementReferences(invalid, [firstAssetId]),
      (failure) => failure instanceof AppError && failure.status === 422,
    );
});
