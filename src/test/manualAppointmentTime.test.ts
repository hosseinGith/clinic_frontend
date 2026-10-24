import { describe, it, expect } from 'vitest';
import { toEnglishDigits } from '../lib/format';

describe('Manual Appointment Time Validation Regex', () => {
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

  const isValidTime = (time: string): boolean => {
    const normalized = toEnglishDigits(time).trim();
    return timeRegex.test(normalized);
  };

  it('accepts valid 24-hour format times with English digits', () => {
    expect(isValidTime('00:00')).toBe(true);
    expect(isValidTime('09:15')).toBe(true);
    expect(isValidTime('12:00')).toBe(true);
    expect(isValidTime('16:30')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
  });

  it('accepts valid 24-hour format times with Persian digits', () => {
    expect(isValidTime('۰۰:۰۰')).toBe(true);
    expect(isValidTime('۰۹:۱۵')).toBe(true);
    expect(isValidTime('۱۲:۰۰')).toBe(true);
    expect(isValidTime('۱۶:۰۰')).toBe(true);
    expect(isValidTime('۲۳:۵۹')).toBe(true);
  });

  it('rejects invalid hour or minute values', () => {
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('25:10')).toBe(false);
    expect(isValidTime('14:60')).toBe(false);
    expect(isValidTime('14:99')).toBe(false);
  });

  it('rejects improperly formatted strings or single digit hours without leading zero', () => {
    expect(isValidTime('9:30')).toBe(false);
    expect(isValidTime('16')).toBe(false);
    expect(isValidTime('16:0')).toBe(false);
    expect(isValidTime('abcd')).toBe(false);
    expect(isValidTime('')).toBe(false);
    expect(isValidTime('16:00:00')).toBe(false);
  });
});
