export interface AppEnv {
  dataSource: 'mock' | 'http';
  apiBaseUrl: string;
  smsProvider: string;
  paymentProvider: string;
  captchaProvider: string;
  turnstileSiteKey?: string;
  defaultClinicSlug: string;
}

export const env: AppEnv = {
  dataSource: (import.meta.env.VITE_DATA_SOURCE as 'mock' | 'http') || 'mock',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.medflow.internal/v1',
  smsProvider: import.meta.env.VITE_SMS_PROVIDER || 'mock',
  paymentProvider: import.meta.env.VITE_PAYMENT_PROVIDER || 'mock',
  captchaProvider: import.meta.env.VITE_CAPTCHA_PROVIDER || 'mock',
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '',
  defaultClinicSlug: 'ariana',
};
