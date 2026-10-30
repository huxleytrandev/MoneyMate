import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { once } from 'node:events';
import { createDatabase } from '../src/configs/database.ts';
import { loadEnvironment } from '../src/configs/environment.ts';
import { createApplication } from '../src/configs/express.config.ts';
interface AuthResult {
  user: { id: string; email: string };
  cookie: string;
}

import { localDay } from '../src/utils/finance.ts';
interface Entity {
  id: string;
  version: number;
  [key: string]: unknown;
}
interface State {
  assets: Entity[];
  categories: Entity[];
  plans: Entity[];
  transactions: (Entity & { amount: string; allocations: { amount: string }[] })[];
  transfers: Entity[];
  adjustments: Entity[];
}
test(
  'real PostgreSQL API: isolation, auth, atomic CRUD, plans, transfers, reconciliation and statistics',
  { skip: process.env.RUN_DB_TESTS !== '1', timeout: 180000 },
  async () => {
    const database = createDatabase(
      { ...loadEnvironment(), DB_CONNECTION_TIMEOUT_MS: 30000 },
      { queryTimeoutMs: 30000 },
    );
    const server = createApplication({
      checkReadiness: async () => {
        await database.pool.query('select 1');
      },
      frontendBaseUrl: 'http://localhost:8081',
      database: database.db,
      environment: 'development',
      auth: {
        secret: 'test-only-secret-with-more-than-32-characters',
        baseURL: 'http://127.0.0.1:3000/api/auth',
        frontendBaseUrl: 'http://localhost:8081',
        production: false,
      },
    }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = 'http://127.0.0.1:' + address.port + '/api';
    const password = 'MoneyMate-isolated-test-123!';
    const accounts: AuthResult[] = [];
    async function request<T = Entity>(
      method: string,
      path: string,
      body?: unknown,
      token?: string,
      status = 200,
    ): Promise<T> {
      const response = await fetch(base + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:8081',
          ...(token ? { Cookie: token } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const value = response.status === 204 ? undefined : await response.json();
      if (path === '/auth/sign-up/email' || path === '/auth/sign-in/email') {
        if (value && response.ok)
          value.cookie = response.headers
            .getSetCookie()
            .map((cookie) => cookie.split(';')[0])
            .join('; ');
      }
      assert.equal(response.status, status, JSON.stringify(value));
      return value as T;
    }
    try {
      for (const displayName of ['Integration A', 'Integration B'])
        accounts.push(
          await request<AuthResult>(
            'POST',
            '/auth/sign-up/email',
            {
              name: displayName,
              email: 'moneymate-test-' + randomUUID() + '@example.invalid',
              password,
            },
            undefined,
            200,
          ),
        );
      const [a, b] = accounts;
      assert.ok(a && b);
      const token = a.cookie;
      assert.equal(
        (await request<{ user: { id: string } }>('GET', '/users/me', undefined, token)).user.id,
        a.user.id,
      );
      await request('GET', '/state', undefined, undefined, 401);
      await request(
        'POST',
        '/auth/sign-in/email',
        { email: a.user.email, password: 'wrong' },
        undefined,
        401,
      );
      const logged = await request<AuthResult>('POST', '/auth/sign-in/email', {
        email: a.user.email,
        password,
      });
      assert.equal(logged.user.id, a.user.id);
      const emptyProfile = await request<Record<string, unknown>>(
        'GET',
        '/users/me/profile',
        undefined,
        token,
      );
      assert.deepEqual(Object.keys(emptyProfile).sort(), [
        'avatarData',
        'dateOfBirth',
        'displayName',
        'gender',
      ]);
      const avatarData =
        'data:image/jpeg;base64,' +
        readFileSync(new URL('./fixtures/profile-avatar.jpg', import.meta.url)).toString('base64');
      const profileBody = {
        displayName: 'Updated personal profile',
        gender: 'female',
        dateOfBirth: '2000-02-29',
        avatarData,
      };
      const profile = await request<Record<string, unknown>>(
        'PUT',
        '/users/me/profile',
        profileBody,
        token,
      );
      assert.deepEqual(profile, profileBody);
      await request(
        'PUT',
        '/users/me/profile',
        { ...profileBody, dateOfBirth: '2001-02-29' },
        token,
        422,
      );
      await request('PUT', '/users/me/profile', { ...profileBody, userId: b.user.id }, token, 422);
      await request('GET', '/users/me/profile', undefined, undefined, 401);
      const otherProfile = await request<Record<string, unknown>>(
        'GET',
        '/users/me/profile',
        undefined,
        b.cookie,
      );
      assert.equal(otherProfile.displayName, 'Integration B');
      assert.equal(otherProfile.dateOfBirth, null);
      const authSession = await request<{ user: Record<string, unknown> }>(
        'GET',
        '/auth/get-session',
        undefined,
        token,
      );
      assert.equal(authSession.user.name, profileBody.displayName);
      assert.equal('avatarData' in authSession.user, false);
      const start = new Date(Date.now() - 86400000).toISOString();
      const occurredAt = new Date().toISOString();
      const cash = await request(
        'POST',
        '/assets',
        { name: 'Cash', type: 'cash', openingValue: '2000000', openingAt: start },
        token,
        201,
      );
      const bank = await request(
        'POST',
        '/assets',
        { name: 'Bank', type: 'bank', openingValue: '5000000', openingAt: start },
        token,
        201,
      );
      await request('GET', '/assets/' + cash.id, undefined, b.cookie, 404);
      const state = await request<State>('GET', '/state', undefined, token);
      const category = state.categories.find((c) => c.kind === 'expense')!;
      assert.ok(category);
      const txBody = {
        title: 'Lunch',
        kind: 'expense',
        categoryId: category.id,
        amount: '100000',
        occurredAt,
        allocations: [
          { assetAccountId: cash.id, amount: '40000' },
          { assetAccountId: bank.id, amount: '60000' },
        ],
      };
      await request('POST', '/transactions', { ...txBody, amount: '99999' }, token, 422);
      await request('POST', '/transactions', txBody, b.cookie, 422);
      assert.equal(
        (await request<State>('GET', '/state', undefined, token)).transactions.length,
        0,
      );
      const t = await request('POST', '/transactions', txBody, token, 201);
      await request(
        'PUT',
        '/transactions/' + t.id,
        { ...txBody, version: t.version },
        b.cookie,
        404,
      );
      const changed = await request(
        'PUT',
        '/transactions/' + t.id,
        { ...txBody, title: 'Updated lunch', version: t.version },
        token,
      );
      await request('PUT', '/transactions/' + t.id, { ...txBody, version: t.version }, token, 409);
      await request(
        'POST',
        '/plans',
        {
          categoryId: category.id,
          kind: 'expense',
          month: localDay(occurredAt, 'Asia/Ho_Chi_Minh').slice(0, 7) + '-01',
          plannedAmount: '0',
        },
        token,
        201,
      );
      const transfer = await request(
        'POST',
        '/transfers',
        { fromAssetAccountId: cash.id, toAssetAccountId: bank.id, amount: '200000', occurredAt },
        token,
        201,
      );
      const before = await request<State>('GET', '/state', undefined, token);
      const asset = before.assets.find((v) => v.id === cash.id)!;
      await request(
        'POST',
        '/assets/' + cash.id + '/reconcile',
        { version: asset.version, value: '1500000' },
        token,
      );
      const day = localDay(occurredAt, 'Asia/Ho_Chi_Minh');
      const report = await request<{
        series: { income: string; expense: string; assets: string }[];
        categories: { id: string; planned: string; actual: string; remaining: string }[];
      }>('GET', '/statistics?start=' + day + '&end=' + day + '&period=month', undefined, token);
      assert.equal(report.series[0].expense, '100000');
      assert.equal(report.series[0].income, '0');
      assert.equal(report.categories.find((c) => c.id === category.id)?.remaining, '-100000');
      assert.equal(report.series[0].assets, '6640000');
      await request(
        'DELETE',
        '/categories/' + category.id,
        { version: category.version },
        token,
        409,
      );

      const raceState = await request<State>('GET', '/state', undefined, token);
      const currentAsset = raceState.assets.find((v) => v.id === cash.id)!;
      const race = await Promise.all(
        ['1600000', '1700000'].map((value) =>
          fetch(base + '/assets/' + cash.id + '/reconcile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Origin: 'http://localhost:8081',
              Cookie: token,
            },
            body: JSON.stringify({ version: currentAsset.version, value }),
          }),
        ),
      );
      assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
      const currentTransfer = raceState.transfers.find((v) => v.id === transfer.id)!;
      await request(
        'PUT',
        '/transfers/' + transfer.id,
        {
          fromAssetAccountId: cash.id,
          toAssetAccountId: bank.id,
          amount: '200000',
          occurredAt,
          note: 'Updated transfer',
          version: currentTransfer.version,
        },
        token,
      );
      const currentAdjustment = raceState.adjustments[0];
      await request(
        'PUT',
        '/adjustments/' + currentAdjustment.id,
        {
          assetAccountId: cash.id,
          deltaAmount: currentAdjustment.deltaAmount,
          reason: 'reconciliation',
          note: 'Updated reconciliation note',
          occurredAt: currentAdjustment.occurredAt,
          version: currentAdjustment.version,
        },
        token,
      );

      // Every dedicated controller must preserve its list/detail HTTP contract.
      const controllerState = await request<State>('GET', '/state', undefined, token);
      for (const resource of [
        'assets',
        'categories',
        'plans',
        'transactions',
        'transfers',
        'adjustments',
      ] as const) {
        const rows = controllerState[resource];
        assert.ok(rows.length > 0, 'Expected populated ' + resource);
        const page = await request<{
          data: Entity[];
          pagination: { page: number; limit: number; total: number };
        }>('GET', '/' + resource + '?page=1&limit=1', undefined, token);
        assert.equal(page.pagination.page, 1);
        assert.equal(page.pagination.limit, 1);
        assert.equal(page.pagination.total, rows.length);
        assert.equal(page.data.length, 1);
        const detail = await request('GET', '/' + resource + '/' + rows[0].id, undefined, token);
        assert.equal(detail.id, rows[0].id);
        await request('GET', '/' + resource + '/' + rows[0].id, undefined, b.cookie, 404);
      }

      await request('DELETE', '/transactions/' + t.id, { version: changed.version }, token, 204);
      const after = await request<State>('GET', '/state', undefined, token);
      assert.equal(after.transactions.length, 0);
      const tr = after.transfers.find((v) => v.id === transfer.id)!;
      await request('DELETE', '/transfers/' + tr.id, { version: tr.version }, token, 204);
      await request('POST', '/auth/update-user', { name: 'Renamed integration' }, token);
      await request('POST', '/auth/sign-out', {}, logged.cookie);
      await request('GET', '/users/me', undefined, logged.cookie, 401);
      const csrf = await fetch(base + '/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://untrusted.example',
          Cookie: token,
        },
        body: JSON.stringify(txBody),
      });
      assert.equal(csrf.status, 403);
      const stored = await database.pool.query('select token from auth_sessions where user_id=$1', [
        a.user.id,
      ]);
      assert.ok(stored.rows.length > 0);
      const forgedCookie = 'moneymate.session_token=' + stored.rows[0].token;
      await request('GET', '/users/me', undefined, forgedCookie, 401);
    } finally {
      for (const account of accounts) {
        const response = await fetch(base + '/users/me', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:8081',
            Cookie: account.cookie,
          },
          body: JSON.stringify({ password }),
        });
        assert.equal(response.status, 204, 'Test account cleanup failed');
      }
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      );
      await database.pool.end();
    }
  },
);
