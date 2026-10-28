import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { createDatabase } from '../configs/database.ts';
import { loadEnvironment } from '../configs/environment.ts';
import { financeService } from '../services/finance.service.ts';
import { financeReadService } from '../services/finance-read.service.ts';
import { statisticsService } from '../services/statistics.service.ts';
import { repositories, withUserWrite } from '../repositories/finance.repository.ts';
import { userRepository } from '../repositories/user.repository.ts';
import { UserModel, AssetAccountModel, CategoryModel } from '../models/index.ts';
import { localDay } from '../utils/finance.ts';
import { jsonSafe } from '../utils/serialize.ts';
type Connection = ReturnType<typeof createDatabase>;
interface Measurement {
  medianMs: number;
  samplesMs: number[];
  bytes?: number;
}
function fixtureIdentifiers() {
  const now = new Date(),
    timezone = 'Asia/Ho_Chi_Minh';
  return {
    userId: randomUUID(),
    assetIds: Array.from({ length: 8 }, () => randomUUID()),
    categoryIds: Array.from({ length: 32 }, () => randomUUID()),
    timezone,
    end: localDay(now.toISOString(), timezone),
    start: localDay(new Date(now.getTime() - 365 * 86400000).toISOString(), timezone),
  };
}
async function seed(database: Connection, fixture: ReturnType<typeof fixtureIdentifiers>) {
  await database.db.insert(UserModel).values({
    id: fixture.userId,
    email: 'moneymate-perf-' + fixture.userId + '@example.invalid',
    displayName: 'Disposable performance fixture',
  });
  await database.db.insert(AssetAccountModel).values(
    fixture.assetIds.map((id, index) => ({
      id,
      userId: fixture.userId,
      name: 'Performance asset ' + index,
      type: index === 0 ? ('cash' as const) : ('bank' as const),
      openingValue: 10000000000n,
      openingAt: '2023-01-01T00:00:00Z',
    })),
  );
  await database.db.insert(CategoryModel).values(
    fixture.categoryIds.map((id, index) => ({
      id,
      userId: fixture.userId,
      name: 'Performance category ' + index,
      kind: index === 0 ? ('income' as const) : ('expense' as const),
    })),
  );
  await database.pool.query(
    "INSERT INTO transactions (user_id,category_id,kind,amount,title,occurred_at) SELECT $1,($2::uuid[])[(record%32)+1],CASE WHEN record%32=0 THEN 'income' ELSE 'expense' END,10000+(record%1000),'Performance transaction '||record,now()-(record%365)*interval '1 day'-interval '1 hour' FROM generate_series(1,20000) record",
    [fixture.userId, fixture.categoryIds],
  );
  await database.pool.query(
    'INSERT INTO transaction_allocations (user_id,transaction_id,asset_account_id,amount) SELECT $1,id,($2::uuid[])[(row_number() OVER(ORDER BY id)%8)+1],amount FROM transactions WHERE user_id=$1',
    [fixture.userId, fixture.assetIds],
  );
  await database.pool.query(
    "INSERT INTO monthly_category_plans (user_id,category_id,kind,month,planned_amount) SELECT $1,id,kind,date_trunc('month',now())::date,1000000 FROM categories WHERE user_id=$1",
    [fixture.userId],
  );
}
async function cleanup(database: Connection, userId: string) {
  await withUserWrite(database.db, userId, async (transaction) => {
    const finance = repositories(transaction);
    await finance.allocations.removeAll(userId);
    await finance.transactions.removeAll(userId);
    await finance.plans.removeAll(userId);
    await finance.transfers.removeAll(userId);
    await finance.adjustments.removeAll(userId);
    await finance.categories.removeAll(userId);
    await finance.assets.removeAll(userId);
    await userRepository(transaction).remove(userId);
  });
}
async function sample<Result>(operation: () => Promise<Result>) {
  const times: number[] = [];
  let value: Result | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    const start = performance.now();
    value = await operation();
    times.push(performance.now() - start);
  }
  times.sort((first, second) => first - second);
  return {
    value: value!,
    metric: { medianMs: +times[1].toFixed(2), samplesMs: times.map((time) => +time.toFixed(2)) },
  };
}
async function measure(database: Connection, fixture: ReturnType<typeof fixtureIdentifiers>) {
  const finance = financeService(database.db),
    read = financeReadService(database.db);
  const user = { id: fixture.userId, timezone: fixture.timezone };
  const metrics: Record<string, Measurement> = {};
  const window = await sample(() =>
    read.state({ user, query: { month: fixture.end.slice(0, 7), limit: 50 } }),
  );
  metrics.window = {
    ...window.metric,
    bytes: Buffer.byteLength(JSON.stringify(jsonSafe(window.value))),
  };
  metrics.page = (
    await sample(() =>
      read.list({
        user,
        resource: 'transactions',
        query: { month: fixture.end.slice(0, 7), limit: 50 },
      }),
    )
  ).metric;
  metrics.report = (
    await sample(() =>
      statisticsService(database.db).report(user.id, user.timezone, {
        start: fixture.start,
        end: fixture.end,
        period: 'month',
      }),
    )
  ).metric;
  const created: { id: string; version: number }[] = [];
  metrics.create = (
    await sample(async () => {
      const record = await finance.create({
        userId: user.id,
        resource: 'transactions',
        input: {
          title: 'Benchmark CRUD',
          kind: 'expense',
          categoryId: fixture.categoryIds[1],
          amount: '1000',
          occurredAt: new Date().toISOString(),
          allocations: [{ assetAccountId: fixture.assetIds[0], amount: '1000' }],
        },
      });
      created.push(record);
    })
  ).metric;
  metrics.update = (
    await sample(async () => {
      const record = created.shift()!;
      const updated = await finance.update({
        userId: user.id,
        resource: 'transactions',
        recordId: record.id,
        input: {
          version: record.version,
          title: 'Updated benchmark CRUD',
          kind: 'expense',
          categoryId: fixture.categoryIds[1],
          amount: '2000',
          occurredAt: new Date().toISOString(),
          allocations: [{ assetAccountId: fixture.assetIds[0], amount: '2000' }],
        },
      });
      created.push(updated);
    })
  ).metric;
  metrics.remove = (
    await sample(async () => {
      const record = created.shift()!;
      await finance.remove({
        userId: user.id,
        resource: 'transactions',
        recordId: record.id,
        input: { version: record.version },
      });
    })
  ).metric;
  metrics.reconcile = (
    await sample(async () => {
      const asset = await read.find({
        userId: user.id,
        resource: 'assets',
        id: fixture.assetIds[0],
      });
      await finance.reconcile(user.id, fixture.assetIds[0], {
        version: asset.version,
        value: (10000000000n + BigInt(Number(asset.version))).toString(),
        note: 'Benchmark reconciliation',
      });
    })
  ).metric;
  return metrics;
}
async function main() {
  if (process.env.RUN_DB_BENCHMARK !== '1') {
    console.error(
      'Set RUN_DB_BENCHMARK=1 to create and clean a disposable 20,000-row database fixture.',
    );
    process.exitCode = 1;
    return;
  }
  const database = createDatabase(
    { ...loadEnvironment(), DB_CONNECTION_TIMEOUT_MS: 30000 },
    { queryTimeoutMs: 60000 },
  );
  const fixture = fixtureIdentifiers();
  try {
    await seed(database, fixture);
    console.log(
      JSON.stringify(
        {
          records: 20000,
          assets: 8,
          categories: 32,
          scope:
            'Backend services + PostgreSQL network wall time; excludes HTTP auth and mobile rendering',
          measurements: await measure(database, fixture),
        },
        null,
        2,
      ),
    );
  } finally {
    try {
      await cleanup(database, fixture.userId);
    } finally {
      await database.pool.end();
    }
  }
}
void main().catch((error: unknown) => {
  const failure = error as { code?: string; cause?: { code?: string } };
  const code = failure.code ?? failure.cause?.code;
  if (code && /^[A-Z0-9_]{1,40}$/.test(code)) console.error('Database error code: ' + code);
  console.error('Benchmark failed. Connection details and credentials are not logged.');
  process.exitCode = 1;
});
