import { toEnglishDigits, toPersianDigits } from './format';

const IRANIAN_MOBILE_REGEX = /^09\d{9}$/;

/**
 * Normalizes an input phone number to standard Iranian mobile format (09XXXXXXXXX).
 * Handles:
 * - Persian and Arabic digits
 * - Spaces, dashes, parentheses
 * - Country code prefixes (+98, 0098, 98)
 */
export const normalizePhoneNumber = (raw: string | null | undefined): string => {
  if (!raw) return '';
  let cleaned = toEnglishDigits(raw).replace(/[\s\-().]/g, '');

  if (cleaned.startsWith('+98')) {
    cleaned = '0' + cleaned.substring(3);
  } else if (cleaned.startsWith('0098')) {
    cleaned = '0' + cleaned.substring(4);
  } else if (cleaned.startsWith('98') && cleaned.length === 12) {
    cleaned = '0' + cleaned.substring(2);
  } else if (cleaned.startsWith('9') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
};

/**
 * Validates whether a phone number matches Iranian mobile format.
 */
export const isValidIranianMobile = (phone: string | null | undefined): boolean => {
  const normalized = normalizePhoneNumber(phone);
  return IRANIAN_MOBILE_REGEX.test(normalized);
};

/**
 * Formats a phone number for user-friendly display in Persian digits.
 * e.g. "09124567890" -> "۰۹۱۲ ۴۵۶ ۷۸۹۰"
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length === 11) {
    const formatted = `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;
    return toPersianDigits(formatted);
  }
  return toPersianDigits(phone || '');
};
