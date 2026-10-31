import { sql } from 'drizzle-orm';
import { telegramCommand } from '../utils/telegram-command.ts';
import { z } from 'zod';
import type { Database, DatabaseTransaction } from '../types/database.types.ts';
import type {
  BotIntent,
  TelegramSettings,
  TelegramUpdate,
  TelegramReply,
  TelegramOutgoing,
} from '../types/telegram.types.ts';
import { telegramContext } from '../middlewares/telegram-auth.middleware.ts';
import { telegramLinkRepository } from '../repositories/telegram-link.repository.ts';
import { telegramDraftRepository } from '../repositories/telegram-draft.repository.ts';
import { userRepository } from '../repositories/user.repository.ts';
import { authTelegramService } from './auth-telegram.service.ts';
import { telegramActionService } from './telegram-action.service.ts';
import { telegramFormService } from './telegram-form.service.ts';
import { telegramReadService } from './telegram-read.service.ts';
import { aiIntentService } from './ai-intent.service.ts';
import { telegramApi } from './telegram-api.service.ts';
import { localDay } from '../utils/finance.ts';
import { AppError } from '../utils/app-error.ts';
import { TELEGRAM_MENU } from '../constants/telegram.constant.ts';
import { TELEGRAM } from '../constants/telegram.constant.ts';
const help: TelegramReply = {
  text: 'MoneyMate Telegram\nVí dụ: “ăn trưa 50k tiền mặt”, “nhận lương 15 triệu vào VCB”, “đặt ngân sách Ăn uống tháng sau 2 triệu”, “xem số dư”, “báo cáo tháng này”.\nBot sẽ hỏi thông tin chưa rõ và chỉ ghi dữ liệu sau Xác nhận. /cancel hủy yêu cầu. /menu mở menu. Không gửi mật khẩu vào chat.',
  buttons: TELEGRAM_MENU,
};
const security: TelegramReply = {
  text: 'Mở MoneyMate → Hồ sơ → Tài khoản và bảo mật để đổi email, mật khẩu, đăng xuất hoặc xóa tài khoản với xác thực lại. Không gửi mật khẩu/mã đăng nhập cho bot.',
};
export function telegramEngine(database: Database, settings: TelegramSettings, botId: string) {
  const auth = authTelegramService(database, settings),
    reads = telegramReadService(database),
    ai = aiIntentService(settings),
    api = telegramApi(settings);
  async function handle(
    update: TelegramUpdate,
    transaction: DatabaseTransaction,
  ): Promise<TelegramOutgoing[]> {
    const context = telegramContext(update, botId);
    if (!context) return [];
    const { identity, text, callback, sourceKey } = context;
    const links = telegramLinkRepository(transaction),
      drafts = telegramDraftRepository(transaction),
      forms = telegramFormService(database, transaction);
    const answers: TelegramOutgoing[] = update.callback_query
      ? [{ method: 'answerCallbackQuery', body: { callback_query_id: update.callback_query.id } }]
      : [];
    let link = await links.byTelegram(identity);
    if (link) {
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${link.userId},0))`,
      );
      link = await links.byTelegram(identity);
    }
    async function respond(reply: TelegramReply, guard = true) {
      answers.push({
        method: 'sendMessage',
        ...(guard && link ? { guardLinkId: link.id } : {}),
        body: {
          chat_id: identity.chatId,
          text: reply.text.slice(0, 3900),
          ...(reply.buttons?.length ? { reply_markup: { inline_keyboard: reply.buttons } } : {}),
          link_preview_options: { is_disabled: true },
        },
      });
      return answers;
    }
    try {
      if (/^\/start(?:_digest)?\s+/.test(text)) {
        const token = text.split(/\s+/)[1];
        const claimed = text.startsWith('/start_digest ')
          ? await auth.claimDigest(token, identity, transaction)
          : await auth.claim(token, identity, transaction);
        return respond(
          {
            text: claimed
              ? 'Đã nhận yêu cầu. Quay lại trang Hồ sơ MoneyMate, kiểm tra đúng danh tính Telegram rồi bấm Xác nhận liên kết. Chưa cấp quyền truy cập dữ liệu.'
              : 'Mã liên kết không hợp lệ, đã dùng hoặc hết hạn. Hãy tạo lại từ Hồ sơ MoneyMate.',
          },
          false,
        );
      }
      if (!link)
        return respond(
          {
            text: 'Bạn chưa liên kết tài khoản. Mở MoneyMate → Hồ sơ → Telegram → Kết nối Telegram, sau đó quay lại app xác nhận danh tính. Bot không yêu cầu mật khẩu.',
          },
          false,
        );
      if ((await drafts.recent(botId, identity.telegramUserId)) > 30)
        return respond({ text: 'Bạn đang gửi quá nhanh. Hãy chờ một phút rồi thử lại.' });
      const account = await userRepository(transaction).chatUser(link.userId);
      if (!account) return [];
      const user = { id: link.userId, timezone: account.timezone };
      if (callback?.startsWith('confirm:')) {
        const result = await telegramActionService(database, transaction).confirm(
          identity,
          callback.slice(8),
        );
        link = await links.byTelegram(identity);
        return respond({ text: result }, !!link);
      }
      if (callback === 'cancel' || /^\/(cancel|huy)$|^hủy$|^huy$/i.test(text)) {
        await drafts.forget(link.id);
        await drafts.cancel(link.id);
        return respond({ text: 'Đã hủy yêu cầu chưa thực hiện. Dữ liệu đã lưu không thay đổi.' });
      }
      if (callback === 'security') return respond(security);
      if (update.message?.photo?.length) {
        const photos = update.message.photo
          .filter((photo) => (photo.file_size ?? 0) <= 131072)
          .sort((first, second) => second.width - first.width);
        if (!photos.length) throw new AppError(422, 'Ảnh quá lớn. Gửi JPEG nhỏ hơn 128 KB.');
        const avatarData = await api.photo(photos[0].file_id);
        return respond(
          await forms.prepare(
            link,
            user,
            { action: 'update', resource: 'profile', fields: { avatarData, _edited: 'true' } },
            sourceKey,
          ),
        );
      }
      const interrupt =
        /^\/(menu|help|start|unlink|new|edit|delete|report|transactions|assets|categories|plans|transfers|adjustments|profile|balance)\b/.test(
          text,
        );
      if (!interrupt) {
        const continued = await forms.consume(link, user, text, callback, sourceKey);
        if (continued) return respond(continued);
      }
      if (interrupt || (callback && !/^(pick|value|field):/.test(callback))) {
        await drafts.forget(link.id);
        await drafts.cancel(link.id);
      }
      if (!text && !callback)
        return respond({
          text: 'Hiện hỗ trợ tin nhắn chữ và ảnh đại diện JPEG. Dùng /menu để xem các thao tác.',
        });
      let intent: BotIntent;
      if (callback) {
        const [action, resource, reference, month, kind] = callback.split(':');
        if (![...TELEGRAM.resources, 'profile', 'balance'].includes(resource)) return respond(help);
        if (action === 'view')
          return respond(
            resource === 'profile'
              ? await reads.profile(user)
              : await reads.detail(
                  user,
                  resource as (typeof TELEGRAM.resources)[number],
                  reference,
                ),
          );
        if (action === 'page')
          return respond(
            await reads.list(
              user,
              {
                action: 'list',
                resource: resource as BotIntent['resource'],
                fields: { ...(month ? { month } : {}), ...(kind ? { kind } : {}) },
              },
              Math.min(2500, Math.max(1, Number(reference) || 1)),
            ),
          );
        if (
          ![
            'list',
            'show',
            'create',
            'update',
            'remove',
            'archive',
            'restore',
            'reconcile',
            'report',
          ].includes(action)
        )
          return respond(help);
        intent = {
          action: action as BotIntent['action'],
          resource: resource as BotIntent['resource'],
          fields: {},
          ...(reference ? { reference } : {}),
        };
      } else if (/^\/(menu|help|start)$/.test(text)) return respond(help);
      else if (text === '/unlink') intent = { action: 'unlink', resource: 'profile', fields: {} };
      else
        intent =
          telegramCommand(text) ??
          (await ai.interpret(
            text,
            localDay(new Date().toISOString(), user.timezone),
            user.timezone,
          ));
      // Only the interpreter proposes data; it cannot provide IDs, permissions, versions or internal conversation state.
      intent.fields = Object.fromEntries(
        Object.entries(intent.fields).filter(
          ([key]) =>
            !key.startsWith('_') && !['userId', 'version', 'id', 'avatarData'].includes(key),
        ),
      );
      if (intent.action === 'help') return respond(help);
      if (intent.action === 'security') return respond(security);
      if (intent.action === 'cancel') {
        await drafts.forget(link.id);
        await drafts.cancel(link.id);
        return respond({ text: 'Đã hủy.' });
      }
      if (intent.action === 'report') return respond(await reads.report(user, intent.fields));
      if (intent.action === 'list') return respond(await reads.list(user, intent));
      if (intent.action === 'show' && intent.resource === 'profile')
        return respond(await reads.profile(user));
      if (
        intent.action === 'show' &&
        intent.reference &&
        intent.resource !== 'balance' &&
        intent.resource !== 'profile'
      )
        return respond(await reads.detail(user, intent.resource, intent.reference));
      return respond(await forms.prepare(link, user, intent, sourceKey));
    } catch (error) {
      if (error instanceof AppError) return respond({ text: error.message });
      if (error instanceof z.ZodError)
        return respond({
          text:
            'Thông tin chưa hợp lệ: ' +
            error.issues[0].path.join('.') +
            ' — ' +
            error.issues[0].message +
            '\nSửa dữ liệu đang nhập hoặc /cancel để bắt đầu lại.',
        });
      throw error;
    }
  }
  return { handle };
}
