# سند جامع معماری سامانه MedFlow (Frontend Architecture & Security)

این سند تشریح‌کننده ساختار مهندسی، الگوهای طراحی، مدل داده، جریان اطلاعات، نحوه سوئیچ بین حالت‌های داده (Mock/HTTP) و الزامات امنیتی فرانت‌اند سامانه **MedFlow** است.

---

## ۱. اصول کلی و معماری شش‌ضلعی (Hexagonal Architecture / Ports & Adapters)

سامانه MedFlow بر اساس اصول معماری پیاز / شش‌ضلعی طراحی شده است. هسته مرکزی دامنه (`domain/`) بدون هیچ‌گونه وابستگی به React یا ابزارهای رندر خارجی پیاده‌سازی شده و از طریق **بنادر (Ports / Interfaces)** با دنیای خارج سخن می‌گوید.

```
┌─────────────────────────────────────────────────────────────┐
│                       UI / Presentation                     │
│           (React 18, React Router v6, Tailwind CSS)         │
├─────────────────────────────────────────────────────────────┤
│                     Application / Hooks                     │
│                (TanStack Query, Context Hooks)              │
├─────────────────────────────────────────────────────────────┤
│                      Repository Ports                       │
│        (IAppointmentRepository, IAuthRepository, ...)       │
├──────────────────────────────┬──────────────────────────────┤
│       Mock Adapters          │        HTTP Adapters         │
│   (LocalStorage + Seeds)     │   (httpClient + REST API)    │
├──────────────────────────────┴──────────────────────────────┤
│                         Core Domain                         │
│     (Appointment, AppointmentStatus, Client, Lead, ...)     │
└─────────────────────────────────────────────────────────────┘
```

---

## ۲. جریان یک‌طرفه داده‌ها (Unidirectional Data Flow)

دسترسی و جهش داده‌ها در سامانه همواره در یک جهت معین انجام می‌شود:

```
UI Component (View / Modal)
       │
       ▼
React Hook (useAppointments, useCreateAppointment Mutation)
       │
       ▼
Repository Interface (IAppointmentRepository)
       │
       ▼
Concrete Adapter (MockAppointmentRepository یا HttpAppointmentRepository)
       │
       ▼
Data Layer (Browser LocalStorage یا REST API Server)
```

هیچ کامپوننت رابط کاربری حق ندارد مستقیماً توابع `fetch`، `httpClient` یا `localStorage` را فراخوانی کند.

---

## ۳. جابه‌جایی میان حالت آزمایشی و بک‌اند واقعی (Mock to HTTP Switching)

سوئیچینگ میان دیتای Mock محلی و API سرور از طریق متغیر محیطی زیر در فایل `.env` صورت می‌گیرد:

```env
# انتخاب منبع داده: 'mock' یا 'http'
VITE_DATA_SOURCE=mock

# آدرس پایه وب‌سرویس بک‌اند (هنگام VITE_DATA_SOURCE=http)
VITE_API_BASE_URL=https://api.medflow.ir/v1
```

### نحوه کار فکتوری (`src/services/index.ts`):
در لایه سرویس‌ها، فکتوری `createRepositories` مقدار `env.dataSource` را بررسی کرده و نمونه‌های مربوطه را ایجاد می‌کند:
```typescript
export const createRepositories = (mode: 'mock' | 'http' = env.dataSource) => {
  if (mode === 'http') {
    return {
      appointments: new HttpAppointmentRepository(),
      auth: new HttpAuthRepository(),
      clients: new HttpClientRepository(),
      leads: new HttpLeadRepository(),
      catalog: new HttpCatalogRepository(),
      automations: new HttpAutomationRepository(),
      dashboard: new HttpDashboardRepository(),
      booking: new HttpBookingRepository(),
      messages: new HttpMessageRepository(),
      audit: new HttpAuditRepository(),
    };
  }
  return {
    appointments: new MockAppointmentRepository(),
    auth: new MockAuthRepository(),
    // ... سایر آداپتورهای موک با LocalStorage
  };
};
```
بدین ترتیب، هیچ تغییری در هیچ‌یک از کدهای کامپوننت‌ها یا هوک‌های UI لازم نیست.

---

## ۴. استانداردهای تبدیل داده شبکه (DTO Mappers)

- **JSON on the wire:** کلیه درخواست‌ها و پاسخ‌های رد و بدل شده در بستر HTTP از شیوه نگارش `snake_case` استفاده می‌کنند.
- **TypeScript Domain:** کلیه مدل‌های فرانت‌اند و کانتکست‌ها از `camelCase` بهره می‌برند.
- فایل `src/services/adapters/http/mappers.ts` وظیفه تبدیل دوطرفه را بر عهده دارد:
  - `toAppointmentCreateDto`: تبدیل ورودی کاربر به فیلدهای `snake_case` برای ارسال به بک‌اند.
  - `mapAppointmentDtoToDomain`: تبدیل پاسخ سرور به اینترفیس تمیز دامنه.

---

## ۵. الزامات امنیتی و مدل تهدید (Security Architecture & Threat Model)

### ۵.۱. محدودیت‌های امنیتی باندل فرانت‌اند (Client-side Bundle Limitations)
> [!CAUTION]
> کدهای فرانت‌اند و فایل‌های استاتیک در نهایت بر روی مرورگر کاربر دانلود و اجرا می‌شوند. بنابراین:
> 1. **عدم قرارگیری اسرار در کلاینت:** هیچ کلید محرمانه (مانند JWT Secret، کلید خصوصی درگاه پرداخت، Master API Key پیامک یا گواهینامه‌های دیتابیس) نباید در کدهای فرانت‌اند یا متغیرهای `VITE_*` قرار گیرد.
> 2. **گاردهای رابط کاربری صرفاً برای ارگونومی و UX هستند:** کامپوننت‌های `<RequireRole>`، `<RequirePermission>` یا مخفی‌سازی دکمه‌ها و منوها در فرانت‌اند هیچ‌گونه امنیت تضمین‌شده‌ای در برابر کاربر مهاجم ایجاد نمی‌کنند.
> 3. **اصل عدم اعتماد و Fail-closed در بک‌اند:** سرور بک‌اند موظف است تمامی هدرهای احراز هویت، توکن JWT و سطح دسترسی (RBAC) کاربر را برای هر تک تک درخواست‌ها مستقلاً بررسی کرده و در صورت هرگونه نقص دسترسی را مسدود (403/401) نماید.

### ۵.۲. حفاظت از داده‌های حساس پزشکی (Sensitive Medical Data)
> [!IMPORTANT]
> فیلد `medicalNotes` حاوی اطلاعات سوابق بیماری، حساسیت‌های دارویی و درمان‌های زیبایی بیمار است.
> - این داده‌ها باید در پایگاه داده بک‌اند به صورت رمزنگاری‌شده (Encryption at Rest - AES-256-GCM) ذخیره شوند.
> - دسترسی به مشاهده و ویرایش این فیلد در سطح سرور محدود به دو گروه است:
>   1. پزشک معالج مربوط به همان نوبت (`user.doctorId === appointment.doctorId`).
>   2. مدیر ارشد / مالک کلینیک (`owner`).
> - این فیلد هرگز نباید در مسیرهای عمومی رزرو آنلاین (`/public/*`) یا صف‌های عمومی لود شده برای پرسنل پذیرش افشا شود.

### ۵.۳. ایزوله‌سازی چندمستأجری (Multi-tenancy Isolation)
تمامی درخواست‌های مدیریتی هدر `X-Clinic-Id` را ارسال می‌کنند. سرور باید بررسی کند که کاربر احراز هویت‌شده حتماً عضو همان کلینیک باشد و تمام کوئری‌های پایگاه داده به صورت اجباری با فیلتر `clinic_id` محدود شوند.
