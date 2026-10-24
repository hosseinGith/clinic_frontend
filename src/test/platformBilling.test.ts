import { describe, it, expect, beforeEach } from 'vitest';
import { formatRialToToman, formatRial, formatPercent } from '../utils/currency';
import { getBillingErrorMessage } from '../utils/billingErrors';
import { MockPlatformBillingRepository } from '../services/adapters/mock/MockPlatformBillingRepository';
import { MockSubscriptionRepository } from '../services/adapters/mock/MockSubscriptionRepository';

describe('Phase 2 Billing Frontend Utilities & Repositories', () => {
  describe('currency utilities', () => {
    it('converts Rials to Toman with Latin numerals', () => {
      // 10,000,000 Rials = 1,000,000 Toman -> '1,000,000'
      expect(formatRialToToman(10000000)).toBe('1,000,000');
      expect(formatRialToToman('35000000')).toBe('3,500,000');
      expect(formatRialToToman(0)).toBe('0');
    });

    it('formats Rials correctly', () => {
      expect(formatRial(5000000)).toBe('5,000,000');
    });

    it('formats percentages with Latin numerals and sign', () => {
      expect(formatPercent(25.5)).toBe('+25.5%');
      expect(formatPercent(-12.4)).toBe('-12.4%');
      expect(formatPercent(0)).toBe('0%');
    });
  });

  describe('billing error messages mapper', () => {
    it('maps PLAN_LIMIT_EXCEEDED for doctors', () => {
      const err = { response: { data: { message: 'PLAN_LIMIT_EXCEEDED: maxDoctors limit reached' } } };
      expect(getBillingErrorMessage(err)).toContain('سقف تعداد پزشکان فعال');
    });

    it('maps PLAN_LIMIT_EXCEEDED for monthly appointments', () => {
      const err = { response: { data: { message: 'PLAN_LIMIT_EXCEEDED: maxMonthlyAppointments' } } };
      expect(getBillingErrorMessage(err)).toContain('سقف نوبت‌های ماهانه کلینیک');
    });

    it('maps INVOICE_ALREADY_PAID', () => {
      const err = { response: { data: { message: 'INVOICE_ALREADY_PAID' } } };
      expect(getBillingErrorMessage(err)).toBe('این فاکتور قبلاً پرداخت شده است.');
    });

    it('maps INVOICE_VOID', () => {
      const err = { response: { data: { message: 'INVOICE_VOID' } } };
      expect(getBillingErrorMessage(err)).toContain('این فاکتور باطل شده است');
    });
  });

  describe('MockPlatformBillingRepository state machine and invariants', () => {
    let repo: MockPlatformBillingRepository;

    beforeEach(() => {
      repo = new MockPlatformBillingRepository();
    });

    it('returns plans and allows deactivation', async () => {
      const initial = await repo.getPlans(true);
      expect(initial.length).toBeGreaterThanOrEqual(3);

      const deactivated = await repo.deactivatePlan('plan-basic');
      expect(deactivated.isActive).toBe(false);

      const activeOnly = await repo.getPlans(false);
      expect(activeOnly.find((p) => p.id === 'plan-basic')).toBeUndefined();
    });

    it('allows recording manual payment on open invoice with exact amount', async () => {
      const res = await repo.recordManualPayment({
        invoiceId: 'inv-1002',
        amount: 35000000,
        notes: 'پرداخت دستی تستی',
      });

      expect(res.invoice.status).toBe('paid');
      expect(res.payment.status).toBe('succeeded');
      expect(res.payment.method).toBe('manual');
    });

    it('rejects recording payment on already paid invoice with 409', async () => {
      await expect(
        repo.recordManualPayment({
          invoiceId: 'inv-1001', // Already paid
          amount: 35000000,
        })
      ).rejects.toThrow('این فاکتور قبلاً پرداخت شده است');
    });

    it('rejects recording payment with amount mismatch', async () => {
      await expect(
        repo.recordManualPayment({
          invoiceId: 'inv-1002',
          amount: 10000, // mismatch
        })
      ).rejects.toThrow('مبلغ واریزی با مبلغ فاکتور یکسان نیست');
    });

    it('prevents voiding a paid invoice', async () => {
      await expect(
        repo.voidInvoice('inv-1001', { reason: 'اشتباه' })
      ).rejects.toThrow('فاکتور پرداخت‌شده قابل ابطال نیست');
    });

    it('allows voiding an open invoice', async () => {
      const voided = await repo.voidInvoice('inv-1002', { reason: 'ابطال آزمایشی' });
      expect(voided.status).toBe('void');
    });

    it('provides revenue summary and timeseries', async () => {
      const summary = await repo.getRevenueSummary();
      expect(summary.mrr).toBeGreaterThan(0);
      expect(summary.subscriptionsCount.active).toBeGreaterThan(0);

      const timeseries = await repo.getRevenueTimeseries();
      expect(timeseries.length).toBeGreaterThan(0);
    });
  });

  describe('MockSubscriptionRepository for clinic tenant', () => {
    let repo: MockSubscriptionRepository;

    beforeEach(() => {
      repo = new MockSubscriptionRepository();
    });

    it('retrieves subscription usage and limits', async () => {
      const usage = await repo.getMySubscription();
      expect(usage.subscription?.status).toBe('active');
      expect(usage.usage.maxDoctors).toBe(5);
      expect(usage.usage.doctorsCount).toBe(4);
    });

    it('retrieves clinic invoices list', async () => {
      const invoices = await repo.getMyInvoices({ page: 1, limit: 10 });
      expect(invoices.total).toBe(2);
      expect(invoices.items[0].number).toBe('INV-2026-0001');
    });
  });
});
