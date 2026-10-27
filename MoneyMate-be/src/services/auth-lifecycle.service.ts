import { hashPassword } from 'better-auth/crypto';
import { DEFAULT_CATEGORIES } from '../constants/user.constant.ts';
import { repositories, withUserWrite } from '../repositories/finance.repository.ts';
import { userRepository } from '../repositories/user.repository.ts';
import type { Database } from '../types/database.types.ts';

export function authLifecycleService(database: Database) {
  async function seedCategories(userId: string) {
    await withUserWrite(database, userId, async (transaction) => {
      const finance = repositories(transaction);
      if ((await finance.categories.list(userId)).length) return;
      for (const category of DEFAULT_CATEGORIES) await finance.categories.create(userId, category);
    });
  }
  async function upgradeLegacyPassword(userId: string, password: string) {
    const users = userRepository(database);
    const account = await users.credential(userId);
    if (!account?.password?.startsWith('scrypt$')) return;
    await users.upgradePassword({
      userId,
      previousHash: account.password,
      password: await hashPassword(password),
    });
  }
  return { seedCategories, upgradeLegacyPassword };
}
