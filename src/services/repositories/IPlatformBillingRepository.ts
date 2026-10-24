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
  BillingCycle,
  InvoiceStatus,
} from '../../types/platform/billing';

export interface CreatePlanDto {
  code: string;
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  maxDoctors: number;
  maxMonthlyAppointments: number;
  monthlySmsQuota: number;
  sortOrder?: number;
}

export interface UpdatePlanDto {
  name?: string;
  description?: string;
  priceMonthly?: number;
  priceYearly?: number;
  maxDoctors?: number;
  maxMonthlyAppointments?: number;
  monthlySmsQuota?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ChangePlanDto {
  planId: string;
  billingCycle: BillingCycle;
}

export interface ExtendSubscriptionDto {
  days: number;
}

export interface RecordManualPaymentDto {
  invoiceId: string;
  amount: number;
  idempotencyKey?: string;
  notes?: string;
}

export interface VoidInvoiceDto {
  reason: string;
}

export interface IPlatformBillingRepository {
  // Plans
  getPlans(includeInactive?: boolean): Promise<Plan[]>;
  getPlan(id: string): Promise<Plan>;
  createPlan(dto: CreatePlanDto): Promise<Plan>;
  updatePlan(id: string, dto: UpdatePlanDto): Promise<Plan>;
  deactivatePlan(id: string): Promise<Plan>;

  // Clinic Subscription management
  getClinicSubscription(clinicId: string): Promise<ClinicSubscriptionUsage>;
  changeClinicPlan(clinicId: string, dto: ChangePlanDto): Promise<{ subscription: Subscription }>;
  extendClinicSubscription(clinicId: string, dto: ExtendSubscriptionDto): Promise<{ subscription: Subscription }>;
  extendClinicTrial(clinicId: string, dto: ExtendSubscriptionDto): Promise<{ subscription: Subscription }>;
  cancelClinicSubscription(clinicId: string): Promise<{ subscription: Subscription }>;

  // Invoices & Payments
  getInvoices(params?: {
    clinicId?: string;
    status?: InvoiceStatus;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Invoice[]; total: number; page: number; limit: number }>;

  getInvoice(id: string): Promise<Invoice & { payments?: Payment[] }>;
  recordManualPayment(dto: RecordManualPaymentDto): Promise<{ payment: Payment; invoice: Invoice; subscription: Subscription }>;
  voidInvoice(id: string, dto: VoidInvoiceDto): Promise<Invoice>;

  getPayments(params?: {
    clinicId?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Payment[]; total: number; page: number; limit: number }>;

  // Revenue Dashboard
  getRevenueSummary(params?: { from?: string; to?: string }): Promise<RevenueSummary>;
  getRevenueTimeseries(params?: { from?: string; to?: string; interval?: 'day' | 'month' }): Promise<RevenueTimeseriesPoint[]>;
  getRevenueByClinic(params?: { page?: number; limit?: number }): Promise<{ items: RevenueByClinicItem[]; total: number; page: number; limit: number }>;
  getRevenueByPlan(params?: { page?: number; limit?: number }): Promise<{ items: RevenueByPlanItem[]; total: number; page: number; limit: number }>;
  getInvoicesExportUrl(params?: { clinicId?: string; status?: string; from?: string; to?: string }): string;
  getPaymentsExportUrl(params?: { clinicId?: string; status?: string; from?: string; to?: string }): string;
}
