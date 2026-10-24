import { platformClient } from '../../api/platformClient';
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

export class HttpPlatformBillingRepository implements IPlatformBillingRepository {
  // Plans
  async getPlans(includeInactive?: boolean): Promise<Plan[]> {
    return platformClient.get<Plan[]>('/plans', {
      params: includeInactive ? { includeInactive: true } : undefined,
    });
  }

  async getPlan(id: string): Promise<Plan> {
    return platformClient.get<Plan>(`/plans/${id}`);
  }

  async createPlan(dto: CreatePlanDto): Promise<Plan> {
    return platformClient.post<Plan>('/plans', dto);
  }

  async updatePlan(id: string, dto: UpdatePlanDto): Promise<Plan> {
    return platformClient.patch<Plan>(`/plans/${id}`, dto);
  }

  async deactivatePlan(id: string): Promise<Plan> {
    return platformClient.patch<Plan>(`/plans/${id}/deactivate`, {});
  }

  // Clinic Subscription
  async getClinicSubscription(clinicId: string): Promise<ClinicSubscriptionUsage> {
    const res = await platformClient.get<any>(`/clinics/${clinicId}/subscription`);
    const current = res.subscription || res.current || null;
    const plan = res.plan || current?.plan || null;
    const daysRemaining = res.daysRemaining ?? current?.daysRemaining ?? 0;
    const rawUsage = res.usage;

    return {
      subscription: current,
      plan,
      daysRemaining,
      usage: {
        doctorsCount: rawUsage?.doctorsCount ?? 0,
        maxDoctors: rawUsage?.maxDoctors ?? plan?.maxDoctors ?? 0,
        doctorsPercentage: rawUsage?.doctorsPercentage ?? 0,
        monthlyAppointmentsCount: rawUsage?.monthlyAppointmentsCount ?? 0,
        maxMonthlyAppointments: rawUsage?.maxMonthlyAppointments ?? plan?.maxMonthlyAppointments ?? 0,
        appointmentsPercentage: rawUsage?.appointmentsPercentage ?? 0,
        monthlySmsCount: rawUsage?.monthlySmsCount ?? 0,
        monthlySmsQuota: rawUsage?.monthlySmsQuota ?? plan?.monthlySmsQuota ?? 0,
        smsPercentage: rawUsage?.smsPercentage ?? 0,
      },
    };
  }

  async changeClinicPlan(clinicId: string, dto: ChangePlanDto): Promise<{ subscription: Subscription }> {
    return platformClient.post<{ subscription: Subscription }>(`/clinics/${clinicId}/subscription/change-plan`, dto);
  }

  async extendClinicSubscription(clinicId: string, dto: ExtendSubscriptionDto): Promise<{ subscription: Subscription }> {
    return platformClient.post<{ subscription: Subscription }>(`/clinics/${clinicId}/subscription/extend`, dto);
  }

  async extendClinicTrial(clinicId: string, dto: ExtendSubscriptionDto): Promise<{ subscription: Subscription }> {
    return platformClient.post<{ subscription: Subscription }>(`/clinics/${clinicId}/subscription/extend-trial`, dto);
  }

  async cancelClinicSubscription(clinicId: string): Promise<{ subscription: Subscription }> {
    return platformClient.post<{ subscription: Subscription }>(`/clinics/${clinicId}/subscription/cancel`, {});
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
    return platformClient.get('/invoices', {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async getInvoice(id: string): Promise<Invoice & { payments?: Payment[] }> {
    return platformClient.get(`/invoices/${id}`);
  }

  async recordManualPayment(dto: RecordManualPaymentDto): Promise<{ payment: Payment; invoice: Invoice; subscription: Subscription }> {
    return platformClient.post('/invoices/manual-payment', dto);
  }

  async voidInvoice(id: string, dto: VoidInvoiceDto): Promise<Invoice> {
    return platformClient.post(`/invoices/${id}/void`, dto);
  }

  async getPayments(params?: {
    clinicId?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Payment[]; total: number; page: number; limit: number }> {
    return platformClient.get('/payments', {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  // Revenue Dashboard
  async getRevenueSummary(params?: { from?: string; to?: string }): Promise<RevenueSummary> {
    return platformClient.get('/revenue/summary', {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async getRevenueTimeseries(params?: { from?: string; to?: string; interval?: 'day' | 'month' }): Promise<RevenueTimeseriesPoint[]> {
    return platformClient.get('/revenue/timeseries', {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async getRevenueByClinic(params?: { page?: number; limit?: number }): Promise<{ items: RevenueByClinicItem[]; total: number; page: number; limit: number }> {
    return platformClient.get('/revenue/by-clinic', {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async getRevenueByPlan(params?: { page?: number; limit?: number }): Promise<{ items: RevenueByPlanItem[]; total: number; page: number; limit: number }> {
    return platformClient.get('/revenue/by-plan', {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  getInvoicesExportUrl(params?: { clinicId?: string; status?: string; from?: string; to?: string }): string {
    const q = new URLSearchParams();
    if (params?.clinicId) q.append('clinicId', params.clinicId);
    if (params?.status) q.append('status', params.status);
    if (params?.from) q.append('from', params.from);
    if (params?.to) q.append('to', params.to);
    return `/api/v1/platform/revenue/export/invoices-csv?${q.toString()}`;
  }

  getPaymentsExportUrl(params?: { clinicId?: string; status?: string; from?: string; to?: string }): string {
    const q = new URLSearchParams();
    if (params?.clinicId) q.append('clinicId', params.clinicId);
    if (params?.status) q.append('status', params.status);
    if (params?.from) q.append('from', params.from);
    if (params?.to) q.append('to', params.to);
    return `/api/v1/platform/revenue/export/payments-csv?${q.toString()}`;
  }
}
