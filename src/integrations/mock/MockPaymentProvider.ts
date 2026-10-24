import type { PaymentProvider, CreateInvoiceResult } from '../ports/PaymentProvider';

export class MockPaymentProvider implements PaymentProvider {
  name = 'زرین‌پال (درگاه پرداخت آنلاین)';

  async createInvoice(_amount: number, _description: string, _callbackUrl: string): Promise<CreateInvoiceResult> {
    await new Promise((r) => setTimeout(r, 100));
    const invoiceId = `inv-${Date.now()}`;
    return {
      success: true,
      invoiceId,
      paymentUrl: `https://mock-payment.zarinpal.com/pg/StartPay/${invoiceId}`,
    };
  }

  async verifyPayment(_invoiceId: string, _authority: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 80));
    return true;
  }

  async checkHealth(): Promise<boolean> {
    return true;
  }
}
