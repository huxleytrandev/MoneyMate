import { dateKey } from '@/helpers/date';
export function normalize(value: string) {
  return value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}
export function dayLabel(value: string) {
  const now = new Date();
  if (value === dateKey(now)) return 'Hôm nay';
  now.setDate(now.getDate() - 1);
  if (value === dateKey(now)) return 'Hôm qua';
  return new Date(value + 'T12:00:00').toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
