import { APP_CONFIG } from '../configs/app.config.ts';
const formatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: APP_CONFIG.currency,
  maximumFractionDigits: 0,
});
export function formatMoney(value: number) {
  return formatter.format(value);
}
