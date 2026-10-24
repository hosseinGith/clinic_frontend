import type {
  IPlatformAuthRepository,
  SendPlatformOtpResult,
  VerifyPlatformOtpResult,
  PlatformUser,
} from '../../repositories/IPlatformAuthRepository';

const SUPER_ADMIN_PHONES = ['09212978638', '09120000000'];
const MOCK_SUPER_ADMIN_USER: PlatformUser = {
  id: 'usr-super-admin-seed',
  name: 'مدیر ارشد پلتفرم',
  phone: '09212978638',
  role: 'super_admin',
};

export class MockPlatformAuthRepository implements IPlatformAuthRepository {
  private failedAttempts: number = 0;
  private lockedUntil: number = 0;
  private activeCode: string = '123456';

  async sendOtp(phone: string): Promise<SendPlatformOtpResult> {
    await new Promise((res) => setTimeout(res, 300));

    // Iranian mobile phone format validation (09xxxxxxxxx)
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      const err = new Error('فرمت شماره موبایل نامعتبر است. شماره باید 11 رقم و با 09 شروع شود.');
      (err as any).status = 400;
      throw err;
    }

    // Check lock
    if (this.lockedUntil > Date.now()) {
      const remainingMinutes = Math.ceil((this.lockedUntil - Date.now()) / (60 * 1000));
      const err = new Error(
        `به دلیل تلاش‌های ناموفق مکرر، ورود موقتاً مسدود است. لطفاً ${remainingMinutes} دقیقه دیگر تلاش فرمایید.`
      );
      (err as any).status = 429;
      (err as any).code = 'RATE_LIMITED';
      throw err;
    }

    // Always return success to protect against phone enumeration
    return {
      success: true,
      expiresIn: 120,
      message: 'در صورت صحت شماره موبایل مدیر پلتفرم، کد یک‌بارمصرف ارسال گردید.',
    };
  }

  async verifyOtp(phone: string, code: string): Promise<VerifyPlatformOtpResult> {
    await new Promise((res) => setTimeout(res, 350));

    if (this.lockedUntil > Date.now()) {
      const err = new Error('حساب کاربری موقتاً به دلیل تلاش‌های ناموفق قفل گردیده است.');
      (err as any).status = 429;
      (err as any).code = 'RATE_LIMITED';
      throw err;
    }

    const cleanPhone = phone.trim();
    if (SUPER_ADMIN_PHONES.includes(cleanPhone) && code === this.activeCode) {
      this.failedAttempts = 0;
      this.lockedUntil = 0;
      const sessionResult = {
        token: `mock-super-admin-jwt-${Date.now()}`,
        user: { ...MOCK_SUPER_ADMIN_USER, phone: cleanPhone },
      };
      this.currentSession = sessionResult;
      return sessionResult;
    }

    this.failedAttempts++;
    if (this.failedAttempts >= 3) {
      this.lockedUntil = Date.now() + 15 * 60 * 1000;
      const err = new Error('حساب کاربری موقتاً به دلیل تلاش‌های ناموفق قفل گردیده است.');
      (err as any).status = 429;
      (err as any).code = 'RATE_LIMITED';
      throw err;
    }

    const err = new Error('کد تأیید نامعتبر است یا منقضی شده است.');
    (err as any).status = 401;
    throw err;
  }

  private currentSession: { token: string; user: PlatformUser } | null = null;

  async refreshSession(): Promise<VerifyPlatformOtpResult> {
    await new Promise((res) => setTimeout(res, 150));
    if (!this.currentSession) {
      const err = new Error('نشست نامعتبر است.');
      (err as any).status = 401;
      throw err;
    }
    return {
      token: `mock-super-admin-refreshed-jwt-${Date.now()}`,
      user: { ...this.currentSession.user },
    };
  }

  async logout(): Promise<{ success: boolean }> {
    await new Promise((res) => setTimeout(res, 100));
    this.currentSession = null;
    return { success: true };
  }
}
