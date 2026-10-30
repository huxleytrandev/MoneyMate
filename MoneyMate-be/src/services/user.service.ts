import { profileSchema } from '../schemas/profile.schema.ts';
import { requireRecord } from '../utils/finance-validation.ts';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import { repositories, withUserWrite } from '../repositories/finance.repository.ts';
import { userRepository } from '../repositories/user.repository.ts';
import { AuthAccountModel } from '../models/index.ts';
import { eq } from 'drizzle-orm';
import { deleteUserSchema } from '../schemas/user.schema.ts';
import type { Database, DatabaseTransaction } from '../types/database.types.ts';
import type { Authentication } from '../types/auth.types.ts';

async function removeFinancialData(transaction: DatabaseTransaction, userId: string) {
  const finance = repositories(transaction);
  await finance.allocations.removeAll(userId);
  await finance.transactions.removeAll(userId);
  await finance.plans.removeAll(userId);
  await finance.transfers.removeAll(userId);
  await finance.adjustments.removeAll(userId);
  await finance.categories.removeAll(userId);
  await finance.assets.removeAll(userId);
}
export function userService(database: Database, auth: Authentication) {
  async function remove(input: { userId: string; body: unknown; headers: IncomingHttpHeaders }) {
    const { password } = deleteUserSchema.parse(input.body);
    const headers = fromNodeHeaders(input.headers);
    await withUserWrite(database, input.userId, async (transaction) => {
      await transaction
        .select()
        .from(AuthAccountModel)
        .where(eq(AuthAccountModel.userId, input.userId))
        .for('update');
      await auth.api.verifyPassword({ headers, body: { password } });
      await removeFinancialData(transaction, input.userId);
      await userRepository(transaction).remove(input.userId);
    });
    return auth.api.signOut({ headers, asResponse: true });
  }
  async function verifyPassword(input: { body: unknown; headers: IncomingHttpHeaders }) {
    const { password } = deleteUserSchema.parse(input.body);
    return auth.api.verifyPassword({ headers: fromNodeHeaders(input.headers), body: { password } });
  }
  const users = userRepository(database);
  async function profile(userId: string) {
    return requireRecord(await users.profile(userId));
  }
  async function updateProfile(userId: string, body: unknown) {
    return requireRecord(await users.updateProfile(userId, profileSchema.parse(body)));
  }
  return { remove, verifyPassword, profile, updateProfile };
}
