import { AppError } from '../utils/app-error.ts';
import { z } from 'zod';
export function normalizeBotText(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}
export function botMoney(raw: string) {
  const text = normalizeBotText(raw).replace(/\s/g, '');
  const match = text.match(/^(-?)(\d[\d.,]*)(k|tr|trieu|nghin|ngan|ty|vnd|d|dong)?$/);
  if (!match) return null;
  let digits = match[2];
  if (/^\d{1,3}([.,]\d{3})+$/.test(digits)) digits = digits.replace(/[.,]/g, '');
  else digits = digits.replace(',', '.');
  if (!/^\d+(?:\.\d{1,9})?$/.test(digits) || digits.length > 28) return null;
  const factors: Record<string, bigint> = {
    k: 1000n,
    nghin: 1000n,
    ngan: 1000n,
    tr: 1000000n,
    trieu: 1000000n,
    ty: 1000000000n,
    vnd: 1n,
    d: 1n,
    dong: 1n,
  };
  const [whole, fraction = ''] = digits.split('.');
  const divisor = 10n ** BigInt(fraction.length);
  const value = (BigInt(whole) * divisor + BigInt(fraction || '0')) * factors[match[3] ?? 'vnd'];
  if (value % divisor !== 0n) return null;
  return (((match[1] ? -1n : 1n) * value) / divisor).toString();
}
function parts(timestamp: number, timezone: string) {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp));
  const component = (type: string) => Number(formatted.find((part) => part.type === type)?.value);
  return [
    component('year'),
    component('month'),
    component('day'),
    component('hour'),
    component('minute'),
  ];
}
export function botTimestamp(date: string, time: string, timezone: string) {
  if (!z.iso.date().safeParse(date).success || !/^\d{2}:\d{2}$/.test(time))
    throw new AppError(422, 'Ngày hoặc giờ không hợp lệ. Dùng YYYY-MM-DD và HH:mm.');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  if (year < 1000 || year > 9998 || hour > 23 || minute > 59)
    throw new AppError(422, 'Ngày giờ không hợp lệ.');
  const expected = [year, month, day, hour, minute];
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = target;
  for (let attempt = 0; attempt < 4; attempt++) {
    const actual = parts(candidate, timezone);
    candidate += target - Date.UTC(actual[0], actual[1] - 1, actual[2], actual[3], actual[4]);
  }
  if (parts(candidate, timezone).some((value, index) => value !== expected[index]))
    throw new AppError(422, 'Giờ không tồn tại trong múi giờ của bạn.');
  return new Date(candidate).toISOString();
}
export function fieldValue(key: string, raw: string) {
  const text = raw.trim();
  const normalized = normalizeBotText(text);
  if (['amount', 'value', 'openingValue', 'plannedAmount', 'deltaAmount'].includes(key)) {
    const money = botMoney(text);
    if (money === null) throw new AppError(422, 'Nhập số tiền VNĐ, ví dụ 50000, 50k hoặc 1,5tr.');
    return money;
  }
  if (key === 'kind') {
    const values: Record<string, string> = {
      thu: 'income',
      'thu nhap': 'income',
      income: 'income',
      chi: 'expense',
      'chi tieu': 'expense',
      expense: 'expense',
    };
    if (!values[normalized]) throw new AppError(422, 'Chọn Thu nhập hoặc Chi tiêu.');
    return values[normalized];
  }
  if (key === 'type') {
    const values: Record<string, string> = {
      'tien mat': 'cash',
      cash: 'cash',
      'ngan hang': 'bank',
      bank: 'bank',
      khac: 'other',
      other: 'other',
    };
    if (!values[normalized]) throw new AppError(422, 'Chọn Tiền mặt, Ngân hàng hoặc Khác.');
    return values[normalized];
  }
  if (key === 'gender') {
    const values: Record<string, string> = {
      nam: 'male',
      nu: 'female',
      khac: 'other',
      'khong chia se': 'undisclosed',
      male: 'male',
      female: 'female',
      other: 'other',
      undisclosed: 'undisclosed',
    };
    if (!values[normalized]) throw new AppError(422, 'Chọn nam, nữ, khác hoặc không chia sẻ.');
    return values[normalized];
  }
  if (['date', 'dateOfBirth'].includes(key)) {
    if (!z.iso.date().safeParse(text).success)
      throw new AppError(422, 'Ngày không hợp lệ. Dùng YYYY-MM-DD, ví dụ 2000-02-29.');
  }
  if (key === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(text))
    throw new AppError(422, 'Giờ hợp lệ từ 00:00 đến 23:59.');
  if (key === 'month' && !/^(?:[1-9]\d{3})-(?:0[1-9]|1[0-2])$/.test(text))
    throw new AppError(422, 'Tháng không hợp lệ. Dùng YYYY-MM.');
  if (!text || text.length > 2000) throw new AppError(422, 'Nội dung trống hoặc quá dài.');
  return text;
}
