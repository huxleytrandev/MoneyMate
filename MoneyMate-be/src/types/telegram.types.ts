import type { ResourceName } from '../schemas/api.schema.ts';
export interface TelegramIdentity {
  botId: string;
  telegramUserId: string;
  chatId: string;
  username: string | null;
  displayName: string;
}
export interface TelegramSettings {
  token?: string;
  mode: 'polling' | 'webhook' | 'disabled';
  webhookSecret?: string;
  publicUrl?: string;
  aiUrl: string;
  aiToken?: string;
}
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot?: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: { id: number; type: string };
    text?: string;
    photo?: { file_id: string; file_size?: number; width: number; height: number }[];
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot?: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    data?: string;
    message?: { message_id: number; chat: { id: number; type: string } };
  };
}
export interface BotIntent {
  action:
    | 'help'
    | 'list'
    | 'show'
    | 'create'
    | 'update'
    | 'remove'
    | 'reconcile'
    | 'archive'
    | 'restore'
    | 'report'
    | 'cancel'
    | 'unlink'
    | 'security';
  resource: ResourceName | 'profile' | 'balance';
  fields: Record<string, string>;
  reference?: string;
}
export interface BotOperation {
  action: 'create' | 'update' | 'remove' | 'reconcile' | 'profile' | 'unlink';
  resource: ResourceName | 'profile';
  summary?: string;
  recordId?: string;
  input: Record<string, unknown>;
}
export interface TelegramButton {
  text: string;
  callback_data?: string;
  url?: string;
}
export interface TelegramReply {
  text: string;
  buttons?: TelegramButton[][];
}
export interface TelegramOutgoing {
  method: 'sendMessage' | 'answerCallbackQuery';
  body: Record<string, unknown>;
  guardLinkId?: string;
}
export interface TelegramContext {
  identity: TelegramIdentity;
  update: TelegramUpdate;
  text: string;
  callback?: string;
  sourceKey: string;
}
