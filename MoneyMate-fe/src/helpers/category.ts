import type { Category } from '../types/finance.types';
const suggestions: [RegExp, string][] = [
  [/an uong|thuc pham|an sang|an trua|an toi/, 'utensils'],
  [/ca phe|cafe/, 'coffee'],
  [/di lai|xang|xe|taxi/, 'bus'],
  [/mua sam|quan ao/, 'shopping-bag'],
  [/nha|thue|dien|nuoc/, 'house'],
  [/suc khoe|thuoc|benh/, 'heart'],
  [/hoc|giao duc/, 'graduation-cap'],
  [/giai tri|game/, 'gamepad'],
  [/luong|cong viec/, 'briefcase'],
  [/qua|thuong/, 'gift'],
  [/dau tu/, 'trending-up'],
  [/du lich/, 'plane'],
  [/tiet kiem/, 'piggy-bank'],
];
export function categoryIconName(category: Pick<Category, 'name' | 'kind' | 'icon'>) {
  if (category.icon) return category.icon;
  const name = category.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
  return (
    suggestions.find(([pattern]) => pattern.test(name))?.[1] ??
    (category.kind === 'income' ? 'wallet' : 'receipt')
  );
}
export function categoryColor(category: Pick<Category, 'color'>) {
  return category.color && /^#[0-9a-f]{6}$/i.test(category.color) ? category.color : '#0F766E';
}
