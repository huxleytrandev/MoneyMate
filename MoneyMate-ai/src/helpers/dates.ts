import { normalize } from './text.ts';
function offset(today: string, amount: number) {
  const date = new Date(today + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function parseDate(text: string, today: string) {
  const normalized = normalize(text);
  if (/hom qua/.test(normalized)) return offset(today, -1);
  if (/hom kia/.test(normalized)) return offset(today, -2);
  if (/ngay mai|hom sau/.test(normalized)) return offset(today, 1);
  if (/hom nay/.test(normalized)) return today;
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const date = normalized.match(/(?:ngay\s+)?\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?\b/);
  if (!date) return undefined;
  return (
    (date[3] ?? today.slice(0, 4)) + '-' + date[2].padStart(2, '0') + '-' + date[1].padStart(2, '0')
  );
}
export function parseMonth(text: string, today: string) {
  const normalized = normalize(text);
  if (/thang (sau|toi)/.test(normalized)) {
    const date = new Date(today.slice(0, 7) + '-01T12:00:00Z');
    date.setUTCMonth(date.getUTCMonth() + 1);
    return date.toISOString().slice(0, 7);
  }
  if (/thang truoc/.test(normalized)) {
    const date = new Date(today.slice(0, 7) + '-01T12:00:00Z');
    date.setUTCMonth(date.getUTCMonth() - 1);
    return date.toISOString().slice(0, 7);
  }
  const match = normalized.match(/thang\s+(\d{1,2})(?:[ /-]+(\d{4}))?/);
  return match
    ? (match[2] ?? today.slice(0, 4)) + '-' + match[1].padStart(2, '0')
    : today.slice(0, 7);
}
export function parseTime(text: string) {
  const match = normalize(text).match(/(?:luc\s+)?\b(\d{1,2})(?:h|:)(\d{2})?\b/);
  if (!match) return undefined;
  let hours = Number(match[1]);
  if (/toi|chieu/.test(normalize(text)) && hours < 12) hours += 12;
  return String(hours).padStart(2, '0') + ':' + (match[2] ?? '00');
}
