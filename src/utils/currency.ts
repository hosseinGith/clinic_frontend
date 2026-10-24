import { toPersianDigits } from '../lib/format';

/**
 * Converts Iranian Rial amount to Toman with Persian digits and 3-digit comma separation.
 * 1 Toman = 10 Rials
 */
export function formatRialToToman(
  amountInRials: number | string | null | undefined,
  options: { withUnit?: boolean } = {}
): string {
  const { withUnit = false } = options;
  const suffix = withUnit ? ' تومان' : '';

  if (amountInRials === null || amountInRials === undefined || amountInRials === '') {
    return toPersianDigits(0) + suffix;
  }

  const rials = typeof amountInRials === 'string' ? parseInt(amountInRials, 10) : amountInRials;
  if (isNaN(rials)) {
    return toPersianDigits(0) + suffix;
  }

  const toman = Math.floor(rials / 10);
  const formatted = toman.toLocaleString('en-US');
  return toPersianDigits(formatted) + suffix;
}

/**
 * Formats a raw number in Rials with commas and Persian digits.
 */
export function formatRial(
  amountInRials: number | string | null | undefined,
  options: { withUnit?: boolean } = {}
): string {
  const { withUnit = false } = options;
  const suffix = withUnit ? ' ریال' : '';

  if (amountInRials === null || amountInRials === undefined || amountInRials === '') {
    return toPersianDigits(0) + suffix;
  }

  const rials = typeof amountInRials === 'string' ? parseInt(amountInRials, 10) : amountInRials;
  if (isNaN(rials)) {
    return toPersianDigits(0) + suffix;
  }

  const formatted = rials.toLocaleString('en-US');
  return toPersianDigits(formatted) + suffix;
}

/**
 * Helper to display percentage with Latin digits
 */
export function formatPercent(rate: number): string {
  const rounded = Math.round(rate * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}%`;
}
