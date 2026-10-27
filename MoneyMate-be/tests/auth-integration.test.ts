import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID, randomBytes, scryptSync } from 'node:crypto';
import { once } from 'node:events';
import { createAuthClient } from 'better-auth/client';
import { createDatabase } from '../src/configs/database.ts';
import { loadEnvironment } from '../src/configs/environment.ts';
import { createApplication } from '../src/configs/express.config.ts';
import { repositories, withUserWrite } from '../src/repositories/finance.repository.ts';
import { userRepository } from '../src/repositories/user.repository.ts';

function cookieTransport(baseURL: string) {
  const cookies = new Map<string, string>();
  const fetchWithCookies: typeof fetch = async (input, options) => {
    const headers = new Headers(options?.headers);
    headers.set('Origin', 'http://localhost:8081');
    headers.set('Cookie', [...cookies].map(([name, value]) => name + '=' + value).join('; '));
    const response = await fetch(input, { ...options, headers });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';')[0];
      const separator = pair.indexOf('=');
      cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
    return response;
  };
  return {
    cookieHeader: () => [...cookies].map(([name, value]) => name + '=' + value).join('; '),
    client: createAuthClient({
      baseURL: baseURL + '/api/auth',
      fetchOptions: { customFetchImpl: fetchWithCookies },
    }),
    request: (path: string, options?: RequestInit) => fetchWithCookies(baseURL + path, options),
  };
}
test(
  'Better Auth SDK: legacy upgrade, profile, password revocation, native cookie and atomic deletion',
  {
    skip: process.env.RUN_DB_TESTS !== '1',
    timeout: 180000,
  },
  async () => {
    const database = createDatabase(
      { ...loadEnvironment(), DB_CONNECTION_TIMEOUT_MS: 30000 },
      { queryTimeoutMs: 30000 },
    );
    const server = createApplication({
      checkReadiness: async () => {},
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
    const base = 'http://127.0.0.1:' + address.port;
    const first = cookieTransport(base),
      second = cookieTransport(base);
    const password = '  Better-Auth-test-123!  ';
    const newPassword = 'Better-Auth-new-test-456!';
    const email = 'moneymate-auth-test-' + randomUUID() + '@example.invalid';
    const changedEmail = 'moneymate-auth-test-' + randomUUID() + '@example.invalid';
    let userId: string | undefined;
    try {
      const registered = await first.client.signUp.email({
        email,
        password,
        name: '  Test Better Auth  ',
      });
      assert.equal(registered.error, null);
      assert.ok(registered.data);
      userId = registered.data.user.id;
      assert.equal(registered.data.user.name, 'Test Better Auth');
      assert.equal('legacyPasswordHash' in registered.data.user, false);
      const snapshotResponse = await first.request('/api/state');
      assert.equal(snapshotResponse.status, 200);
      assert.equal((await snapshotResponse.json()).categories.length, 6);

      const salt = randomBytes(32).toString('hex');
      const derived = scryptSync(password, salt, 64, {
        N: 16384,
        r: 8,
        p: 1,
        maxmem: 64 * 1024 * 1024,
      });
      const legacyHash = 'scrypt$' + salt + '$' + derived.toString('hex');
      await database.pool.query(
        'update auth_accounts set password=$1 where user_id=$2 and provider_id=$3',
        [legacyHash, userId, 'credential'],
      );
      const legacyLogin = await second.client.signIn.email({ email, password });
      assert.equal(legacyLogin.error, null);
      const upgraded = await userRepository(database.db).credential(userId);
      assert.ok(upgraded?.password && !upgraded.password.startsWith('scrypt$'));

      const native = await fetch(base + '/api/state', {
        headers: { Cookie: second.cookieHeader(), Origin: 'moneymate://' },
      });
      assert.equal(native.status, 200);
      const rename = await first.client.updateUser({ name: 'Updated SDK Name' });
      assert.equal(rename.error, null);
      const session = await first.client.getSession({ query: { disableCookieCache: true } });
      assert.equal(session.data?.user.name, 'Updated SDK Name');
      const changed = await first.client.changePassword({
        currentPassword: password,
        newPassword,
        revokeOtherSessions: true,
      });
      assert.equal(changed.error, null);
      assert.equal((await second.request('/api/state')).status, 401);
      const verified = await first.request('/api/users/me/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      assert.equal(verified.status, 200);
      const wrongPassword = await first.request('/api/users/me/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      assert.equal(wrongPassword.status, 400);

      const emailChange = await first.client.changeEmail({ newEmail: changedEmail });
      assert.equal(emailChange.error, null);
      const changedSession = await first.client.getSession({ query: { disableCookieCache: true } });
      assert.equal(changedSession.data?.user.email, changedEmail);
      assert.equal(
        (await second.client.signIn.email({ email: changedEmail, password: newPassword })).error,
        null,
      );

      const cookies = await second.request('/api/users/me');
      assert.equal(cookies.status, 200);
      const clientSession = await userRepository(database.db).byId(userId);
      assert.ok(clientSession);

      const blocked = await fetch(base + '/api/auth/update-user', {
        method: 'POST',
        headers: {
          Origin: 'https://untrusted.example',
          Cookie: first.cookieHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Must not apply' }),
      });
      assert.equal(blocked.status, 403);
      const deleted = await first.request('/api/users/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      assert.equal(deleted.status, 204);
      assert.ok(deleted.headers.getSetCookie().some((cookie) => cookie.includes('Max-Age=0')));
      assert.equal(await userRepository(database.db).byId(userId), undefined);
      assert.equal((await second.request('/api/state')).status, 401);
    } finally {
      if (userId)
        await withUserWrite(database.db, userId, async (transaction) => {
          const finance = repositories(transaction);
          await finance.allocations.removeAll(userId!);
          await finance.transactions.removeAll(userId!);
          await finance.plans.removeAll(userId!);
          await finance.transfers.removeAll(userId!);
          await finance.adjustments.removeAll(userId!);
          await finance.categories.removeAll(userId!);
          await finance.assets.removeAll(userId!);
          await userRepository(transaction).remove(userId!);
        });
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((failure) => (failure ? reject(failure) : resolve())),
      );
      await database.pool.end();
    }
  },
);
