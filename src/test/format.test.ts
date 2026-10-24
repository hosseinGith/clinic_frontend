import { describe, it, expect } from 'vitest';
import {
  toPersianDigits,
  toEnglishDigits,
  formatCurrency,
  formatDuration,
  getInitials,
} from '../lib/format';

describe('Format and Digit Conversion Helpers', () => {
  it('converts digits to Latin digits consistently', () => {
    expect(toPersianDigits('0123456789')).toBe('0123456789');
    expect(toPersianDigits(1405)).toBe('1405');
  });

  it('converts Arabic digits to Latin digits', () => {
    expect(toPersianDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('converts Persian digits back to English digits', () => {
    expect(toEnglishDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
    expect(toEnglishDigits('۰۹:۰۰')).toBe('09:00');
  });

  it('formats monetary currency in Tomans with Latin thousands separator', () => {
    expect(formatCurrency(12800000)).toBe('12,800,000 تومان');
    expect(formatCurrency(4500000)).toBe('4,500,000 تومان');
  });

  it('formats duration in minutes with Latin digits', () => {
    expect(formatDuration(30)).toBe('30 دقیقه');
    expect(formatDuration(90)).toBe('90 دقیقه');
  });

  it('extracts initials from Persian names', () => {
    expect(getInitials('سارا حسینی')).toBe('س');
    expect(getInitials('مریم احمدی')).toBe('م');
  });
});
