import { sql } from 'drizzle-orm';
import type { DatabaseTransaction } from '../types/database.types.ts';
import { z } from 'zod';
import type { Database } from '../types/database.types.ts';
import type { TelegramIdentity, BotOperation } from '../types/telegram.types.ts';
import { telegramLinkRepository } from '../repositories/telegram-link.repository.ts';
import { telegramDraftRepository } from '../repositories/telegram-draft.repository.ts';
import { withUserWrite } from '../repositories/finance.repository.ts';
import { financeService } from './finance.service.ts';
import { profileService } from './profile.service.ts';
import { botOperationSchema } from '../schemas/telegram.schema.ts';
import { AppError } from '../utils/app-error.ts';
export function telegramActionService(
  database: Database,
  existingTransaction?: DatabaseTransaction,
) {
  async function confirm(identity: TelegramIdentity, actionId: string) {
    z.uuid().parse(actionId);
    const initial = await telegramLinkRepository(database).byTelegram(identity);
    if (!initial) throw new AppError(401, 'Liên kết đã bị hủy. Hãy liên kết lại trong MoneyMate.');
    const work = async (tx: DatabaseTransaction) => {
      const links = telegramLinkRepository(tx);
      const link = await links.byTelegram(identity);
      if (!link || link.id !== initial.id) throw new AppError(401, 'Liên kết đã thay đổi.');
      const drafts = telegramDraftRepository(tx);
      const action = await drafts.lockedAction(actionId, link.id);
      if (!action) throw new AppError(404, 'Không tìm thấy yêu cầu của bạn.');
      if (action.status === 'completed')
        return action.resultText ?? 'Yêu cầu đã được xử lý trước đó.';
      if (action.status !== 'pending' || action.expiresAt.getTime() < Date.now())
        throw new AppError(409, 'Yêu cầu đã hủy hoặc hết hạn. Hãy nhập lại.');
      const operation = botOperationSchema.parse(action.operation);
      const commands = financeService(database, tx);
      const financialResource = operation.resource === 'profile' ? null : operation.resource;
      async function execute(operation: BotOperation) {
        if (operation.action === 'unlink') {
          await links.revoke(link!.userId);
          return;
        }
        if (operation.action === 'profile') {
          await profileService(tx).updateProfile(link!.userId, operation.input);
          return;
        }
        if (!financialResource) throw new AppError(422, 'Đối tượng không hợp lệ.');
        const command = {
          userId: link!.userId,
          resource: financialResource,
          input: operation.input,
          recordId: operation.recordId ?? '',
        };
        const handlers = {
          create: () => commands.create(command),
          update: () => commands.update(command),
          remove: () => commands.remove(command),
          reconcile: () => commands.reconcile(link!.userId, command.recordId, operation.input),
        };
        await handlers[operation.action]();
      }
      await execute(operation);
      const text =
        operation.action === 'unlink'
          ? 'Đã hủy liên kết Telegram. Dữ liệu MoneyMate vẫn được giữ.'
          : 'Đã lưu thành công vào MoneyMate. Số dư và thống kê được tính từ dữ liệu thật.';
      if (operation.action !== 'unlink') {
        await drafts.complete(action.id, text);
        await drafts.forget(link.id);
      }
      return text;
    };
    if (!existingTransaction) return withUserWrite(database, initial.userId, work);
    await existingTransaction.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${initial.userId},0))`,
    );
    return work(existingTransaction);
  }
  return { confirm };
}
