export interface TelegramStatus {
  enabled: boolean;
  link: {
    username: string | null;
    telegramUserId: string;
    displayName: string;
    linkedAt: string;
  } | null;
  request: {
    id: string;
    expiresAt: string;
    candidate: {
      telegramUserId: string;
      username: string | null;
      displayName: string | null;
    } | null;
  } | null;
}
