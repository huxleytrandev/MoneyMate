import type {
  Intent,
  InterpretInput,
  IntentResource,
  IntentAction,
} from '../types/intent.types.ts';
import { normalize } from '../helpers/text.ts';
import { findAmounts, parseMoney } from '../helpers/money.ts';
import { parseDate, parseMonth, parseTime } from '../helpers/dates.ts';
const resourcePatterns: [RegExp, IntentResource][] = [
  [/danh muc|category/, 'categories'],
  [/ngan sach|ke hoach|du kien|planned|budget/, 'plans'],
  [/doi soat|dieu chinh|adjustment/, 'adjustments'],
  [/chuyen tien|chuyen noi bo|transfer|chuyen.*tu .*(sang|den)/, 'transfers'],
  [/ho so|gioi tinh|ngay sinh|avatar|ten toi|ten cua toi/, 'profile'],
  [/tai san|tai khoan ngan hang|asset/, 'assets'],
  [/so du|balance/, 'balance'],
  [/giao dich|chi tieu|thu nhap|transaction/, 'transactions'],
];
const commandResources: Record<string, IntentResource> = {
  giaodich: 'transactions',
  transactions: 'transactions',
  taisan: 'assets',
  assets: 'assets',
  danhmuc: 'categories',
  categories: 'categories',
  kehoach: 'plans',
  plans: 'plans',
  chuyentien: 'transfers',
  transfers: 'transfers',
  dieuchinh: 'adjustments',
  adjustments: 'adjustments',
  hoso: 'profile',
  profile: 'profile',
  sodu: 'balance',
  balance: 'balance',
};
function actionFor(text: string): IntentAction {
  const rules: [RegExp, IntentAction][] = [
    [/^(huy|cancel)$/, 'cancel'],
    [/huy lien ket|ngat ket noi/, 'unlink'],
    [/doi mat khau|doi email|xoa tai khoan|dang xuat/, 'security'],
    [/khoi phuc|bo luu tru/, 'restore'],
    [/luu tru/, 'archive'],
    [/doi soat|so du (thuc te|con lai)|cap nhat so du/, 'reconcile'],
    [/^(xoa|delete|remove|hoan tac)/, 'remove'],
    [/^(sua|doi|cap nhat|update|edit)/, 'update'],
    [/bao cao|thong ke|tang truong|report/, 'report'],
    [/^(xem|liet ke|danh sach|list)|con bao nhieu|da chi|thu duoc/, 'list'],
    [/^(them|tao|ghi|dat|create)|ngan sach|du kien/, 'create'],
  ];
  return rules.find(([pattern]) => pattern.test(text))?.[1] ?? 'create';
}
function capture(text: string, expression: RegExp) {
  return text.match(expression)?.[1]?.trim();
}
function inferredCategory(text: string) {
  const rules: [RegExp, string][] = [
    [/an trua|an sang|an toi|com|bun|pho|ca phe|cafe/, 'Ăn uống'],
    [/xang|taxi|di lai|grab/, 'Đi lại'],
    [/luong/, 'Lương'],
    [/lam them|freelance/, 'Làm thêm'],
    [/thue nha|tien dien|tien nuoc/, 'Nhà ở'],
    [/mua sam|quan ao/, 'Mua sắm'],
  ];
  return rules.find(([pattern]) => pattern.test(text))?.[1];
}
export function interpret(input: InterpretInput): Intent {
  const raw = input.text.trim();
  const text = normalize(raw);
  const fields: Record<string, string> = {};
  const command = text.match(/^\/(\w+)(?:@\w+)?(?:\s+(.*))?$/);
  if (command && ['start', 'help', 'menu'].includes(command[1]))
    return { action: 'help', resource: 'balance', fields };
  if (command && ['huy', 'cancel', 'unlink'].includes(command[1]))
    return { action: command[1] === 'unlink' ? 'unlink' : 'cancel', resource: 'profile', fields };
  if (command && commandResources[command[1]])
    return {
      action: commandResources[command[1]] === 'profile' ? 'show' : 'list',
      resource: commandResources[command[1]],
      fields: { month: parseMonth(text, input.today) },
    };
  if (command && ['new', 'edit', 'delete', 'show'].includes(command[1])) {
    const [resource, reference] = (command[2] ?? '').split(/\s+/);
    return {
      action: ({ new: 'create', edit: 'update', delete: 'remove', show: 'show' } as const)[
        command[1] as 'new'
      ],
      resource: commandResources[resource] ?? 'transactions',
      fields,
      ...(reference ? { reference } : {}),
    };
  }
  if (command && command[1] === 'report')
    return {
      action: 'report',
      resource: 'balance',
      fields: { month: parseMonth(text, input.today) },
    };
  if (/^(xin chao|chao|hi|hello|huong dan|tro giup)$/.test(text))
    return { action: 'help', resource: 'balance', fields };
  const amounts = findAmounts(raw);
  const amount =
    amounts[0]?.amount ??
    text.match(/(?:so tien|so du|thanh|con|la)\s+(-?\d[\d.,]*)(?:\s|$)/i)?.[1];
  if (amount) fields.amount = parseMoney(amount) ?? amount;
  if (amounts.length > 1)
    fields.warning = 'Tin nhắn có nhiều số tiền. Hãy ghi một thao tác mỗi lần để tránh nhầm lẫn.';
  const date = parseDate(raw, input.today);
  if (date) fields.date = date;
  const time = parseTime(raw);
  if (time) fields.time = time;
  if (/thang/.test(text)) fields.month = parseMonth(raw, input.today);
  if (/\b(thu|nhan)\b|luong|thu nhap|tien thuong/.test(text)) fields.kind = 'income';
  if (/chi tieu|danh muc chi|khoan chi|mua|an trua|an sang|an toi|xang|thanh toan/.test(text))
    fields.kind = 'expense';
  const category = inferredCategory(text);
  if (category) fields.category = category;
  if (/tien mat/.test(text)) fields.asset = 'tiền mặt';
  const bank = text.match(
    /vietcombank|vcb|techcombank|tcb|mbbank|mb bank|bidv|acb|tpbank|vpbank|agribank|sacombank/,
  );
  if (bank) fields.asset = bank[0];
  let resource: IntentResource =
    resourcePatterns.find(([pattern]) => pattern.test(text))?.[1] ?? 'transactions';
  let action = actionFor(text);
  if (/doi soat|cap nhat so du/.test(text)) {
    action = 'reconcile';
    resource = 'assets';
  }
  if (/^(so du|tong tai san)(\s|$)/.test(text) && !amount) {
    action = 'list';
    resource = 'balance';
  }
  if (!amount && action === 'create' && !/^(them|tao|ghi|dat)/.test(text)) action = 'help';
  const reference =
    raw.match(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/i)?.[0] ?? capture(raw, /["“]([^"”]+)["”]/);
  const name = capture(
    raw,
    /(?:tên|ten)\s+(?:là\s+|la\s+|thành\s+|thanh\s+)?(.+?)(?=\s+(?:số dư|so du|số tiền|so tien|loại|loai|màu|mau|ngày|ngay)|$)/i,
  );
  if (name) fields.name = name;
  if (resource === 'transactions' && action === 'create')
    fields.title = raw
      .replace(/\b(?:\d[\d.,]*\s*(?:triệu|nghìn|ngàn|tr|k|vnd|đồng))\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);
  if (
    resource === 'assets' &&
    (action === 'create' ||
      /loai (tai san )?(la |thanh )?(tien mat|ngan hang|bank|khac)/.test(text))
  )
    fields.type = /tien mat/.test(text)
      ? 'cash'
      : /ngan hang|bank/.test(text)
        ? 'bank'
        : /khac/.test(text)
          ? 'other'
          : '';
  if (resource === 'profile') {
    const displayName = capture(
      raw,
      /(?:tên tôi|ten toi|tên của tôi|ten cua toi)\s+(?:thành|thanh|là|la)\s+(.+)$/i,
    );
    if (displayName) fields.displayName = displayName;
    if (/gioi tinh/.test(text))
      fields.gender = /\bnu\b/.test(text)
        ? 'female'
        : /\bnam\b/.test(text)
          ? 'male'
          : /khac/.test(text)
            ? 'other'
            : 'undisclosed';
    if (/ngay sinh/.test(text) && date) fields.dateOfBirth = date;
  }
  if (resource === 'transfers') {
    fields.from = capture(raw, /(?:từ|tu)\s+(.+?)(?=\s+(?:sang|đến|den)\s+)/i) ?? '';
    fields.to = capture(raw, /(?:sang|đến|den)\s+(.+)$/i) ?? '';
  }
  if (resource === 'categories' && !fields.name && action === 'create')
    fields.name =
      capture(
        raw,
        /(?:danh mục|danh muc)\s+(?:(?:thu nhập|thu nhap|chi tiêu|chi tieu)\s+)?(.+)$/i,
      ) ?? '';
  if (action !== 'create' && !/danh muc|category/.test(text)) delete fields.category;
  if (resource === 'transactions' && action === 'update') {
    const title = capture(
      raw,
      /(?:nội dung|noi dung|tên giao dịch|ten giao dich)\s+(?:thành|thanh|là|la)\s+(.+)$/i,
    );
    if (title) fields.title = title;
  }
  if (/tuan/.test(text)) fields.period = 'week';
  else if (/quy/.test(text)) fields.period = 'quarter';
  else if (/nam nay/.test(text)) fields.period = 'year';
  return { action, resource, fields, ...(reference ? { reference } : {}) };
}
