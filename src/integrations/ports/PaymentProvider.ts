export interface CreateInvoiceResult {
  success: boolean;
  invoiceId: string;
  paymentUrl: string;
  error?: string;
}

export interface PaymentProvider {
  name: string;
  createInvoice(amount: number, description: string, callbackUrl: string): Promise<CreateInvoiceResult>;
  verifyPayment(invoiceId: string, authority: string): Promise<boolean>;
  checkHealth(): Promise<boolean>;
}
