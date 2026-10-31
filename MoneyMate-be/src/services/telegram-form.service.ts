import { telegramPayload } from '../utils/telegram-payload.ts';
import { AppError } from '../utils/app-error.ts';
import { randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Executor, Database } from '../types/database.types.ts';
import type { BotIntent, BotOperation, TelegramReply } from '../types/telegram.types.ts';
import type { ReadUser } from '../types/finance-read.types.ts';
import { TelegramLinkModel } from '../models/telegram.model.ts';
import {
  BOT_FIELDS,
  BOT_EDIT_FIELDS,
  BOT_FIELD_LABELS,
} from '../constants/telegram-fields.constant.ts';
import { telegramDraftRepository } from '../repositories/telegram-draft.repository.ts';
import { telegramEntityRepository } from '../repositories/telegram-entity.repository.ts';
import { financeReadService } from './finance-read.service.ts';
import { profileService } from './profile.service.ts';
import { createSchemas, reconcileSchema } from '../schemas/api.schema.ts';
import { profileSchema } from '../schemas/profile.schema.ts';
import { fieldValue, botTimestamp, normalizeBotText } from '../utils/telegram-input.ts';
import { localDay } from '../utils/finance.ts';
import { recordSummary, operationPreview } from '../utils/telegram-format.ts';
type Link = typeof TelegramLinkModel.$inferSelect;
const parents: Record<string, 'assets' | 'categories'> = {
  categoryId: 'categories',
  assetAccountId: 'assets',
  fromAssetAccountId: 'assets',
  toAssetAccountId: 'assets',
};
const hints: Record<string, string> = {
  categoryId: 'category',
  assetAccountId: 'asset',
  fromAssetAccountId: 'from',
  toAssetAccountId: 'to',
};
export function telegramFormService(database: Database, executor: Executor = database) {
  const drafts = telegramDraftRepository(executor),
    entities = telegramEntityRepository(executor),
    queries = financeReadService(database);
  async function ask(
    link: Link,
    intent: BotIntent,
    key: string,
    choices?: { id: string; label: string }[],
    prompt?: string,
  ): Promise<TelegramReply> {
    intent.fields._flowId ??= randomBytes(5).toString('hex');
    await drafts.remember(link.id, intent, key);
    const options = choices?.map((choice) => [
      {
        text: choice.label.slice(0, 60),
        callback_data: 'pick:' + intent.fields._flowId + ':' + choice.id,
      },
    ]);
    const enumerations: Record<string, { id: string; label: string }[]> = {
      kind: [
        { id: 'expense', label: 'Chi tiêu' },
        { id: 'income', label: 'Thu nhập' },
      ],
      type: [
        { id: 'cash', label: 'Tiền mặt' },
        { id: 'bank', label: 'Ngân hàng' },
        { id: 'other', label: 'Khác' },
      ],
      gender: [
        { id: 'male', label: 'Nam' },
        { id: 'female', label: 'Nữ' },
        { id: 'other', label: 'Khác' },
        { id: 'undisclosed', label: 'Không chia sẻ' },
      ],
    };
    if (key === 'assetAccountId' && intent.resource === 'transactions')
      options?.push([
        { text: 'Phân bổ nhiều nguồn', callback_data: 'pick:' + intent.fields._flowId + ':split' },
      ]);
    const buttons =
      options ??
      enumerations[key]?.map((choice) => [
        { text: choice.label, callback_data: 'value:' + intent.fields._flowId + ':' + choice.id },
      ]);
    return {
      text:
        (prompt ?? 'Vui lòng nhập/chọn ' + (BOT_FIELD_LABELS[key] ?? key) + '.') +
        '\nGõ /cancel để hủy.',
      buttons,
    };
  }
  async function pickParent(
    link: Link,
    intent: BotIntent,
    key: string,
  ): Promise<TelegramReply | null> {
    if (intent.fields[key]) return null;
    let search = intent.fields[hints[key]];
    const aliases: Record<string, string> = {
      vcb: 'vietcombank',
      tcb: 'techcombank',
      mbbank: 'mb',
      'mb bank': 'mb',
    };
    if (search) search = aliases[normalizeBotText(search)] ?? search;
    const cash = search && ['tien mat', 'cash'].includes(normalizeBotText(search));
    const result = await entities.choices({
      userId: link.userId,
      resource: parents[key],
      search: cash ? undefined : search,
      assetType: cash ? 'cash' : undefined,
      active: true,
      kind: parents[key] === 'categories' ? intent.fields.kind : undefined,
    });
    const choices = cash ? result.data.filter((record) => record.type === 'cash') : result.data;
    if (choices.length === 1 && !result.hasMore) {
      intent.fields[key] = choices[0].id;
      intent.fields['_label_' + key] = String(choices[0].name);
      return null;
    }
    if (!choices.length && search) {
      delete intent.fields[hints[key]];
      return pickParent(link, intent, key);
    }
    return ask(
      link,
      intent,
      key,
      choices.map((record) => ({ id: record.id, label: recordSummary(record) })),
      choices.length
        ? 'Chọn ' +
            BOT_FIELD_LABELS[key] +
            (result.hasMore ? ' (hoặc nhập tên để tìm chính xác)' : '')
        : 'Chưa có ' + BOT_FIELD_LABELS[key] + '. Hãy tạo trước bằng menu hoặc /cancel.',
    );
  }
  async function target(link: Link, intent: BotIntent): Promise<TelegramReply | null> {
    if (intent.fields._recordId || intent.resource === 'profile') return null;
    if (intent.resource === 'balance') throw new AppError(422, 'Chọn tài sản cụ thể.');
    if (intent.reference && z.uuid().safeParse(intent.reference).success) {
      const record = await queries.find({
        userId: link.userId,
        resource: intent.resource,
        id: intent.reference,
      });
      intent.fields._recordId = String(record.id);
      return null;
    }
    const result = await entities.choices({
      userId: link.userId,
      resource: intent.resource,
      search: intent.reference,
    });
    if (result.data.length === 1 && !result.hasMore) {
      intent.fields._recordId = result.data[0].id;
      return null;
    }
    return ask(
      link,
      intent,
      '_recordId',
      result.data.map((record) => ({ id: record.id, label: recordSummary(record) })),
      'Chọn bản ghi cần thao tác, hoặc nhập mã đầy đủ / một phần tên.',
    );
  }
  async function editField(link: Link, intent: BotIntent): Promise<TelegramReply | null> {
    if (intent.fields._edited || intent.action !== 'update') return null;
    const meaningful = Object.keys(intent.fields).some(
      (key) => !key.startsWith('_') && key !== 'warning',
    );
    if (meaningful) return null;
    const resource = intent.resource === 'balance' ? 'assets' : intent.resource;
    intent.fields._flowId ??= randomBytes(5).toString('hex');
    await drafts.remember(link.id, intent, '_field');
    return {
      text: 'Bạn muốn sửa thông tin nào?',
      buttons: BOT_EDIT_FIELDS[resource].map((key) => [
        {
          text: BOT_FIELD_LABELS[key] ?? key,
          callback_data: 'field:' + intent.fields._flowId + ':' + key,
        },
      ]),
    };
  }
  async function build(
    link: Link,
    user: ReadUser,
    intent: BotIntent,
  ): Promise<BotOperation | TelegramReply> {
    const fields = intent.fields;
    if (fields.warning) throw new AppError(422, fields.warning);
    if (intent.action === 'unlink') return { action: 'unlink', resource: 'profile', input: {} };
    if (intent.resource === 'balance') intent.resource = 'assets';
    const resource = intent.resource;
    if (['update', 'remove', 'archive', 'restore', 'reconcile'].includes(intent.action)) {
      const question = await target(link, intent);
      if (question) return question;
    }
    if (intent.action === 'remove' && resource !== 'profile') {
      const record = await queries.find({ userId: user.id, resource, id: fields._recordId });
      return {
        action: 'remove',
        resource,
        recordId: fields._recordId,
        input: { version: record.version },
      };
    }
    if (['archive', 'restore'].includes(intent.action)) {
      if (!['assets', 'categories'].includes(resource))
        throw new AppError(422, 'Chỉ tài sản và danh mục có lưu trữ.');
      fields._archive = intent.action === 'archive' ? 'true' : 'false';
    }
    const editing = await editField(link, intent);
    if (editing) return editing;
    if (intent.action === 'reconcile') {
      if (!fields.amount)
        return ask(link, intent, 'amount', undefined, 'Nhập số dư thực tế hiện tại của tài sản.');
      const record = await queries.find({
        userId: user.id,
        resource: 'assets',
        id: fields._recordId,
      });
      const body = { value: fields.amount, version: record.version };
      reconcileSchema.parse(body);
      return { action: 'reconcile', resource: 'assets', recordId: fields._recordId, input: body };
    }
    if (resource === 'profile') {
      if (intent.action === 'remove')
        throw new AppError(
          422,
          'Xóa tài khoản cần xác thực lại trong app. Không gửi mật khẩu vào chat.',
        );
      const current = await profileService(database).profile(user.id);
      const profileFields = ['displayName', 'gender', 'dateOfBirth'];
      if (!profileFields.some((key) => fields[key]) && !fields.avatarData)
        return ask(link, intent, 'displayName');
      const body = {
        ...current,
        ...Object.fromEntries(
          profileFields.filter((key) => fields[key]).map((key) => [key, fields[key]]),
        ),
        ...(fields.avatarData ? { avatarData: fields.avatarData } : {}),
      };
      profileSchema.parse(body);
      return { action: 'profile', resource: 'profile', input: body };
    }
    const existing = fields._recordId
      ? await queries.find({ userId: user.id, resource, id: fields._recordId })
      : undefined;
    if (
      resource === 'transactions' &&
      existing &&
      fields.kind &&
      fields.kind !== existing.kind &&
      !fields.categoryId
    ) {
      const question = await pickParent(link, intent, 'categoryId');
      if (question) return question;
    }
    const requirements = existing ? [] : BOT_FIELDS[resource];
    for (const requirement of requirements) {
      if (requirement.key === 'assetAccountId' && fields.allocations) continue;
      if (parents[requirement.key]) {
        const question = await pickParent(link, intent, requirement.key);
        if (question) return question;
        continue;
      }
      if (!fields[requirement.key]) return ask(link, intent, requirement.key);
    }
    for (const key of Object.keys(parents))
      if (fields[hints[key]] && !fields[key]) {
        const question = await pickParent(link, intent, key);
        if (question) return question;
      }
    if (fields._parent) {
      const question = await pickParent(link, intent, fields._parent);
      if (question) return question;
      delete fields._parent;
    }
    const today = localDay(new Date().toISOString(), user.timezone);
    const existingDay = existing?.occurredAt
      ? localDay(String(existing.occurredAt), user.timezone)
      : today;
    const existingClock = existing?.occurredAt
      ? new Intl.DateTimeFormat('en-GB', {
          timeZone: user.timezone,
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        }).format(new Date(String(existing.occurredAt)))
      : '12:00';
    const occurredAt =
      fields.date || fields.time
        ? botTimestamp(fields.date ?? existingDay, fields.time ?? existingClock, user.timezone)
        : (existing?.occurredAt ?? new Date().toISOString());
    const base: Record<string, unknown> = existing
      ? Object.fromEntries(
          Object.keys(createSchemas[resource].shape)
            .filter((key) => existing[key] !== undefined && existing[key] !== null)
            .map((key) => [key, existing[key]]),
        )
      : {};
    delete base.id;
    if (
      resource === 'transactions' &&
      fields.amount &&
      !fields.assetAccountId &&
      Array.isArray(base.allocations) &&
      base.allocations.length > 1 &&
      !fields.allocations
    )
      return ask(
        link,
        intent,
        'allocations',
        undefined,
        'Giao dịch dùng nhiều nguồn. Nhập phân bổ mới: tên nguồn:50k; tên nguồn khác:100k.',
      );
    if (resource === 'plans') {
      const category = await queries.find({
        userId: user.id,
        resource: 'categories',
        id: fields.categoryId ?? String(base.categoryId),
      });
      base.kind = category.kind;
    }
    Object.assign(
      base,
      telegramPayload({
        resource,
        fields,
        base,
        occurredAt: String(occurredAt),
        today,
        timezone: user.timezone,
      }),
    );
    if (resource === 'plans' && !existing) {
      const duplicates = await entities.choices({
        userId: user.id,
        resource: 'plans',
        month: String(base.month).slice(0, 7),
        categoryId: String(base.categoryId),
      });
      const previous = duplicates.data.find(
        (candidate) => candidate.categoryId === base.categoryId,
      );
      if (previous) {
        fields._recordId = previous.id;
        intent.action = 'update';
        fields._edited = 'true';
        return build(link, user, intent);
      }
    }
    if (fields.note && resource !== 'adjustments') base.note = fields.note;
    if (fields._archive) base.isArchived = fields._archive === 'true';
    createSchemas[resource].parse(base);
    if (resource === 'transactions' || resource === 'transfers' || resource === 'adjustments') {
      if (Date.parse(String(base.occurredAt)) > Date.now() + 60000)
        throw new AppError(422, 'Ngày phát sinh không được ở tương lai.');
    }
    return {
      action: existing ? 'update' : 'create',
      resource,
      ...(existing ? { recordId: String(existing.id) } : {}),
      input: { ...base, ...(existing ? { version: existing.version } : { id: randomUUID() }) },
    };
  }
  async function prepare(
    link: Link,
    user: ReadUser,
    intent: BotIntent,
    sourceKey: string,
  ): Promise<TelegramReply> {
    const result = await build(link, user, intent);
    if ('text' in result) return result;
    const labels = Object.entries(intent.fields)
      .filter(([key]) => key.startsWith('_label_'))
      .map(([key, value]) => (BOT_FIELD_LABELS[key.slice(7)] ?? key.slice(7)) + ': ' + value);
    result.summary = labels.join('\n').slice(0, 1500);
    const action = await drafts.stage(link.id, sourceKey, result);
    await drafts.forget(link.id);
    return {
      text: operationPreview(result),
      buttons: [
        [
          { text: '✅ Xác nhận', callback_data: 'confirm:' + action.id },
          { text: 'Hủy', callback_data: 'cancel' },
        ],
      ],
    };
  }
  async function consume(
    link: Link,
    user: ReadUser,
    text: string,
    callback: string | undefined,
    sourceKey: string,
  ): Promise<TelegramReply | null> {
    const conversation = await drafts.conversation(link.id);
    if (!conversation) return null;
    const intent = conversation.intent,
      key = conversation.awaiting;
    let value = text;
    if (callback) {
      const [type, flow, selected] = callback.split(':');
      if (!['pick', 'value', 'field'].includes(type)) return null;
      if (flow !== intent.fields._flowId)
        return { text: 'Nút này thuộc yêu cầu cũ. Hãy dùng lựa chọn mới nhất hoặc /cancel.' };
      value = selected;
      if (key === 'assetAccountId' && selected === 'split')
        return ask(
          link,
          intent,
          'allocations',
          undefined,
          'Nhập phân bổ: tên nguồn:50k; tên nguồn khác:100k.',
        );
      if (type === 'field') {
        if (intent.resource === 'balance' || !BOT_EDIT_FIELDS[intent.resource].includes(value))
          throw new AppError(422, 'Trường không hợp lệ.');
        intent.fields._edited = 'true';
        if (parents[value]) {
          intent.fields._parent = value;
          delete intent.fields[value];
          delete intent.fields[hints[value]];
          return prepare(link, user, intent, sourceKey);
        }
        return ask(link, intent, value);
      }
    }
    if (key === '_recordId') {
      if (!z.uuid().safeParse(value).success) {
        intent.reference = value;
        return prepare(link, user, intent, sourceKey);
      }
      intent.fields._recordId = value;
    } else if (parents[key]) {
      if (!z.uuid().safeParse(value).success) {
        intent.fields[hints[key]] = value;
        delete intent.fields[key];
        return prepare(link, user, intent, sourceKey);
      }
      const record = await queries.find({ userId: user.id, resource: parents[key], id: value });
      if (record.isArchived) throw new AppError(422, 'Nguồn/danh mục đã lưu trữ.');
      intent.fields[key] = value;
      intent.fields['_label_' + key] = String(record.name);
    } else if (key === 'allocations') {
      const entries = value
        .split(';')
        .map((entry) => entry.trim())
        .filter(Boolean);
      if (!entries.length || entries.length > 20)
        throw new AppError(422, 'Nhập tối đa 20 nguồn: tên nguồn:50k; tên khác:100k.');
      const allocations = [];
      for (const entry of entries) {
        const split = entry.lastIndexOf(':');
        if (split < 1) throw new AppError(422, 'Dùng tên nguồn:số tiền, phân tách bằng dấu ;');
        const name = entry.slice(0, split).trim(),
          amount = fieldValue('amount', entry.slice(split + 1));
        const choices = await entities.choices({
          userId: user.id,
          resource: 'assets',
          search: name,
          active: true,
        });
        if (choices.data.length !== 1 || choices.hasMore)
          throw new AppError(422, 'Nguồn ' + name + ' chưa rõ. Hãy dùng tên chính xác hoặc UUID.');
        allocations.push({ assetAccountId: choices.data[0].id, amount });
      }
      intent.fields.allocations = JSON.stringify(allocations);
    } else {
      intent.fields[key] = fieldValue(key, value);
    }
    return prepare(link, user, intent, sourceKey);
  }
  return { prepare, consume };
}
