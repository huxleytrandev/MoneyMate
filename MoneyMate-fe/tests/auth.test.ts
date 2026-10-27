import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapAuthUser, requireAuthData } from '../src/helpers/auth.ts';
import { ApiError } from '../src/helpers/api-error.ts';

test('Better Auth user mapping preserves profile and serializes dates without storing a token', () => {
  const user = mapAuthUser({
    id: 'user',
    name: 'MoneyMate User',
    email: 'user@example.invalid',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: '2026-01-02T00:00:00Z',
  });
  assert.equal(user.displayName, 'MoneyMate User');
  assert.equal(user.timezone, 'Asia/Ho_Chi_Minh');
  assert.equal(user.createdAt, '2026-01-01T00:00:00.000Z');
  assert.equal('token' in user, false);
});
test('Better Auth client errors preserve status and reject missing success data', () => {
  assert.throws(
    () => requireAuthData({ data: null, error: { status: 401, message: 'Invalid credentials' } }),
    (failure) => failure instanceof ApiError && failure.status === 401,
  );
  assert.throws(() => requireAuthData({ data: null, error: null }), ApiError);
  assert.deepEqual(requireAuthData({ data: { success: true }, error: null }), { success: true });
});
