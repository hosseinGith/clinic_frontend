# MedFlow — قرارداد جامع ارتباطی وب‌سرویس (Backend API Contract)

این سند مرجع رسمی و نهایی کلیه تعاملات REST API میان فرانت‌اند سامانه **MedFlow** و سرویس‌های بک‌اند است.
تمامی کلاینت‌های HTTP در پوشه `src/services/adapters/http/` بر اساس این قرارداد پیاده‌سازی شده و از DTOهای با ساختار `snake_case` در سطح شبکه (JSON on the wire) و تبدیل آن به مدل‌های دامنه `camelCase` استفاده می‌کنند.

---

## ۱. اصول عمومی ارتباط و امنیت (Global Conventions & Security)

### ۱.۱. استانداردهای پایه
- **Base URL:** `https://api.medflow.ir/v1` (از طریق متغیر محیطی `VITE_API_BASE_URL` قابل تغییر است).
- **Encoding & Media Type:** `application/json; charset=utf-8`
- **احراز هویت:** توکن دسترسی Bearer JWT در هدر:
  ```http
  Authorization: Bearer <access_token>
  ```
- **چندمستأجری (Multi-tenancy):** هدر اجباری برای کلیه مسیرهای پنل مدیریت:
  ```http
  X-Clinic-Id: <clinic_id>
  ```
- **مسیرهای عمومی (Public Endpoints):** مسیرهای رزرو آنلاین مراجعان نیاز به توکن JWT ندارند و با پیشوند `/public/` مشخص شده‌اند.

### ۱.۲. ساختار یکپارچه خطاها (Error Response Envelope)
در هنگام رخداد خطا (کدهای وضعیت `4xx` و `5xx`)، بدنه پاسخ باید همواره مطابق ساختار زیر باشد:
```json
{
  "code": "SLOT_CONFLICT",
  "message": "اسلات زمانی انتخابی قبلاً رزرو شده است.",
  "details": {
    "field": "time",
    "conflictWith": "apt-102"
  }
}
```

#### کدهای خطای استاندارد:
| کد وضعیت | نام خطا | شرح |
|---|---|---|
| `400` | `VALIDATION_ERROR` | خطای اعتبارسنجی فیلدهای ورودی |
| `401` | `UNAUTHORIZED` | عدم ارسال توکن یا انقضای توکن دسترسی |
| `403` | `FORBIDDEN` | عدم کفایت سطح دسترسی نقش کاربر (RBAC) |
| `404` | `NOT_FOUND` | موجودیت درخواستی یافت نشد |
| `409` | `SLOT_CONFLICT` | تداخل زمانی نوبت پزشک |
| `429` | `RATE_LIMITED` | تعداد درخواست‌های بیش از حد مجاز (مثلاً درخواست OTP مکرر) |
| `500` | `INTERNAL_ERROR` | خطای داخلی سرور |

---

## ۲. فهرست کامل Endpoints به تفکیک ماژول

### ۲.۱. احراز هویت و مدیریت کاربران (Authentication & RBAC)

#### ۱. درخواست کد ورود یکبار مصرف (OTP Request)
- **مسیر:** `POST /auth/otp/request`
- **مجوز:** عمومی
- **بدنه درخواست:**
  ```json
  {
    "phone": "09121112233"
  }
  ```
- **پاسخ (200 OK):**
  ```json
  {
    "success": true,
    "message": "کد تأیید پیامک شد.",
    "expires_in_seconds": 120
  }
  ```

#### ۲. تأیید کد ورود (OTP Verify)
- **مسیر:** `POST /auth/otp/verify`
- **مجوز:** عمومی
- **بدنه درخواست:**
  ```json
  {
    "phone": "09121112233",
    "code": "12345"
  }
  ```
- **پاسخ (200 OK):**
  ```json
  {
    "success": true,
    "access_token": "eyJhbGciOi...",
    "user": {
      "id": "u-1",
      "name": "دکتر نیلوفر سپهری",
      "role": "doctor",
      "role_title": "پزشک معالج",
      "avatar_initials": "نس",
      "email": "dr.sepehri@medflow.ir",
      "phone": "09121112233",
      "doctor_id": "doc-1",
      "clinic_id": "ariana",
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z"
    },
    "active_clinic": {
      "id": "ariana",
      "slug": "ariana",
      "name": "کلینیک زیبایی آریانا",
      "tagline": "مرکز تخصصی پوست، لیزر و جوان‌سازی",
      "phone": "02188776655",
      "address": "تهران، خیابان ولیعصر، بالاتر از پارک ساعی",
      "working_hours": "شنبه تا پنجشنبه ۹ تا ۲۰"
    },
    "available_clinics": [
      {
        "id": "ariana",
        "slug": "ariana",
        "name": "کلینیک زیبایی آریانا",
        "tagline": "مرکز تخصصی پوست، لیزر و جوان‌سازی",
        "phone": "02188776655",
        "address": "تهران، خیابان ولیعصر، بالاتر از پارک ساعی",
        "working_hours": "شنبه تا پنجشنبه ۹ تا ۲۰"
      }
    ]
  }
  ```

#### ۳. تأیید مالکیت شماره تماس در ویزارد رزرو آنلاین
- **مسیر:** `POST /auth/otp/verify-phone`
- **مجوز:** عمومی
- **بدنه درخواست:**
  ```json
  {
    "phone": "09121112233",
    "code": "12345"
  }
  ```
- **پاسخ (200 OK):**
  ```json
  {
    "success": true,
    "verification_token": "tok_phone_verified_abc123"
  }
  ```

#### ۴. دریافت اطلاعات جلسه کاربری فعلی
- **مسیر:** `GET /auth/me`
- **مجوز:** احراز هویت شده (هر نقشی)
- **پاسخ (200 OK):** آبجکت مشخصات کاربر و کلینیک‌های فعال/مجاز.

#### ۵. خروج از حساب کاربری
- **مسیر:** `POST /auth/logout`
- **مجوز:** احراز هویت شده
- **پاسخ (200 OK):** `{ "success": true }`

#### ۶. تجدید توکن جلسه (Refresh Token)
- **مسیر:** `POST /auth/refresh`
- **مجوز:** احراز هویت شده
- **پاسخ (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "user": { ... }
  }
  ```

#### ۷. دریافت فهرست کاربران کلینیک
- **مسیر:** `GET /clinics/{clinicId}/users`
- **مجوز RBAC:** `owner` یا `clinic_manager`
- **پاسخ (200 OK):** آرایه‌ای از آبجکت‌های `UserProfileDto`.

#### ۸. ایجاد کاربر جدید در کلینیک
- **مسیر:** `POST /clinics/{clinicId}/users`
- **مجوز RBAC:** `owner` یا `clinic_manager`
- **بدنه درخواست:**
  ```json
  {
    "name": "سارا محمدی",
    "phone": "09123334455",
    "role": "receptionist",
    "role_title": "مسئول پذیرش شیفت صبح",
    "email": "sara@ariana.ir",
    "doctor_id": null
  }
  ```

#### ۹. تغییر نقش کاربر
- **مسیر:** `PATCH /clinics/{clinicId}/users/{userId}/role`
- **مجوز RBAC:** `owner` یا `clinic_manager` (تنها `owner` مجاز به ارتقای دیگران به `owner` است).
- **بدنه درخواست:**
  ```json
  {
    "role": "doctor",
    "doctor_id": "doc-2"
  }
  ```

#### ۱۰. فعال/غیرفعال‌سازی وضعیت کاربر
- **مسیر:** `PATCH /clinics/{clinicId}/users/{userId}/status`
- **مجوز RBAC:** `owner` یا `clinic_manager`

---

### ۲.۲. داشبورد و شاخص‌های کلیدی (Dashboard Metrics)

#### دریافت خلاصه وضعیت داشبورد
- **مسیر:** `GET /clinics/{clinicId}/dashboard/summary`
- **مجوز RBAC:** `owner`, `clinic_manager`, `receptionist`, `accountant`
- **پاسخ (200 OK):**
  ```json
  {
    "today_appointments": 24,
    "today_appointments_trend": 4,
    "hot_leads": 7,
    "hot_leads_decision_ready": 3,
    "at_risk_clients": 3,
    "at_risk_recovery_value": 12800000,
    "response_rate": 92,
    "response_rate_weekly_trend": 8
  }
  ```

#### دریافت اقدامات پیشنهادی هوشمند بعدی
- **مسیر:** `GET /clinics/{clinicId}/dashboard/next-actions`
- **مجوز RBAC:** `owner`, `clinic_manager`, `receptionist`

---

### ۲.۳. نوبت‌ها و صف پذیرش (Appointments)

#### ۱. دریافت لیست نوبت‌ها
- **مسیر:** `GET /clinics/{clinicId}/appointments`
- **مجوز RBAC:** `owner`, `clinic_manager`, `receptionist`, `doctor` (برای دکتر فیلتر سروری `doctor_id` کاربر اجباری است)
- **پارامترهای Query:**
  - `date`: فیلتر تاریخ به صورت ISO (`YYYY-MM-DD`)
  - `status`: فیلتر وضعیت نوبت
  - `doctor_id`: فیلتر پزشک معالج
  - `search`: جستجوی نام یا شماره تماس مراجع
- **پاسخ (200 OK):** آرایه‌ای از `AppointmentDto`.

#### ۲. دریافت صف نوبت‌های امروز
- **مسیر:** `GET /clinics/{clinicId}/appointments/today?limit=5`
- **مجوز RBAC:** `owner`, `clinic_manager`, `receptionist`, `doctor`

#### ۳. جزئیات یک نوبت
- **مسیر:** `GET /clinics/{clinicId}/appointments/{id}`
- **مجوز RBAC:** `owner`, `clinic_manager`, `receptionist`, `doctor` (پزشک تنها نوبت‌های متعلق به خود را دریافت می‌کند)

#### ۴. ثبت نوبت جدید (پذیرش دستی)
- **مسیر:** `POST /clinics/{clinicId}/appointments`
- **مجوز RBAC:** `owner`, `clinic_manager`, `receptionist`
- **بدنه درخواست (Snake_case DTO):**
  ```json
  {
    "clinic_id": "ariana",
    "appointment_date": "2026-10-25",
    "appointment_time": "11:00",
    "client_id": "cl-1",
    "client_name": "سارا خسروی",
    "client_phone": "09121112233",
    "service_id": "srv-1",
    "doctor_id": "doc-1",
    "source": "reception_manual",
    "notes": "رزرو حضوری"
  }
  ```

#### ۵. تغییر وضعیت نوبت
- **مسیر:** `PATCH /clinics/{clinicId}/appointments/{id}/status`
- **مجوز RBAC:** `owner`, `clinic_manager`, `receptionist`, `doctor`
- **بدنه درخواست:**
  ```json
  {
    "status": "confirmed"
  }
  ```

#### ۶. بررسی تعارض و اسلات نوبت
- **مسیر:** `POST /clinics/{clinicId}/appointments/check-conflict`
- **بدنه درخواست:**
  ```json
  {
    "doctor_id": "doc-1",
    "date": "2026-10-25",
    "time": "11:00",
    "duration_minutes": 45
  }
  ```
- **پاسخ (200 OK):** `{ "hasConflict": false }`

#### ۷. ثبت یادداشت‌های پزشکی حساس
- **مسیر:** `PATCH /clinics/{clinicId}/appointments/{id}/medical-notes`
- **مجوز RBAC:** `owner`, `doctor` (صرفاً پزشک مرتبط با نوبت)
- **بدنه درخواست:**
  ```json
  {
    "medical_notes": "تزریق فیلر لب ۲ سی‌سی با بی‌حسی موضعی بدون حساسیت."
  }
  ```

---

### ۲.۴. پرتال رزرو عمومی نوبت (Public Booking API)

#### ۱. دریافت مشخصات کلینیک بر اساس Slug
- **مسیر:** `GET /public/clinics/{clinicSlug}`
- **مجوز:** عمومی

#### ۲. دریافت اسلات‌های خالی پزشک
- **مسیر:** `GET /public/clinics/{clinicId}/booking/slots`
- **پارامترهای Query:** `clinicId`, `doctorId`, `serviceId`, `date`
- **پاسخ (200 OK):**
  ```json
  [
    { "time": "09:00", "is_available": true },
    { "time": "09:30", "is_available": false },
    { "time": "10:00", "is_available": true }
  ]
  ```

#### ۳. ثبت نهایی رزرو نوبت آنلاین
- **مسیر:** `POST /public/clinics/{clinicId}/booking`
- **مجوز:** عمومی (با بررسی کپچا و در صورت فعال بودن، توکن تأیید شماره موبایل)
- **بدنه درخواست:**
  ```json
  {
    "clinic_id": "ariana",
    "service_id": "srv-1",
    "doctor_id": "doc-1",
    "date": "2026-10-25",
    "time": "10:00",
    "client_name": "مهسا بهرامی",
    "phone": "09124445566",
    "notes": "نوبت اول برای مشاوره لیزر",
    "captcha_token": "captcha_pass_xyz",
    "phone_verification_token": "tok_phone_verified_abc123"
  }
  ```
- **پاسخ (201 Created):**
  ```json
  {
    "appointment": { ... },
    "tracking_code": "MF-9482"
  }
  ```

---

### ۲.۵. مشتریان (Clients)
- `GET /clinics/{clinicId}/clients`: فهرست کامل مراجعان با فیلتر نام/شماره.
- `GET /clinics/{clinicId}/clients/at-risk`: مراجعان با بیش از ۹۰ روز عدم مراجعه و ارزش بازیابی بالا.
- `GET /clinics/{clinicId}/clients/{id}`: پرونده کامل مراجع.

---

### ۲.۶. سرنخ‌های فروش و مشاوره (Leads)
- `GET /clinics/{clinicId}/leads`: فهرست سرنخ‌ها با وضعیت‌های `new | hot | contacted | converted | dropped`.
- `GET /clinics/{clinicId}/leads/hot`: سرنخ‌های داغ با نمره امتیازدهی بالا.

---

### ۲.۷. موتور اتوماسیون و صندوق پیام‌ها (Automations & Outbox)
- `GET /clinics/{clinicId}/automations`: فهرست سناریوهای فعال خودکار.
- `GET /clinics/{clinicId}/automations/stats`: آمار پیام‌های ارسالی و ساعات صرفه‌جویی شده.
- `PATCH /clinics/{clinicId}/automations/{id}`: فعال یا غیرفعال‌سازی سناریو (`{ "enabled": boolean }`).
- `POST /clinics/{clinicId}/automations/events`: ارسال دستی رویداد اتوماسیون.
- `GET /clinics/{clinicId}/messages/outbox`: فهرست پیام‌های صف خروجی پیامک/واتساپ.
- `POST /clinics/{clinicId}/messages/outbox`: ثبت پیام در صف خروجی.

---

### ۲.۸. لاگ‌های امنیتی و بازرسی (Audit Logs)
- `GET /clinics/{clinicId}/audit-logs`: لیست وقایع امنیتی و تغییر وضعیت‌ها.
- `POST /clinics/{clinicId}/audit-logs`: ثبت واقعه ممیزی جدید.
