import type { BotIntent } from '../types/telegram.types.ts';
import { TELEGRAM } from '../constants/telegram.constant.ts';
export function telegramCommand(text: string): BotIntent | null {
  const command = text.match(/^\/(\w+)(?:@\w+)?(?:\s+(.*))?$/);
  if (!command) return null;
  const name = command[1];
  const fields: Record<string, string> = {};
  const month = command[2]?.match(/\b(\d{4}-(?:0[1-9]|1[0-2]))\b/);
  if (month) fields.month = month[1];
  const resources = [...TELEGRAM.resources, 'profile', 'balance'] as const;
  const resource = resources.find((value) => value === name);
  if (resource) return { action: resource === 'profile' ? 'show' : 'list', resource, fields };
  if (name === 'report') return { action: 'report', resource: 'balance', fields };
  if (['new', 'edit', 'delete', 'show'].includes(name)) {
    const [target, reference] = command[2]?.split(/\s+/) ?? [];
    const resource = resources.find((value) => value === target);
    if (!resource) return null;
    const actions: Record<string, BotIntent['action']> = {
      new: 'create',
      edit: 'update',
      delete: 'remove',
      show: 'show',
    };
    return { action: actions[name], resource, fields, ...(reference ? { reference } : {}) };
  }
  return null;
}
