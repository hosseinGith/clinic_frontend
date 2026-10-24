const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS  = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Converts any number or string with Persian/Arabic digits to standard Latin ASCII digits.
 * Keeping the function export name for backwards compatibility across existing components.
 */
export const toPersianDigits = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '';
  return toEnglishDigits(String(value));
};

/**
 * Converts Persian and Arabic digits to standard English ASCII digits.
 */
export const toEnglishDigits = (value: string | null | undefined): string => {
  if (!value) return '';
  let str = value;
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(PERSIAN_DIGITS[i], 'g'), i.toString());
    str = str.replace(new RegExp(ARABIC_DIGITS[i], 'g'), i.toString());
  }
  return str;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  useGrouping: true,
});

/**
 * Formats a monetary amount in Tomans with Latin digits and standard thousands separator (,).
 * e.g. 12800000 -> "12,800,000 تومان"
 */
export const formatCurrency = (amount: number): string =>
  `${currencyFormatter.format(Math.round(amount))} تومان`;

/**
 * Formats duration in minutes to Persian representation.
 */
export const formatDuration = (minutes: number): string => {
  return `${toPersianDigits(minutes)} دقیقه`;
};

/**
 * Returns initials from a Persian name for avatars.
 */
export const getInitials = (fullName: string): string => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0);
  return `${parts[0].charAt(0)}`;
};

/**
 * Formats canonical time (HH:mm) into Persian digits (e.g. "09:00" -> "۰۹:۰۰").
 */
export const formatTimeFa = (time: string | null | undefined): string => {
  if (!time) return '';
  return toPersianDigits(time);
};

/**
 * Formats tracking code with Persian digits (e.g. "AR-8492" -> "AR-۸۴۹۲").
 */
export const formatTrackingCodeFa = (code: string | null | undefined): string => {
  if (!code) return '';
  return toPersianDigits(code);
};

export { formatPhoneNumber } from './phone';

