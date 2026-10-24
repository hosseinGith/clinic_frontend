import { httpClient } from '../../api/httpClient';
import type { ISubscriptionRepository } from '../../repositories/ISubscriptionRepository';
import type { ClinicSubscriptionUsage, Invoice } from '../../../types/platform/billing';

export class HttpSubscriptionRepository implements ISubscriptionRepository {
  async getMySubscription(): Promise<ClinicSubscriptionUsage> {
    return httpClient.get<ClinicSubscriptionUsage>('/subscription/me');
  }

  async getMyInvoices(params?: { page?: number; limit?: number }): Promise<{ items: Invoice[]; total: number; page: number; limit: number }> {
    return httpClient.get('/billing/invoices', {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async getMyInvoice(id: string): Promise<Invoice> {
    return httpClient.get(`/billing/invoices/${id}`);
  }
}
