import { normalize } from './text.ts';
const units: Record<string, bigint> = {
  k: 1000n,
  nghin: 1000n,
  ngan: 1000n,
  tr: 1000000n,
  trieu: 1000000n,
  ty: 1000000000n,
  ti: 1000000000n,
  vnd: 1n,
  d: 1n,
  dong: 1n,
};
export function parseMoney(raw: string): string | null {
  const text = normalize(raw).replace(/₫/g, 'd').replace(/\s/g, '');
  const compound = text.match(/^(\d+)(tr|trieu)(\d{1,3})$/);
  if (compound)
    return (
      BigInt(compound[1]) * 1000000n +
      BigInt(compound[3]) * (1000000n / 10n ** BigInt(compound[3].length))
    ).toString();
  const match = text.match(/^(-?)(\d[\d.,]*)(k|nghin|ngan|tr|trieu|ty|ti|vnd|d|dong)?$/);
  if (!match) return null;
  let digits = match[2];
  const factor = units[match[3] ?? 'vnd'];
  if (/^\d{1,3}([.,]\d{3})+$/.test(digits)) digits = digits.replace(/[.,]/g, '');
  else digits = digits.replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(digits)) return null;
  const [whole, fraction = ''] = digits.split('.');
  if (fraction.length > 9 || whole.length > 18) return null;
  const divisor = 10n ** BigInt(fraction.length);
  const numerator = (BigInt(whole) * divisor + BigInt(fraction || '0')) * factor;
  if (numerator % divisor !== 0n) return null;
  const result = (numerator / divisor) * (match[1] ? -1n : 1n);
  return result > 9223372036854775807n || result < -9223372036854775808n ? null : result.toString();
}
export function findAmounts(text: string) {
  const normalized = normalize(text);
  return [
    ...normalized.matchAll(
      /(?<![\w/:-])(-?\d+tr\d{1,3}|-?\d[\d.,]*\s*(?:trieu|nghin|ngan|dong|vnd|tr|ty|ti|k|d))(?![a-z])/g,
    ),
  ].map((match) => ({ raw: match[0], amount: parseMoney(match[0]), index: match.index }));
}
