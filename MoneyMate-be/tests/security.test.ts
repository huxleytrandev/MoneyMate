import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scryptSync, randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword } from '../src/utils/password.ts';
import { jsonSafe } from '../src/utils/serialize.ts';
import { loginValidation } from '../src/validations/auth.validation.ts';
import { secretSchema } from '../src/schemas/secret.schema.ts';

const testSecret = 'test-only-secret-with-more-than-32-characters';
test('Better Auth hashes passwords independently and rejects incorrect or malformed credentials', async () => {
  const password = '  a-long-test-password  ';
  const firstHash = await hashPassword(password);
  const secondHash = await hashPassword(password);
  assert.notEqual(firstHash, secondHash);
  assert.equal(await verifyPassword({ password, hash: firstHash }), true);
  assert.equal(await verifyPassword({ password: password.trim(), hash: firstHash }), false);
  assert.equal(await verifyPassword({ password: 'wrong', hash: firstHash }), false);
  assert.equal(await verifyPassword({ password, hash: 'bad' }), false);
});
test('legacy credentials remain valid during Better Auth migration', async () => {
  const password = '  legacy-password-123!  ';
  const salt = randomBytes(32).toString('hex');
  const derived = scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  const hash = 'scrypt$' + salt + '$' + derived.toString('hex');
  assert.equal(await verifyPassword({ password, hash }), true);
  assert.equal(await verifyPassword({ password: password.trim(), hash }), false);
});
test('API serialization preserves money and login never trims passwords', () => {
  assert.deepEqual(jsonSafe({ amount: 9007199254740993n }), { amount: '9007199254740993' });
  const login = loginValidation.parse({ email: ' A@EXAMPLE.COM ', password: '  test  ' });
  assert.equal(login.email, 'a@example.com');
  assert.equal(login.password, '  test  ');
});
test('Better Auth configuration requires a secret and HTTPS in production', () => {
  const base = {
    DATABASE_URL: 'postgresql://local:local@localhost/test',
    BETTER_AUTH_SECRET: testSecret,
  };
  assert.equal(secretSchema.safeParse({ DATABASE_URL: base.DATABASE_URL }).success, false);
  assert.equal(secretSchema.safeParse({ ...base, BETTER_AUTH_SECRET: 'weak' }).success, false);
  assert.equal(secretSchema.safeParse({ ...base, NODE_ENV: 'production' }).success, false);
  assert.equal(
    secretSchema.safeParse({
      ...base,
      NODE_ENV: 'production',
      BETTER_AUTH_URL: 'https://api.example.com/api/auth',
    }).success,
    true,
  );
  for (const url of ['http://localhost:8081', 'http://127.0.0.1:8082', 'http://192.168.1.2:8081'])
    assert.equal(secretSchema.parse({ ...base, FRONTEND_BASE_URL: url }).FRONTEND_BASE_URL, url);
  assert.equal(
    secretSchema.safeParse({ ...base, FRONTEND_BASE_URL: 'javascript:alert(1)' }).success,
    false,
  );
});
