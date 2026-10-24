import type { ISubscriptionRepository } from '../../repositories/ISubscriptionRepository';
import type { ClinicSubscriptionUsage, Invoice, Plan } from '../../../types/platform/billing';

export class MockSubscriptionRepository implements ISubscriptionRepository {
  private plan: Plan = {
    id: 'plan-standard',
    code: 'standard',
    name: 'استاندارد',
    priceMonthly: 35000000,
    priceYearly: 350000000,
    maxDoctors: 5,
    maxMonthlyAppointments: 300,
    monthlySmsQuota: 1000,
    isActive: true,
    sortOrder: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  private subscriptionUsage: ClinicSubscriptionUsage = {
    subscription: {
      id: 'sub-my-clinic',
      clinicId: 'clinic-1',
      planId: 'plan-standard',
      billingCycle: 'monthly',
      status: 'active',
      startsAt: '2026-10-01T00:00:00.000Z',
      currentPeriodEnd: '2026-11-01T00:00:00.000Z',
      trialEndsAt: null,
      graceEndsAt: null,
      autoRenew: true,
      priceAtSubscription: 35000000,
      createdAt: '2026-10-01T00:00:00.000Z',
    },
    plan: this.plan,
    usage: {
      doctorsCount: 4,
      maxDoctors: 5,
      doctorsPercentage: 80,
      monthlyAppointmentsCount: 185,
      maxMonthlyAppointments: 300,
      appointmentsPercentage: 62,
      monthlySmsCount: 420,
      monthlySmsQuota: 1000,
      smsPercentage: 42,
    },
    daysRemaining: 11,
  };

  private invoices: Invoice[] = [
    {
      id: 'inv-my-1',
      number: 'INV-2026-0001',
      clinicId: 'clinic-1',
      subscriptionId: 'sub-my-clinic',
      amount: 35000000,
      status: 'paid',
      periodStart: '2026-09-01T00:00:00.000Z',
      periodEnd: '2026-10-01T00:00:00.000Z',
      dueDate: '2026-09-08T00:00:00.000Z',
      paidAt: '2026-09-02T10:00:00.000Z',
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'inv-my-2',
      number: 'INV-2026-0002',
      clinicId: 'clinic-1',
      subscriptionId: 'sub-my-clinic',
      amount: 35000000,
      status: 'paid',
      periodStart: '2026-10-01T00:00:00.000Z',
      periodEnd: '2026-11-01T00:00:00.000Z',
      dueDate: '2026-10-08T00:00:00.000Z',
      paidAt: '2026-10-01T15:30:00.000Z',
      createdAt: '2026-10-01T00:00:00.000Z',
    },
  ];

  async getMySubscription(): Promise<ClinicSubscriptionUsage> {
    return this.subscriptionUsage;
  }

  async getMyInvoices(params?: { page?: number; limit?: number }): Promise<{ items: Invoice[]; total: number; page: number; limit: number }> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    return {
      items: this.invoices.slice(start, start + limit),
      total: this.invoices.length,
      page,
      limit,
    };
  }

  async getMyInvoice(id: string): Promise<Invoice> {
    const inv = this.invoices.find((i) => i.id === id);
    if (!inv) throw new Error('فاکتور یافت نشد');
    return inv;
  }
}
