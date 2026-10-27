import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/configs/express.config.ts';
import { environmentSchema } from '../src/schemas/environment.schema.ts';
import {
  moneySchema,
  positiveMoneySchema,
  signedMoneySchema,
  monthSchema,
} from '../src/schemas/common.schema.ts';
import { createTransactionSchema } from '../src/schemas/transaction.schema.ts';
import { createTransferSchema } from '../src/schemas/transfer.schema.ts';
import { registerUserSchema } from '../src/schemas/user.schema.ts';

const accountA = '550e8400-e29b-41d4-a716-446655440000';
const accountB = '550e8400-e29b-41d4-a716-446655440001';
const transaction = {
  categoryId: accountA,
  kind: 'expense',
  title: '  Ăn trưa  ',
  amount: '100000',
  occurredAt: '2026-10-26T12:00:00+07:00',
  allocations: [
    { assetAccountId: accountA, amount: '40000' },
    { assetAccountId: accountB, amount: '60000' },
  ],
};

test('money preserves bigint precision and rejects invalid values', () => {
  assert.equal(moneySchema.parse('9007199254740993'), 9007199254740993n);
  assert.equal(moneySchema.parse(0), 0n);
  for (const value of [
    '',
    true,
    null,
    '1.2',
    '50,000',
    '-1',
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
    '9223372036854775808',
  ]) {
    assert.equal(moneySchema.safeParse(value).success, false);
  }
  assert.equal(positiveMoneySchema.safeParse('0').success, false);
  assert.equal(signedMoneySchema.parse('-100'), -100n);
});

test('transactions normalize title and timestamp and enforce complete allocation', () => {
  const parsed = createTransactionSchema.parse(transaction);
  assert.equal(parsed.title, 'Ăn trưa');
  assert.equal(parsed.amount, 100000n);
  assert.equal(parsed.occurredAt, '2026-10-26T05:00:00.000Z');
  assert.equal(
    createTransactionSchema.safeParse({ ...transaction, categoryId: undefined }).success,
    false,
  );
  assert.equal(
    createTransactionSchema.safeParse({ ...transaction, allocations: [] }).success,
    false,
  );
  assert.equal(
    createTransactionSchema.safeParse({ ...transaction, amount: '90000' }).success,
    false,
  );
  assert.equal(
    createTransactionSchema.safeParse({ ...transaction, userId: accountA }).success,
    false,
  );
  assert.equal(
    createTransactionSchema.safeParse({
      ...transaction,
      allocations: [
        { assetAccountId: accountA, amount: '50000' },
        { assetAccountId: accountA, amount: '50000' },
      ],
    }).success,
    false,
  );
});

test('plans require valid calendar month and transfers require different accounts', () => {
  assert.equal(monthSchema.parse('2026-11-01'), '2026-11-01');
  for (const value of ['2026-11-02', '2026-02-30', '2026-13-01'])
    assert.equal(monthSchema.safeParse(value).success, false);
  const transfer = {
    fromAssetAccountId: accountA,
    toAssetAccountId: accountA,
    amount: '100',
    occurredAt: transaction.occurredAt,
  };
  assert.equal(createTransferSchema.safeParse(transfer).success, false);
  assert.equal(
    createTransferSchema.safeParse({ ...transfer, toAssetAccountId: accountB }).success,
    true,
  );
});

test('registration normalizes identity but never trims password', () => {
  const password = '  secret-password  ';
  const parsed = registerUserSchema.parse({
    email: ' USER@EXAMPLE.COM ',
    displayName: '  Người dùng ',
    password,
  });
  assert.equal(parsed.email, 'user@example.com');
  assert.equal(parsed.displayName, 'Người dùng');
  assert.equal(parsed.password, password);
  assert.equal(
    registerUserSchema.safeParse({
      email: 'a@example.com',
      displayName: 'A',
      password,
      timezone: 'invalid-zone',
    }).success,
    false,
  );
});

test('environment requires PostgreSQL config and rejects invalid ports', () => {
  assert.equal(environmentSchema.safeParse({}).success, false);
  const base = { DATABASE_URL: 'postgresql://user:password@localhost:5432/moneymate' };
  assert.equal(environmentSchema.parse(base).PORT, 3000);
  assert.equal(environmentSchema.safeParse({ ...base, PORT: '0' }).success, false);
  assert.equal(
    environmentSchema.safeParse({ ...base, DATABASE_URL: 'https://example.com/db' }).success,
    false,
  );
});

test('readiness checks database and does not expose connection errors', async () => {
  let connected = true;
  const application = createApplication({
    checkReadiness: async () => {
      if (!connected) throw new Error('secret database password');
    },
  });
  const app = application.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => app.once('listening', resolve));
  try {
    const address = app.address();
    assert.ok(address && typeof address !== 'string');
    const base = 'http://127.0.0.1:' + address.port;
    assert.equal((await fetch(base + '/api/health')).status, 200);
    assert.equal((await fetch(base + '/api/ready')).status, 200);
    connected = false;
    const response = await fetch(base + '/api/ready');
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: 'not_ready', database: 'unavailable' });
  } finally {
    await new Promise<void>((resolve, reject) =>
      app.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

import { secretSchema } from '../src/schemas/secret.schema.ts';

test('configuration uses Better Auth instead of unused JWT expiry and salt options', () => {
  const base = {
    DATABASE_URL: 'postgresql://user:password@localhost:5432/moneymate',
    BETTER_AUTH_SECRET: 'test-only-secret-with-more-than-32-characters',
  };
  const config = secretSchema.parse(base);
  assert.equal(config.BETTER_AUTH_URL, 'http://localhost:3000/api/auth');
  assert.equal(config.SERVER_URL, 'http://localhost:3000/api');
  assert.equal(config.FRONTEND_BASE_URL, undefined);
  assert.equal(
    secretSchema.parse({ ...base, PORT: '4000' }).BETTER_AUTH_URL,
    'http://localhost:4000/api/auth',
  );
  assert.equal(secretSchema.safeParse({ ...base, FRONTEND_BASE_URL: 'not-a-url' }).success, false);
});

test('Express config serves docs, JSON errors and configured CORS only', async () => {
  const application = createApplication({
    checkReadiness: async () => {},
    frontendBaseUrl: 'http://localhost:8081',
  });
  const server = application.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = 'http://127.0.0.1:' + address.port;
    const health = await fetch(base + '/api/health', {
      headers: { Origin: 'http://localhost:8081' },
    });
    assert.equal(health.status, 200);
    assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(health.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.ok(health.headers.get('content-security-policy'));
    assert.equal(health.headers.get('x-powered-by'), null);
    assert.equal(health.headers.get('access-control-allow-origin'), 'http://localhost:8081');
    assert.equal(health.headers.get('access-control-allow-credentials'), 'true');
    const unknown = await fetch(base + '/missing');
    assert.equal(unknown.status, 404);
    assert.deepEqual(await unknown.json(), { error: 'Not found' });
    const malformed = await fetch(base + '/missing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{bad',
    });
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { error: 'Invalid request body' });
    assert.equal((await fetch(base + '/api/docs/')).status, 200);
    const spec = await (await fetch(base + '/api/docs.json')).json();
    assert.equal(spec.openapi, '3.0.3');
    assert.ok(spec.paths['/api/ready']);
    const preflight = await fetch(base + '/api/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:8081',
        'Access-Control-Request-Method': 'GET',
      },
    });
    assert.equal(preflight.status, 204);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test('CORS does not enable browser access when no frontend origin is configured', async () => {
  const application = createApplication({ checkReadiness: async () => {} });
  const server = application.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const result = await fetch('http://127.0.0.1:' + address.port + '/api/health', {
      headers: { Origin: 'http://example.com' },
    });
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('access-control-allow-origin'), null);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

import { databaseErrorMessage } from '../src/utils/database-error.ts';

test('database diagnostics give useful guidance without leaking raw error values', () => {
  const sensitive = 'postgresql://user:secret@private-host/database';
  assert.match(databaseErrorMessage({ code: 'ENOTFOUND', message: sensitive }), /Session pooler/);
  assert.match(databaseErrorMessage({ code: '28P01', message: sensitive }), /username or password/);
  assert.equal(databaseErrorMessage({ message: sensitive }).includes(sensitive), false);
  assert.equal(
    databaseErrorMessage({ code: 'ENOTFOUND', message: sensitive }).includes('private-host'),
    false,
  );
});

import express from 'express';
import { createUserRoutes } from '../src/routes/user.route.ts';
test('sensitive user routes share a rate limit while profile reads remain available', async () => {
  const app = express();
  app.use(express.json());
  app.use(
    '/users',
    createUserRoutes({
      me: (_request, response) => {
        response.json({ ok: true });
      },
      verifyPassword: (_request, response) => {
        response.status(400).json({ error: 'Wrong password' });
      },
      remove: (_request, response) => {
        response.status(400).json({ error: 'Wrong password' });
      },
    }),
  );
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = 'http://127.0.0.1:' + address.port;
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await fetch(base + '/users/me/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"password":"wrong"}',
      });
      assert.equal(result.status, 400);
    }
    const blocked = await fetch(base + '/users/me', { method: 'DELETE' });
    assert.equal(blocked.status, 429);
    assert.ok(blocked.headers.get('retry-after'));
    assert.equal((await fetch(base + '/users/me')).status, 200);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((failure) => (failure ? reject(failure) : resolve())),
    );
  }
});
test('production Helmet enables HSTS and HTTPS upgrades', async () => {
  const app = createApplication({ checkReadiness: async () => {}, environment: 'production' });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const response = await fetch('http://127.0.0.1:' + address.port + '/api/health');
    assert.match(response.headers.get('strict-transport-security') ?? '', /max-age=31536000/);
    assert.match(
      response.headers.get('content-security-policy') ?? '',
      /upgrade-insecure-requests/,
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((failure) => (failure ? reject(failure) : resolve())),
    );
  }
});
