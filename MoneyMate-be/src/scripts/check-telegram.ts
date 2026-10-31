import { loadEnvironment } from '../configs/environment.ts';
import { telegramSettings } from '../configs/telegram.config.ts';
import { telegramApi } from '../services/telegram-api.service.ts';
loadEnvironment();
async function main() {
  const settings = telegramSettings();
  const api = telegramApi(settings);
  const bot = await api.getMe();
  const webhook = await api.call<{ url: string; pending_update_count?: number }>('getWebhookInfo');
  console.log(
    JSON.stringify({
      bot: '@' + bot.username,
      botId: bot.id,
      mode: settings.mode,
      hasWebhook: !!webhook.url,
      pendingUpdates: webhook.pending_update_count ?? 0,
    }),
  );
}
void main().catch(() => {
  console.error('Cannot verify Telegram bot. Check token and network. Credentials are not logged.');
  process.exitCode = 1;
});
