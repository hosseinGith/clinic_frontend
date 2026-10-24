import { describe, it, expect } from 'vitest';
import { normalizePhoneNumber, isValidIranianMobile, formatPhoneNumber } from '../lib/phone';

describe('Iranian Mobile Normalization and Validation', () => {
  it('normalizes Persian digits to standard English ASCII mobile format', () => {
    expect(normalizePhoneNumber('۰۹۱۲۴۵۶۷۸۹۰')).toBe('09124567890');
    expect(normalizePhoneNumber('۰۹۱۹۲۳۴۱۱۰۸')).toBe('09192341108');
  });

  it('normalizes international prefixes +98, 0098, 98 and removes spaces/dashes', () => {
    expect(normalizePhoneNumber('+98 912 456 7890')).toBe('09124567890');
    expect(normalizePhoneNumber('0098-912-456-7890')).toBe('09124567890');
    expect(normalizePhoneNumber('989124567890')).toBe('09124567890');
  });

  it('validates Iranian mobile numbers accurately', () => {
    expect(isValidIranianMobile('09124567890')).toBe(true);
    expect(isValidIranianMobile('۰۹۳۵۷۷۱۰۳۴۵')).toBe(true);
    expect(isValidIranianMobile('+989101126773')).toBe(true);
    expect(isValidIranianMobile('02188884321')).toBe(false); // Landline
    expect(isValidIranianMobile('0912345')).toBe(false); // Incomplete
    expect(isValidIranianMobile('abc')).toBe(false);
  });

  it('formats phone numbers for UI display with spaced groups in Latin digits', () => {
    expect(formatPhoneNumber('09124567890')).toBe('0912 456 7890');
  });
});
