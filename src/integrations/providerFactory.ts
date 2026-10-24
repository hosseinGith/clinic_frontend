import type { SmsProvider } from './ports/SmsProvider';
import type { PaymentProvider } from './ports/PaymentProvider';
import type { WhatsAppProvider } from './ports/WhatsAppProvider';
import { MockSmsProvider } from './mock/MockSmsProvider';
import { MockPaymentProvider } from './mock/MockPaymentProvider';
import { MockWhatsAppProvider } from './mock/MockWhatsAppProvider';
import { env } from '../config/env';

export const createSmsProvider = (_type: string = env.smsProvider): SmsProvider => {
  return new MockSmsProvider();
};

export const createPaymentProvider = (_type: string = env.paymentProvider): PaymentProvider => {
  return new MockPaymentProvider();
};

export const createWhatsAppProvider = (): WhatsAppProvider => {
  return new MockWhatsAppProvider();
};
