# راهنمای اتصال سرویس‌های خارجی (Integrations Guide)

سامانه مدفلو بر پایه‌ی الگوی **معماری پورت‌ها و آداپتورها (Hexagonal Architecture)** طراحی شده است.
این ساختار به شما اجازه می‌دهد ارائه‌دهندگان سرویس‌های جانبی (مانند پیامک، واتساپ و درگاه پرداخت) را بدون هیچ‌گونه تغییری در کامپوننت‌های فرانت‌اند یا منطق دامنه‌ی کسب‌وکار تعویض کنید.

---

## ۱. ساختار پورت‌ها (Interfaces)

تمامی پورت‌ها در پوشه‌ی `src/integrations/` تعریف شده‌اند:

1. **پورت پیامک (`SmsProvider.ts`):**
   ```typescript
   export interface SmsProvider {
     id: string;
     name: string;
     send(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
     sendPattern(to: string, patternCode: string, tokens: Record<string, string>): Promise<{ success: boolean; messageId?: string }>;
     checkStatus(): Promise<IntegrationConnectionStatus>;
   }
   ```

2. **پورت واتساپ (`WhatsAppProvider.ts`):**
   ```typescript
   export interface WhatsAppProvider {
     id: string;
     name: string;
     sendMessage(to: string, text: string): Promise<{ success: boolean; messageId?: string }>;
     sendTemplate(to: string, templateName: string, params: Record<string, string>): Promise<{ success: boolean }>;
     checkStatus(): Promise<IntegrationConnectionStatus>;
   }
   ```

3. **پورت پرداخت آنلاین (`PaymentProvider.ts`):**
   ```typescript
   export interface PaymentProvider {
     id: string;
     name: string;
     requestPayment(params: PaymentRequestParams): Promise<PaymentRequestResult>;
     verifyPayment(authority: string, amount: number): Promise<PaymentVerificationResult>;
     checkStatus(): Promise<IntegrationConnectionStatus>;
   }
   ```

---

## ۲. پیاده‌سازی ارائه‌دهنده‌ی واقعی (Real Provider Implementation)

### ۲.۱. نمونه پیاده‌سازی کاوه‌نگار (KavenegarSmsProvider)

یک فایل جدید در مسیر `src/integrations/providers/KavenegarSmsProvider.ts` بسازید:

```typescript
import type { SmsProvider } from '../SmsProvider';
import type { IntegrationConnectionStatus } from '../../domain/integration';

export class KavenegarSmsProvider implements SmsProvider {
  id = 'kavenegar';
  name = 'کاوه‌نگار';

  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(to: string, message: string) {
    const res = await fetch(`https://api.kavenegar.com/v1/${this.apiKey}/sms/send.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ receptor: to, message }),
    });
    const data = await res.json();
    return {
      success: res.ok && data.return?.status === 200,
      messageId: String(data.entries?.[0]?.messageid || ''),
    };
  }

  async sendPattern(to: string, patternCode: string, tokens: Record<string, string>) {
    // پیاده‌سازی متد verify/lookup برای پیامک‌های خدماتی و اعتبارسنجی
    const params = new URLSearchParams({ receptor: to, template: patternCode, ...tokens });
    const res = await fetch(`https://api.kavenegar.com/v1/${this.apiKey}/verify/lookup.json`, {
      method: 'POST',
      body: params,
    });
    return { success: res.ok };
  }

  async checkStatus(): Promise<IntegrationConnectionStatus> {
    return this.apiKey ? 'connected' : 'disconnected';
  }
}
```

### ۲.۲. نمونه پیاده‌سازی زرین‌پال (ZarinPalPaymentProvider)

یک فایل در `src/integrations/providers/ZarinPalPaymentProvider.ts` بسازید:

```typescript
import type { PaymentProvider, PaymentRequestParams, PaymentRequestResult, PaymentVerificationResult } from '../PaymentProvider';
import type { IntegrationConnectionStatus } from '../../domain/integration';

export class ZarinPalPaymentProvider implements PaymentProvider {
  id = 'zarinpal';
  name = 'زرین‌پال';

  private merchantId: string;
  private isSandbox: boolean;

  constructor(merchantId: string, isSandbox = false) {
    this.merchantId = merchantId;
    this.isSandbox = isSandbox;
  }

  private get baseUrl() {
    return this.isSandbox ? 'https://sandbox.zarinpal.com/pg/v4/payment' : 'https://api.zarinpal.com/pg/v4/payment';
  }

  async requestPayment(params: PaymentRequestParams): Promise<PaymentRequestResult> {
    const res = await fetch(`${this.baseUrl}/request.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: this.merchantId,
        amount: params.amount,
        callback_url: params.callbackUrl,
        description: params.description,
        metadata: { mobile: params.clientPhone },
      }),
    });
    const data = await res.json();

    if (data.data && data.data.code === 100) {
      const authority = data.data.authority;
      const paymentUrl = this.isSandbox
        ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
        : `https://www.zarinpal.com/pg/StartPay/${authority}`;
      return { success: true, authority, paymentUrl };
    }

    return { success: false, error: 'خطا در اتصال به درگاه پرداخت' };
  }

  async verifyPayment(authority: string, amount: number): Promise<PaymentVerificationResult> {
    const res = await fetch(`${this.baseUrl}/verify.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: this.merchantId,
        amount,
        authority,
      }),
    });
    const data = await res.json();
    return {
      success: data.data?.code === 100,
      trackingCode: String(data.data?.ref_id || ''),
    };
  }

  async checkStatus(): Promise<IntegrationConnectionStatus> {
    return this.merchantId ? 'connected' : 'disconnected';
  }
}
```

---

## ۳. ثبت پروایدر در رجیستری مرکزی (`src/integrations/registry.ts`)

در فایل `src/integrations/registry.ts` بر اساس مقدار متغیرهای محیطی (`env.smsProvider` و `env.paymentProvider`)، نمونه‌ی واقعی جایگزین ماک می‌شود:

```typescript
import { env } from '../config/env';
import { KavenegarSmsProvider } from './providers/KavenegarSmsProvider';
import { ZarinPalPaymentProvider } from './providers/ZarinPalPaymentProvider';
import { MockSmsProvider } from './MockSmsProvider';
import { MockPaymentProvider } from './MockPaymentProvider';

export function createProviders() {
  const sms = env.smsProvider === 'kavenegar' && env.smsApiKey
    ? new KavenegarSmsProvider(env.smsApiKey)
    : new MockSmsProvider();

  const payment = env.paymentProvider === 'zarinpal' && env.paymentMerchantId
    ? new ZarinPalPaymentProvider(env.paymentMerchantId)
    : new MockPaymentProvider();

  return { sms, payment };
}
```

---

## ۴. پیکربندی متغیرهای محیطی (`.env`)

برای سوییچ به ارائه‌دهندگان واقعی، کافی است متغیرهای زیر در `.env` مقداردهی شوند:

```env
# انتخاب حالت اتصال سرویس‌ها
VITE_SMS_PROVIDER=kavenegar
VITE_SMS_API_KEY=your_kavenegar_api_key_here

VITE_PAYMENT_PROVIDER=zarinpal
VITE_PAYMENT_MERCHANT_ID=your_merchant_id_uuid
```

---

## ۵. مشاهده وضعیت اتصال در واسط کاربری (UI)

- کامپوننت `SidebarServiceStatusCard.tsx` واقع در پایین سایدبار پنل مدیریت، متد `integrationRegistry.getStatusSummary()` را فراخوانی می‌کند.
- اگر هر سرویس متصل باشد نشان سبز و متن «سرویس فعال است» و اگر متصل نباشد نشان خاکستری و متن «پیامک هنوز متصل نیست» را نشان می‌دهد.
- صفحه‌ی «تنظیمات» (`/settings`) امکان مشاهده‌ی تفصیلی وضعیت هر پورت و تست زنده اتصال را فراهم می‌سازد.
