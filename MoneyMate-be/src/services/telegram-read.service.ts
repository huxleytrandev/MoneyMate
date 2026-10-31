import { AppError } from '../utils/app-error.ts';
import { z } from 'zod';
import type { Database } from '../types/database.types.ts';
import type { ReadUser } from '../types/finance-read.types.ts';
import type { BotIntent, TelegramReply } from '../types/telegram.types.ts';
import { telegramEntityRepository } from '../repositories/telegram-entity.repository.ts';
import { financeReadService } from './finance-read.service.ts';
import { statisticsService } from './statistics.service.ts';
import { profileService } from './profile.service.ts';
import { localDay } from '../utils/finance.ts';
import { money, recordSummary } from '../utils/telegram-format.ts';
import { TELEGRAM } from '../constants/telegram.constant.ts';
export function telegramReadService(database: Database) {
  const queries = financeReadService(database);
  const entities = telegramEntityRepository(database);
  async function balance(user: ReadUser): Promise<TelegramReply> {
    const month = localDay(new Date().toISOString(), user.timezone).slice(0, 7);
    const state = await queries.state({ user, query: { month, limit: 1 } });
    const assets = state.assets as {
      name: string;
      currentBalance?: string;
      openingValue: string | bigint;
    }[];
    const total = assets.reduce(
      (sum, asset) => sum + BigInt(asset.currentBalance ?? asset.openingValue),
      0n,
    );
    return {
      text: [
        'Tổng tài sản: ' + money(total),
        ...assets
          .slice(0, 12)
          .map((asset) => asset.name + ': ' + money(asset.currentBalance ?? asset.openingValue)),
        assets.length > 12
          ? 'Còn ' + (assets.length - 12) + ' tài sản khác; mở danh sách để xem tiếp.'
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
    };
  }
  async function list(user: ReadUser, intent: BotIntent, page = 1): Promise<TelegramReply> {
    if (intent.resource === 'balance') return balance(user);
    if (intent.resource === 'profile') return profile(user);
    const result = await entities.choices({
      userId: user.id,
      resource: intent.resource,
      page,
      search: intent.reference,
      kind: intent.fields.kind,
      month: intent.fields.month,
      timezone: user.timezone,
    });
    const buttons = result.data.map((row) => [
      {
        text: recordSummary(row).slice(0, 60),
        callback_data: 'view:' + intent.resource + ':' + row.id,
      },
    ]);
    buttons.push([{ text: '➕ Thêm mới', callback_data: 'create:' + intent.resource }]);
    if (result.hasMore)
      buttons.push([
        {
          text: 'Trang tiếp →',
          callback_data: [
            'page',
            intent.resource,
            page + 1,
            intent.fields.month ?? '',
            intent.fields.kind ?? '',
          ].join(':'),
        },
      ]);
    if (page > 1)
      buttons.push([
        {
          text: '← Trang trước',
          callback_data: [
            'page',
            intent.resource,
            page - 1,
            intent.fields.month ?? '',
            intent.fields.kind ?? '',
          ].join(':'),
        },
      ]);
    return {
      text:
        TELEGRAM.labels[intent.resource] +
        ' · trang ' +
        page +
        '\n' +
        (result.data.map(recordSummary).join('\n') || 'Chưa có dữ liệu.'),
      buttons,
    };
  }
  async function detail(
    user: ReadUser,
    resource: Exclude<BotIntent['resource'], 'balance' | 'profile'>,
    id: string,
  ): Promise<TelegramReply> {
    z.uuid().parse(id);
    const record = await queries.find({ userId: user.id, resource, id });
    const allowed = [
      'name',
      'title',
      'kind',
      'type',
      'amount',
      'openingValue',
      'openingAt',
      'plannedAmount',
      'month',
      'deltaAmount',
      'occurredAt',
      'note',
      'isArchived',
      'version',
    ];
    const rows = allowed
      .filter((key) => record[key] !== undefined && record[key] !== null)
      .map(
        (key) =>
          key +
          ': ' +
          (['amount', 'openingValue', 'plannedAmount', 'deltaAmount'].includes(key)
            ? money(record[key])
            : String(record[key])),
      );
    return {
      text: [TELEGRAM.labels[resource], ...rows, 'Mã: ' + id].join('\n'),
      buttons: [
        [
          { text: 'Sửa', callback_data: 'update:' + resource + ':' + id },
          { text: 'Xóa / hoàn tác', callback_data: 'remove:' + resource + ':' + id },
        ],
        ...(resource === 'assets'
          ? [[{ text: 'Đối soát số dư', callback_data: 'reconcile:assets:' + id }]]
          : []),
        ...(['assets', 'categories'].includes(resource)
          ? [
              [
                {
                  text: record.isArchived ? 'Sử dụng lại' : 'Lưu trữ',
                  callback_data:
                    (record.isArchived ? 'restore:' : 'archive:') + resource + ':' + id,
                },
              ],
            ]
          : []),
      ],
    };
  }
  async function profile(user: ReadUser): Promise<TelegramReply> {
    const result = await profileService(database).profile(user.id);
    return {
      text: [
        'Hồ sơ của bạn',
        'Tên: ' + result.displayName,
        'Giới tính: ' + (result.gender ?? 'Chưa chia sẻ'),
        'Ngày sinh: ' + (result.dateOfBirth ?? 'Chưa chia sẻ'),
        'Có thể gửi ảnh JPEG nhỏ hơn 128 KB để đổi avatar. Không gửi mật khẩu vào chat.',
      ].join('\n'),
      buttons: [
        [{ text: 'Chỉnh sửa hồ sơ', callback_data: 'update:profile' }],
        [{ text: 'Bảo mật trong app', callback_data: 'security' }],
      ],
    };
  }
  async function report(user: ReadUser, fields: Record<string, string>): Promise<TelegramReply> {
    const today = localDay(new Date().toISOString(), user.timezone);
    const month = fields.month ?? today.slice(0, 7);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new AppError(422, 'Tháng không hợp lệ.');
    let start = month + '-01';
    let end = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0))
      .toISOString()
      .slice(0, 10);
    const period = fields.period ?? 'month';
    if (period === 'year') {
      start = today.slice(0, 4) + '-01-01';
      end = today.slice(0, 4) + '-12-31';
    }
    if (period === 'quarter') {
      const first = Math.floor((Number(today.slice(5, 7)) - 1) / 3) * 3;
      start = today.slice(0, 4) + '-' + String(first + 1).padStart(2, '0') + '-01';
      end = new Date(Date.UTC(Number(today.slice(0, 4)), first + 3, 0)).toISOString().slice(0, 10);
    }
    if (period === 'week') {
      const date = new Date(today + 'T12:00:00Z');
      date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
      start = date.toISOString().slice(0, 10);
      end = today;
    }
    const result = await statisticsService(database).report(user.id, user.timezone, {
      start,
      end,
      period,
    });
    const income = result.series.reduce((sum, row) => sum + row.income, 0n),
      expense = result.series.reduce((sum, row) => sum + row.expense, 0n);
    const categories = result.categories.slice(0, 10).map((category) => {
      const planned = category.planned;
      const count = planned && planned > 0n ? Number((category.actual * 10n) / planned) : 0;
      return (
        category.name +
        ' · ' +
        category.kind +
        '\n' +
        (planned === null ? 'Chưa đặt kế hoạch' : 'Dự kiến ' + money(planned)) +
        ' / Thực tế ' +
        money(category.actual) +
        '\n' +
        (planned === null
          ? ''
          : Array.from({ length: 10 }, (_, index) =>
              index < Math.min(count, 10) ? '▰' : '▱',
            ).join('') +
            ' · ' +
            (category.kind === 'expense' ? 'Còn được chi: ' : 'Còn cần thu: ') +
            money(category.remaining))
      );
    });
    return {
      text: [
        'Báo cáo ' + start + ' → ' + end,
        'Thu: ' + money(income),
        'Chi: ' + money(expense),
        ...categories,
      ]
        .join('\n')
        .slice(0, 3700),
    };
  }
  return { list, balance, detail, profile, report };
}
