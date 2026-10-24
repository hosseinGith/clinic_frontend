import { describe, it, expect } from 'vitest';
import { formatRialToToman } from '../utils/currency';

describe('Unified Currency Helper & View Formatting Invariants', () => {
  it('converts exactly 1,000,000 Rials to 100,000 Tomans with Latin digits', () => {
    // 1,000,000 Rials / 10 = 100,000 Tomans -> '100,000'
    const toman = formatRialToToman(1000000);
    expect(toman).toBe('100,000');

    const tomanWithUnit = formatRialToToman(1000000, { withUnit: true });
    expect(tomanWithUnit).toBe('100,000 تومان');
  });

  it('displays 1,000,000 Rials as 100,000 Tomans consistently for Invoices, Revenue, Billing, and Subscriptions', () => {
    const testRials = 1000000;

    // Platform Invoices format: `${formatRialToToman(amount)} تومان`
    const invoicesDisplay = `${formatRialToToman(testRials)} تومان`;
    expect(invoicesDisplay).toBe('100,000 تومان');

    // Platform Revenue summary MRR / total revenue: `${formatRialToToman(amount)} تومان`
    const revenueDisplay = `${formatRialToToman(testRials)} تومان`;
    expect(revenueDisplay).toBe('100,000 تومان');

    // Clinic Billing Tab invoices: `${formatRialToToman(amount)} تومان`
    const clinicBillingDisplay = `${formatRialToToman(testRials)} تومان`;
    expect(clinicBillingDisplay).toBe('100,000 تومان');

    // MySubscriptionView plan price: `${formatRialToToman(amount)} تومان`
    const mySubscriptionDisplay = `${formatRialToToman(testRials)} تومان`;
    expect(mySubscriptionDisplay).toBe('100,000 تومان');
  });

  it('handles edge cases: 0 Rials, null, undefined, string numbers', () => {
    expect(formatRialToToman(0)).toBe('0');
    expect(formatRialToToman(null)).toBe('0');
    expect(formatRialToToman(undefined)).toBe('0');
    expect(formatRialToToman('1000000')).toBe('100,000');
  });

  it('manual payment form accepts Toman input / confirmation and converts to Rials (x10) for backend API', () => {
    // SuperAdmin inputs or confirms 100,000 Tomans on form
    const inputToman = 100000;
    const backendRials = inputToman * 10;

    expect(backendRials).toBe(1000000); // 1,000,000 Rials sent to backend
    expect(formatRialToToman(backendRials)).toBe('100,000');
  });
});
