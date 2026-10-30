import assert from 'node:assert/strict';
import { test } from 'node:test';
import { profileSchema } from '../src/schemas/profile.schema.ts';
const profile = {
  displayName: '  Người dùng  ',
  gender: null,
  dateOfBirth: null,
  avatarData: null,
};
test('profile validates calendar dates, private fields, name and avatar limits', () => {
  assert.equal(profileSchema.parse(profile).displayName, 'Người dùng');
  assert.equal(
    profileSchema.safeParse({ ...profile, dateOfBirth: '2000-02-29', gender: 'female' }).success,
    true,
  );
  for (const dateOfBirth of [
    '2001-02-29',
    '2026-02-30',
    '1800-01-01',
    '2999-01-01',
    '2000-01-01T00:00:00Z',
  ])
    assert.equal(profileSchema.safeParse({ ...profile, dateOfBirth }).success, false);
  for (const patch of [
    { gender: 'invalid' },
    { displayName: '  ' },
    { userId: 'another-user' },
    { email: 'injected@example.invalid' },
    { avatarData: 'file:///private/image.jpg' },
    { avatarData: 'data:image/jpeg;base64,' + 'A'.repeat(180000) },
  ])
    assert.equal(profileSchema.safeParse({ ...profile, ...patch }).success, false);
});
