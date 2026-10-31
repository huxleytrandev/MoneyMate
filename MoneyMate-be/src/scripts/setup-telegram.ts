import { loadEnvironment } from '../configs/environment.ts';
import { telegramSettings } from '../configs/telegram.config.ts';
import { telegramApi } from '../services/telegram-api.service.ts';
loadEnvironment();
async function main() {
  const settings = telegramSettings();
  const api = telegramApi(settings);
  await api.getMe();
  await api.call('setMyCommands', {
    commands: [
      { command: 'menu', description: 'Mở menu MoneyMate' },
      { command: 'balance', description: 'Xem số dư tài sản' },
      { command: 'transactions', description: 'Danh sách giao dịch' },
      { command: 'assets', description: 'Quản lý tài sản' },
      { command: 'categories', description: 'Quản lý danh mục' },
      { command: 'plans', description: 'Kế hoạch tháng' },
      { command: 'transfers', description: 'Chuyển nội bộ' },
      { command: 'adjustments', description: 'Điều chỉnh tài sản' },
      { command: 'profile', description: 'Thông tin cá nhân' },
      { command: 'report', description: 'Báo cáo tháng' },
      { command: 'cancel', description: 'Hủy yêu cầu chưa thực hiện' },
      { command: 'unlink', description: 'Ngắt liên kết tài khoản' },
    ],
  });
  if (settings.mode === 'webhook') {
    await api.call('setWebhook', {
      url: settings.publicUrl!.replace(/\/$/, '') + '/api/telegram/webhook',
      secret_token: settings.webhookSecret,
      allowed_updates: ['message', 'callback_query'],
    });
  }
  console.log(
    'Telegram command menu configured.' +
      (settings.mode === 'webhook'
        ? ' HTTPS webhook configured.'
        : ' Polling mode: no webhook was changed.'),
  );
}
void main().catch(() => {
  console.error('Telegram setup failed. Check configuration; credentials are not logged.');
  process.exitCode = 1;
});
