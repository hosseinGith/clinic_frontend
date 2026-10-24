import type {
  IPlatformBillingRepository,
  CreatePlanDto,
  UpdatePlanDto,
  ChangePlanDto,
  ExtendSubscriptionDto,
  RecordManualPaymentDto,
  VoidInvoiceDto,
} from '../../repositories/IPlatformBillingRepository';
import type {
  Plan,
  Subscription,
  ClinicSubscriptionUsage,
  Invoice,
  Payment,
  RevenueSummary,
  RevenueTimeseriesPoint,
  RevenueByClinicItem,
  RevenueByPlanItem,
  InvoiceStatus,
} from '../../../types/platform/billing';

export class MockPlatformBillingRepository implements IPlatformBillingRepository {
  private plans: Plan[] = [
    {
      id: 'plan-basic',
      code: 'basic',
      name: 'پایه (استارتاپ)',
      description: 'مناسب مطب‌های تک‌پزشکه و شروع به کار',
      priceMonthly: 15000000, // 1,500,000 تومان (15,000,000 ریال)
      priceYearly: 150000000,
      maxDoctors: 2,
      maxMonthlyAppointments: 100,
      monthlySmsQuota: 500,
      isActive: true,
      sortOrder: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'plan-standard',
      code: 'standard',
      name: 'استاندارد',
      description: 'ایده‌آل برای کلینیک‌های متوسط با چند پزشک',
      priceMonthly: 35000000, // 3,500,000 تومان
      priceYearly: 350000000,
      maxDoctors: 10,
      maxMonthlyAppointments: 500,
      monthlySmsQuota: 2000,
      isActive: true,
      sortOrder: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'plan-pro',
      code: 'pro',
      name: 'حرفه‌ای (پرو)',
      description: 'امکانات نامحدود و درمانگاه‌های بزرگ شبانه‌روزی',
      priceMonthly: 80000000, // 8,000,000 تومان
      priceYearly: 800000000,
      maxDoctors: 50,
      maxMonthlyAppointments: 5000,
      monthlySmsQuota: 10000,
      isActive: true,
      sortOrder: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  private subscriptions: Map<string, Subscription> = new Map([
    [
      'clinic-ariana',
      {
        id: 'sub-ariana-1',
        clinicId: 'clinic-ariana',
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
    ],
    [
      'clinic-shafa',
      {
        id: 'sub-shafa-1',
        clinicId: 'clinic-shafa',
        planId: 'plan-pro',
        billingCycle: 'yearly',
        status: 'active',
        startsAt: '2026-01-01T00:00:00.000Z',
        currentPeriodEnd: '2027-01-01T00:00:00.000Z',
        trialEndsAt: null,
        graceEndsAt: null,
        autoRenew: true,
        priceAtSubscription: 800000000,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  ]);

  private invoices: Invoice[] = [
    {
      id: 'inv-1001',
      number: 'INV-2026-0001',
      clinicId: 'clinic-ariana',
      clinicName: 'کلینیک تخصصی پوست و زیبایی آریانا',
      subscriptionId: 'sub-ariana-1',
      amount: 35000000,
      status: 'paid',
      periodStart: '2026-10-01T00:00:00.000Z',
      periodEnd: '2026-11-01T00:00:00.000Z',
      dueDate: '2026-10-08T00:00:00.000Z',
      paidAt: '2026-10-02T14:20:00.000Z',
      createdAt: '2026-10-01T00:00:00.000Z',
    },
    {
      id: 'inv-1002',
      number: 'INV-2026-0002',
      clinicId: 'clinic-ariana',
      clinicName: 'کلینیک تخصصی پوست و زیبایی آریانا',
      subscriptionId: 'sub-ariana-1',
      amount: 35000000,
      status: 'open',
      periodStart: '2026-11-01T00:00:00.000Z',
      periodEnd: '2026-12-01T00:00:00.000Z',
      dueDate: '2026-11-08T00:00:00.000Z',
      paidAt: null,
      createdAt: '2026-10-20T00:00:00.000Z',
    },
    {
      id: 'inv-1003',
      number: 'INV-2026-0003',
      clinicId: 'clinic-shafa',
      clinicName: 'درمانگاه شبانه‌روزی شفا',
      subscriptionId: 'sub-shafa-1',
      amount: 800000000,
      status: 'paid',
      periodStart: '2026-01-01T00:00:00.000Z',
      periodEnd: '2027-01-01T00:00:00.000Z',
      dueDate: '2026-01-08T00:00:00.000Z',
      paidAt: '2026-01-02T11:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  private payments: Payment[] = [
    {
      id: 'pay-2001',
      invoiceId: 'inv-1001',
      clinicId: 'clinic-ariana',
      amount: 35000000,
      status: 'succeeded',
      method: 'manual',
      gatewayRef: 'MANUAL-REF-1001',
      idempotencyKey: 'idem-1001',
      recordedBy: 'ادمین پلتفرم',
      createdAt: '2026-10-02T14:20:00.000Z',
    },
    {
      id: 'pay-2002',
      invoiceId: 'inv-1003',
      clinicId: 'clinic-shafa',
      amount: 800000000,
      status: 'succeeded',
      method: 'gateway',
      gatewayRef: 'ZARIN-987654321',
      idempotencyKey: 'idem-1003',
      recordedBy: 'system',
      createdAt: '2026-01-02T11:00:00.000Z',
    },
  ];

  // Plans
  async getPlans(includeInactive = false): Promise<Plan[]> {
    return this.plans.filter((p) => includeInactive || p.isActive);
  }

  async getPlan(id: string): Promise<Plan> {
    const plan = this.plans.find((p) => p.id === id);
    if (!plan) throw new Error('پلن مورد نظر یافت نشد');
    return plan;
  }

  async createPlan(dto: CreatePlanDto): Promise<Plan> {
    const newPlan: Plan = {
      id: `plan-${Date.now()}`,
      code: dto.code,
      name: dto.name,
      description: dto.description,
      priceMonthly: dto.priceMonthly,
      priceYearly: dto.priceYearly,
      maxDoctors: dto.maxDoctors,
      maxMonthlyAppointments: dto.maxMonthlyAppointments,
      monthlySmsQuota: dto.monthlySmsQuota,
      isActive: true,
      sortOrder: dto.sortOrder || this.plans.length + 1,
      createdAt: new Date().toISOString(),
    };
    this.plans.push(newPlan);
    return newPlan;
  }

  async updatePlan(id: string, dto: UpdatePlanDto): Promise<Plan> {
    const index = this.plans.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('پلن مورد نظر یافت نشد');
    const updated = { ...this.plans[index], ...dto };
    this.plans[index] = updated;
    return updated;
  }

  async deactivatePlan(id: string): Promise<Plan> {
    return this.updatePlan(id, { isActive: false });
  }

  // Clinic Subscriptions
  async getClinicSubscription(clinicId: string): Promise<ClinicSubscriptionUsage> {
    let sub = this.subscriptions.get(clinicId);
    const standardPlan = this.plans[1];
    if (!sub) {
      sub = {
        id: `sub-${clinicId}`,
        clinicId,
        planId: standardPlan.id,
        billingCycle: 'monthly',
        status: 'active',
        startsAt: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
        trialEndsAt: null,
        graceEndsAt: null,
        autoRenew: true,
        priceAtSubscription: standardPlan.priceMonthly,
      };
      this.subscriptions.set(clinicId, sub);
    }

    const plan = this.plans.find((p) => p.id === sub?.planId) || standardPlan;
    const doctorsCount = clinicId === 'clinic-ariana' ? 4 : 2;
    const monthlyAppointmentsCount = clinicId === 'clinic-ariana' ? 142 : 45;
    const monthlySmsCount = clinicId === 'clinic-ariana' ? 320 : 80;

    return {
      subscription: sub,
      plan,
      usage: {
        doctorsCount,
        maxDoctors: plan.maxDoctors,
        doctorsPercentage: plan.maxDoctors > 0 ? Math.round((doctorsCount / plan.maxDoctors) * 100) : 0,
        monthlyAppointmentsCount,
        maxMonthlyAppointments: plan.maxMonthlyAppointments,
        appointmentsPercentage: plan.maxMonthlyAppointments > 0 ? Math.round((monthlyAppointmentsCount / plan.maxMonthlyAppointments) * 100) : 0,
        monthlySmsCount,
        monthlySmsQuota: plan.monthlySmsQuota,
        smsPercentage: plan.monthlySmsQuota > 0 ? Math.round((monthlySmsCount / plan.monthlySmsQuota) * 100) : 0,
      },
      daysRemaining: 18,
    };
  }

  async changeClinicPlan(clinicId: string, dto: ChangePlanDto): Promise<{ subscription: Subscription }> {
    const plan = await this.getPlan(dto.planId);
    const current = (await this.getClinicSubscription(clinicId)).subscription!;
    const updated: Subscription = {
      ...current,
      planId: plan.id,
      billingCycle: dto.billingCycle,
      priceAtSubscription: dto.billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly,
    };
    this.subscriptions.set(clinicId, updated);
    return { subscription: updated };
  }

  async extendClinicSubscription(clinicId: string, dto: ExtendSubscriptionDto): Promise<{ subscription: Subscription }> {
    const current = (await this.getClinicSubscription(clinicId)).subscription!;
    const currentEnd = current.currentPeriodEnd ? new Date(current.currentPeriodEnd).getTime() : Date.now();
    const newEnd = new Date(currentEnd + dto.days * 86400000).toISOString();
    const updated: Subscription = {
      ...current,
      currentPeriodEnd: newEnd,
      status: 'active',
    };
    this.subscriptions.set(clinicId, updated);
    return { subscription: updated };
  }

  async extendClinicTrial(clinicId: string, dto: ExtendSubscriptionDto): Promise<{ subscription: Subscription }> {
    const current = (await this.getClinicSubscription(clinicId)).subscription!;
    const base = current.trialEndsAt ? new Date(current.trialEndsAt).getTime() : Date.now();
    const newTrial = new Date(base + dto.days * 86400000).toISOString();
    const updated: Subscription = {
      ...current,
      status: 'trial',
      trialEndsAt: newTrial,
    };
    this.subscriptions.set(clinicId, updated);
    return { subscription: updated };
  }

  async cancelClinicSubscription(clinicId: string): Promise<{ subscription: Subscription }> {
    const current = (await this.getClinicSubscription(clinicId)).subscription!;
    const updated: Subscription = {
      ...current,
      autoRenew: false,
    };
    this.subscriptions.set(clinicId, updated);
    return { subscription: updated };
  }

  // Invoices & Payments
  async getInvoices(params?: {
    clinicId?: string;
    status?: InvoiceStatus;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Invoice[]; total: number; page: number; limit: number }> {
    let filtered = [...this.invoices];
    if (params?.clinicId) {
      filtered = filtered.filter((i) => i.clinicId === params.clinicId);
    }
    if (params?.status) {
      filtered = filtered.filter((i) => i.status === params.status);
    }
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);
    return { items, total: filtered.length, page, limit };
  }

  async getInvoice(id: string): Promise<Invoice & { payments?: Payment[] }> {
    const inv = this.invoices.find((i) => i.id === id);
    if (!inv) throw new Error('فاکتور یافت نشد');
    const payments = this.payments.filter((p) => p.invoiceId === id);
    return { ...inv, payments };
  }

  async recordManualPayment(dto: RecordManualPaymentDto): Promise<{ payment: Payment; invoice: Invoice; subscription: Subscription }> {
    const invoice = this.invoices.find((i) => i.id === dto.invoiceId);
    if (!invoice) throw new Error('فاکتور یافت نشد');
    if (invoice.status === 'paid') {
      const err: any = new Error('این فاکتور قبلاً پرداخت شده است');
      err.response = { status: 409, data: { message: 'INVOICE_ALREADY_PAID' } };
      throw err;
    }
    if (invoice.status === 'void') {
      const err: any = new Error('امکان پرداخت فاکتور باطل‌شده وجود ندارد');
      err.response = { status: 409, data: { message: 'INVOICE_VOID' } };
      throw err;
    }
    if (Number(dto.amount) !== Number(invoice.amount)) {
      const err: any = new Error('مبلغ واریزی با مبلغ فاکتور یکسان نیست');
      err.response = { status: 400, data: { message: 'PAYMENT_AMOUNT_MISMATCH' } };
      throw err;
    }

    // Check duplicate idempotency
    if (dto.idempotencyKey) {
      const dup = this.payments.find((p) => p.idempotencyKey === dto.idempotencyKey);
      if (dup) {
        return {
          payment: dup,
          invoice,
          subscription: (await this.getClinicSubscription(invoice.clinicId)).subscription!,
        };
      }
    }

    const payment: Payment = {
      id: `pay-${Date.now()}`,
      invoiceId: invoice.id,
      clinicId: invoice.clinicId,
      amount: invoice.amount,
      status: 'succeeded',
      method: 'manual',
      gatewayRef: `MANUAL-${Date.now()}`,
      idempotencyKey: dto.idempotencyKey || null,
      recordedBy: 'ادمین پلتفرم',
      createdAt: new Date().toISOString(),
    };

    invoice.status = 'paid';
    invoice.paidAt = payment.createdAt;
    this.payments.push(payment);

    // Update subscription periodEnd
    const sub = (await this.getClinicSubscription(invoice.clinicId)).subscription!;
    const currentEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).getTime() : Date.now();
    const cycleDays = sub.billingCycle === 'yearly' ? 365 : 30;
    sub.currentPeriodEnd = new Date(currentEnd + cycleDays * 86400000).toISOString();
    sub.status = 'active';
    this.subscriptions.set(invoice.clinicId, sub);

    return { payment, invoice, subscription: sub };
  }

  async voidInvoice(id: string, _dto: VoidInvoiceDto): Promise<Invoice> {
    const invoice = this.invoices.find((i) => i.id === id);
    if (!invoice) throw new Error('فاکتور یافت نشد');
    if (invoice.status === 'paid') {
      const err: any = new Error('فاکتور پرداخت‌شده قابل ابطال نیست');
      err.response = { status: 409, data: { message: 'PAID_INVOICE_CANNOT_BE_VOIDED' } };
      throw err;
    }
    invoice.status = 'void';
    return invoice;
  }

  async getPayments(params?: {
    clinicId?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Payment[]; total: number; page: number; limit: number }> {
    let filtered = [...this.payments];
    if (params?.clinicId) {
      filtered = filtered.filter((p) => p.clinicId === params.clinicId);
    }
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    return { items: filtered.slice(start, start + limit), total: filtered.length, page, limit };
  }

  // Revenue Dashboard
  async getRevenueSummary(): Promise<RevenueSummary> {
    return {
      mrr: 101666667,
      totalRevenue: 835000000,
      previousRevenue: 650000000,
      growthRate: 28.46,
      subscriptionsCount: {
        trial: 0,
        active: 2,
        past_due: 0,
        expired: 0,
        canceled: 0,
        total: 2,
      },
      overdueInvoices: {
        count: 1,
        totalAmount: 35000000,
      },
      expiringIn14DaysCount: 1,
      estimatedClinicRevenue: 1220000000,
    };
  }

  async getRevenueTimeseries(): Promise<RevenueTimeseriesPoint[]> {
    return [
      { date: '2026-05-01', amount: 70000000, count: 2 },
      { date: '2026-06-01', amount: 105000000, count: 3 },
      { date: '2026-07-01', amount: 140000000, count: 4 },
      { date: '2026-08-01', amount: 210000000, count: 5 },
      { date: '2026-09-01', amount: 350000000, count: 7 },
      { date: '2026-10-01', amount: 835000000, count: 12 },
    ];
  }

  async getRevenueByClinic(): Promise<{ items: RevenueByClinicItem[]; total: number; page: number; limit: number }> {
    const items: RevenueByClinicItem[] = [
      {
        clinicId: 'clinic-shafa',
        clinicName: 'درمانگاه شبانه‌روزی شفا',
        clinicSlug: 'shafa',
        totalPaid: 800000000,
        paymentCount: 1,
      },
      {
        clinicId: 'clinic-ariana',
        clinicName: 'کلینیک تخصصی پوست و زیبایی آریانا',
        clinicSlug: 'ariana',
        totalPaid: 35000000,
        paymentCount: 1,
      },
    ];
    return { items, total: items.length, page: 1, limit: 20 };
  }

  async getRevenueByPlan(): Promise<{ items: RevenueByPlanItem[]; total: number; page: number; limit: number }> {
    const items: RevenueByPlanItem[] = [
      {
        planId: 'plan-pro',
        planCode: 'pro',
        planName: 'حرفه‌ای (پرو)',
        totalPaid: 800000000,
        paymentCount: 1,
      },
      {
        planId: 'plan-standard',
        planCode: 'standard',
        planName: 'استاندارد',
        totalPaid: 35000000,
        paymentCount: 1,
      },
    ];
    return { items, total: items.length, page: 1, limit: 20 };
  }

  getInvoicesExportUrl(params?: { clinicId?: string; status?: string; from?: string; to?: string }): string {
    const query = new URLSearchParams();
    if (params?.clinicId) query.set('clinicId', params.clinicId);
    if (params?.status) query.set('status', params.status);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    return `/api/platform/invoices/export?${query.toString()}`;
  }

  getPaymentsExportUrl(params?: { clinicId?: string; status?: string; from?: string; to?: string }): string {
    const query = new URLSearchParams();
    if (params?.clinicId) query.set('clinicId', params.clinicId);
    if (params?.status) query.set('status', params.status);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    return `/api/platform/payments/export?${query.toString()}`;
  }
}
