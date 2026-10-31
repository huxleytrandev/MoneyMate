import { AppError } from '../utils/app-error.ts';
import type { BotIntent, TelegramSettings } from '../types/telegram.types.ts';
import { botIntentSchema } from '../schemas/telegram.schema.ts';
export function aiIntentService(settings: TelegramSettings) {
  async function interpret(text: string, today: string, timezone: string): Promise<BotIntent> {
    try {
      const response = await fetch(settings.aiUrl + '/interpret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.aiToken ? { Authorization: 'Bearer ' + settings.aiToken } : {}),
        },
        body: JSON.stringify({ text, today, timezone }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new AppError(503, 'AI temporarily unavailable');
      return botIntentSchema.parse(await response.json());
    } catch {
      throw new AppError(
        422,
        'Dịch vụ hiểu tiếng Việt chưa sẵn sàng. Hãy chạy MoneyMate-ai hoặc dùng các nút menu để tiếp tục.',
      );
    }
  }
  return { interpret };
}
