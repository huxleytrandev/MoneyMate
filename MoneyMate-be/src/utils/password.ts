import { scrypt, timingSafeEqual } from 'node:crypto';
import { hashPassword, verifyPassword as verifyBetterAuthPassword } from 'better-auth/crypto';
export { hashPassword };

// Migration compatibility only. New credentials always use Better Auth's hasher.
async function verifyLegacyPassword(password: string, hash: string) {
  const [, salt, encoded] = hash.split('$');
  if (!/^[0-9a-f]{64}$/.test(salt ?? '') || !/^[0-9a-f]{128}$/.test(encoded ?? '')) return false;
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
  return timingSafeEqual(derived, Buffer.from(encoded, 'hex'));
}
export async function verifyPassword(input: { password: string; hash: string }) {
  if (input.hash.startsWith('scrypt$')) return verifyLegacyPassword(input.password, input.hash);
  try {
    return await verifyBetterAuthPassword(input);
  } catch {
    return false;
  }
}
