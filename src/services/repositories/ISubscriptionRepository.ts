import type { ClinicSubscriptionUsage, Invoice } from '../../types/platform/billing';

export interface ISubscriptionRepository {
  getMySubscription(): Promise<ClinicSubscriptionUsage>;
  getMyInvoices(params?: { page?: number; limit?: number }): Promise<{ items: Invoice[]; total: number; page: number; limit: number }>;
  getMyInvoice(id: string): Promise<Invoice>;
}
