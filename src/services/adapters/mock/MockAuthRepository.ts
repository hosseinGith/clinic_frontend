import type {
  IAuthRepository,
  RequestOtpResult,
  VerifyOtpResult,
  VerifyPhoneOwnershipResult,
  CreateUserInput,
} from '../../repositories/IAuthRepository';
import type { UserProfile, UserSession, Role, Actor } from '../../../domain/session';
import { normalizePhoneNumber, isValidIranianMobile } from '../../../lib/phone';
import { mockStorage, simulateDelay } from './mockStorage';
import { SEED_CLINIC } from '../../../mocks/seed';
import { MockAuditRepository } from './MockAuditRepository';

const SESSION_STORAGE_KEY = 'medflow_auth_session';
const FIXED_MOCK_OTP = '123456';
const OTP_EXPIRY_SECONDS = 120; // 2 minutes
const LOCKOUT_MINUTES = 5;
const MAX_ATTEMPTS = 3;

export class MockAuthRepository implements IAuthRepository {
  private auditRepo = new MockAuditRepository();

  async requestOtp(phone: string): Promise<RequestOtpResult> {
    await simulateDelay(60);
    const normalized = normalizePhoneNumber(phone);

    if (!isValidIranianMobile(normalized)) {
      throw new Error('شماره تلفن همراه معتبر نمی‌باشد (الگوی 0912...).');
    }

    const state = mockStorage.getOtpState(normalized);
    const now = Date.now();

    // Check lockout
    if (state?.lockedUntil && state.lockedUntil > now) {
      const remainingMinutes = Math.ceil((state.lockedUntil - now) / (60 * 1000));
      throw new Error(
        `تعداد تلاش‌های ناموفق بیش از حد مجاز بوده است. لطفاً ${remainingMinutes} دقیقه دیگر مجدداً تلاش فرمایید.`
      );
    }

    // Rate limit check: max 3 requests in 10 minutes
    const recentRequests = mockStorage.getOtpRequestCount(normalized, 10);
    if (recentRequests >= 3) {
      throw new Error(
        'تعداد درخواست‌های ارسال کد بیش از حد مجاز است (حداکثر 3 بار در 10 دقیقه). لطفاً بعداً تلاش فرمایید.'
      );
    }
    mockStorage.recordOtpRequest(normalized);

    // Check if user exists in clinic registry or is a patient
    const users = mockStorage.getUsers();
    const user = users.find((u) => normalizePhoneNumber(u.phone) === normalized);

    if (user && !user.isActive) {
      throw new Error('حساب کاربری شما توسط مدیر سیستم غیرفعال شده است.');
    }

    // Retain failed attempts count within window:
    const retainedAttempts =
      state?.lockedUntil && now > state.lockedUntil ? 0 : state?.attempts || 0;

    // Save new OTP state
    mockStorage.saveOtpState(normalized, {
      code: FIXED_MOCK_OTP,
      sentAt: now,
      expiresAt: now + OTP_EXPIRY_SECONDS * 1000,
      attempts: retainedAttempts,
      lockedUntil: state?.lockedUntil && state.lockedUntil > now ? state.lockedUntil : undefined,
    });

    return {
      success: true,
      message: 'کد تأیید 6 رقمی از طریق پیامک ارسال شد.',
      expiresInSeconds: OTP_EXPIRY_SECONDS,
    };
  }

  async verifyPhoneOwnership(phone: string, code: string): Promise<VerifyPhoneOwnershipResult> {
    await simulateDelay(80);
    const normalized = normalizePhoneNumber(phone);
    const state = mockStorage.getOtpState(normalized);
    const now = Date.now();

    if (!state) {
      return {
        success: false,
        error: 'کد تأیید منقضی شده یا درخواست نشده است. لطفاً مجدداً درخواست ارسال کد دهید.',
      };
    }

    // Check lockout
    if (state.lockedUntil && state.lockedUntil > now) {
      const remainingMinutes = Math.ceil((state.lockedUntil - now) / (60 * 1000));
      return {
        success: false,
        error: `به دلیل تلاش‌های ناموفق مکرر، امکان اعتبارسنجی تا ${remainingMinutes} دقیقه دیگر وجود ندارد.`,
      };
    }

    // Check expiry
    if (now > state.expiresAt) {
      return {
        success: false,
        error: 'کد تأیید منقضی شده است. لطفاً کد جدید دریافت کنید.',
      };
    }

    // Check code match
    const cleanCode = code.trim();
    if (cleanCode !== state.code) {
      const nextAttempts = state.attempts + 1;
      const willLock = nextAttempts >= MAX_ATTEMPTS;
      const lockedUntil = willLock ? now + LOCKOUT_MINUTES * 60 * 1000 : undefined;

      mockStorage.saveOtpState(normalized, {
        ...state,
        attempts: nextAttempts,
        lockedUntil,
      });

      if (willLock) {
        return {
          success: false,
          error: `3 بار کد اشتباه وارد شد. به دلایل امنیتی تا ${LOCKOUT_MINUTES} دقیقه امکان اعتبارسنجی وجود ندارد.`,
        };
      }

      const remainingAttempts = MAX_ATTEMPTS - nextAttempts;
      return {
        success: false,
        error: `کد وارد شده صحیح نمی‌باشد. (${remainingAttempts} بار فرصت باقی‌مانده)`,
      };
    }

    // Success - consume OTP state and issue single-use phone verification token
    mockStorage.clearOtpState(normalized);
    const verificationToken = `vtok_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    mockStorage.saveVerificationToken(normalized, verificationToken, now + 15 * 60 * 1000);

    return {
      success: true,
      verificationToken,
    };
  }

  async verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
    await simulateDelay(80);
    const normalized = normalizePhoneNumber(phone);
    const state = mockStorage.getOtpState(normalized);
    const now = Date.now();

    if (!state) {
      return {
        success: false,
        error: 'کد تأیید منقضی شده یا درخواست نشده است. لطفاً مجدداً درخواست ارسال کد دهید.',
      };
    }

    // Check lockout
    if (state.lockedUntil && state.lockedUntil > now) {
      const remainingMinutes = Math.ceil((state.lockedUntil - now) / (60 * 1000));
      return {
        success: false,
        error: `حساب شما به مدت ${remainingMinutes} دقیقه به دلیل تلاش‌های ناموفق قفل شده است.`,
      };
    }

    // Check expiry
    if (now > state.expiresAt) {
      return {
        success: false,
        error: 'کد تأیید منقضی شده است. لطفاً کد جدید دریافت کنید.',
      };
    }

    // Check code match
    const cleanCode = code.trim();
    if (cleanCode !== state.code) {
      const nextAttempts = state.attempts + 1;
      const willLock = nextAttempts >= MAX_ATTEMPTS;
      const lockedUntil = willLock ? now + LOCKOUT_MINUTES * 60 * 1000 : undefined;

      mockStorage.saveOtpState(normalized, {
        ...state,
        attempts: nextAttempts,
        lockedUntil,
      });

      // Record failed audit log
      void this.auditRepo.recordLog({
        clinicId: SEED_CLINIC.id,
        userId: 'unknown',
        userName: normalized,
        role: 'patient',
        action: 'auth.login_failed',
        details: `کد اشتباه برای شماره ${normalized}. تلاش شماره ${nextAttempts} از ${MAX_ATTEMPTS}`,
      });

      if (willLock) {
        return {
          success: false,
          error: `3 بار کد اشتباه وارد شد. به دلایل امنیتی تا ${LOCKOUT_MINUTES} دقیقه امکان ورود وجود ندارد.`,
        };
      }

      const remainingAttempts = MAX_ATTEMPTS - nextAttempts;
      return {
        success: false,
        error: `کد وارد شده صحیح نمی‌باشد. (${remainingAttempts} بار فرصت باقی‌مانده)`,
      };
    }

    // Success - resolve or auto-provision patient user
    mockStorage.clearOtpState(normalized);

    const users = mockStorage.getUsers();
    let user = users.find((u) => normalizePhoneNumber(u.phone) === normalized);

    if (!user) {
      // Auto-create patient profile
      const newPatient: UserProfile = {
        id: `usr-p-${Date.now()}`,
        name: 'مراجع گرامی',
        role: 'patient',
        roleTitle: 'مراجع کلینیک',
        avatarInitials: 'م',
        phone: normalized,
        clientId: `cl-${Date.now()}`,
        clinicId: SEED_CLINIC.id,
        isActive: true,
        createdAt: new Date().toLocaleDateString('fa-IR'),
      };
      user = newPatient;
      mockStorage.saveUsers([...users, newPatient]);
    }

    if (!user.isActive) {
      return {
        success: false,
        error: 'حساب کاربری شما مسدود می‌باشد.',
      };
    }

    const session: UserSession = {
      user,
      activeClinic: SEED_CLINIC,
      availableClinics: [SEED_CLINIC],
      isAuthenticated: true,
      token: `mock-jwt-token-${user.id}-${Date.now()}`,
    };

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    // Record login audit log
    void this.auditRepo.recordLog({
      clinicId: SEED_CLINIC.id,
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: 'auth.login_success',
      details: `ورود با شماره ${normalized} و نقش ${user.roleTitle}`,
    });

    return {
      success: true,
      session,
    };
  }

  async getCurrentUser(): Promise<UserSession | null> {
    await simulateDelay(30);
    if (typeof window === 'undefined') return null;

    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return null;
      const parsed: UserSession = JSON.parse(stored);

      // Re-verify against users storage in case user was deactivated or role changed
      const users = mockStorage.getUsers();
      const freshUser = users.find((u) => u.id === parsed.user.id);
      if (!freshUser || !freshUser.isActive) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }

      parsed.user = freshUser;
      return parsed;
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    await simulateDelay(30);
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        try {
          const parsed: UserSession = JSON.parse(stored);
          void this.auditRepo.recordLog({
            clinicId: parsed.activeClinic.id,
            userId: parsed.user.id,
            userName: parsed.user.name,
            role: parsed.user.role,
            action: 'auth.logout',
            details: 'خروج کاربر از سیستم',
          });
        } catch {
          // ignore
        }
      }
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  async refreshSession(): Promise<UserSession | null> {
    return this.getCurrentUser();
  }

  async updateProfile(userId: string, input: { name: string }): Promise<UserProfile> {
    await simulateDelay(50);
    const users = mockStorage.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error('کاربر مورد نظر یافت نشد.');
    }

    const current = users[index];
    const newName = input.name.trim();
    const updated: UserProfile = {
      ...current,
      name: newName,
      avatarInitials: newName.charAt(0) || current.avatarInitials,
    };

    users[index] = updated;
    mockStorage.saveUsers(users);

    // Update in sessionStorage if current user
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const parsed: UserSession = JSON.parse(stored);
          if (parsed.user.id === userId) {
            parsed.user = updated;
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
          }
        }
      } catch {
        // ignore
      }
    }

    return updated;
  }

  // --- User Management ---
  async getUsers(clinicId: string): Promise<UserProfile[]> {
    await simulateDelay(50);
    return mockStorage.getUsers().filter((u) => !u.clinicId || u.clinicId === clinicId);
  }

  async createUser(clinicId: string, input: CreateUserInput, actor?: Actor): Promise<UserProfile> {
    await simulateDelay(60);
    const users = mockStorage.getUsers();
    const normalized = normalizePhoneNumber(input.phone);

    if (actor) {
      if (actor.role === 'admin' && (input.role === 'owner' || input.role === 'admin')) {
        throw new Error('مدیر عملیات مجاز به ایجاد کاربر با نقش مدیر ارشد یا مدیر عملیات نمی‌باشد.');
      }
    }

    if (input.role === 'doctor' && !input.doctorId) {
      throw new Error('انتخاب پزشک معالج برای نقش پزشک متخصص الزامی است.');
    }

    if (users.some((u) => normalizePhoneNumber(u.phone) === normalized)) {
      throw new Error('کاربری با این شماره تلفن همراه قبلاً ثبت شده است.');
    }

    const initials = input.name.trim().charAt(0) || 'ک';
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: input.name.trim(),
      role: input.role,
      roleTitle: input.roleTitle,
      avatarInitials: initials,
      email: input.email,
      phone: normalized,
      doctorId: input.doctorId,
      clinicId,
      isActive: true,
      createdAt: new Date().toLocaleDateString('fa-IR'),
    };

    mockStorage.saveUsers([newUser, ...users]);

    void this.auditRepo.recordLog({
      clinicId,
      userId: actor?.userId || newUser.id,
      userName: actor?.userName || actor?.userId || newUser.name,
      role: actor?.role || newUser.role,
      action: 'user.created',
      details: `ایجاد کاربر ${newUser.name} با نقش ${newUser.roleTitle}`,
    });

    return newUser;
  }

  async updateUserRole(
    clinicId: string,
    userId: string,
    newRole: Role,
    actor?: Actor,
    doctorId?: string
  ): Promise<UserProfile> {
    await simulateDelay(50);
    const users = mockStorage.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error('کاربر مورد نظر یافت نشد.');
    }

    const current = users[index];

    if (actor) {
      if (actor.userId === userId) {
        throw new Error('امکان تغییر سطح دسترسی حساب کاربری خودتان وجود ندارد.');
      }
      if (actor.role === 'admin') {
        if (current.role === 'owner' || current.role === 'admin') {
          throw new Error('مدیر عملیات مجاز به ویرایش نقش مدیر ارشد یا سایر مدیران نمی‌باشد.');
        }
        if (newRole === 'owner' || newRole === 'admin') {
          throw new Error('مدیر عملیات مجاز به ارتقای کاربران به نقش مدیر ارشد یا مدیر عملیات نمی‌باشد.');
        }
      }
      if (current.role === 'owner' && newRole !== 'owner') {
        const activeOwners = users.filter((u) => u.role === 'owner' && u.isActive && u.id !== userId);
        if (activeOwners.length === 0) {
          throw new Error('امکان تنزل نقش آخرین مدیر ارشد (Owner) کلینیک وجود ندارد.');
        }
      }
    }

    const effectiveDoctorId = doctorId || current.doctorId;
    if (newRole === 'doctor' && !effectiveDoctorId) {
      throw new Error('تخصیص شناسه پزشک معالج برای نقش پزشک الزامی است.');
    }

    const updated: UserProfile = {
      ...current,
      role: newRole,
      doctorId: newRole === 'doctor' ? effectiveDoctorId : current.doctorId,
    };

    users[index] = updated;
    mockStorage.saveUsers([...users]);

    void this.auditRepo.recordLog({
      clinicId,
      userId: actor?.userId || current.id,
      userName: actor?.userName || actor?.userId || current.name,
      role: actor?.role || newRole,
      action: 'user.role_change',
      details: `تغییر نقش کاربر ${current.name} از ${current.role} به ${newRole}`,
    });

    return updated;
  }

  async toggleUserStatus(clinicId: string, userId: string, actor?: Actor): Promise<UserProfile> {
    await simulateDelay(50);
    const users = mockStorage.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error('کاربر مورد نظر یافت نشد.');
    }

    const current = users[index];

    if (actor) {
      if (actor.userId === userId) {
        throw new Error('امکان غیرفعال‌سازی حساب کاربری خودتان وجود ندارد.');
      }
      if (actor.role === 'admin' && (current.role === 'owner' || current.role === 'admin')) {
        throw new Error('مدیر عملیات مجاز به تغییر وضعیت حساب مدیر ارشد یا سایر مدیران نمی‌باشد.');
      }
      if (current.role === 'owner' && current.isActive) {
        const activeOwners = users.filter((u) => u.role === 'owner' && u.isActive && u.id !== userId);
        if (activeOwners.length === 0) {
          throw new Error('امکان غیرفعال‌سازی آخرین مدیر ارشد (Owner) کلینیک وجود ندارد.');
        }
      }
    }

    const updated: UserProfile = {
      ...current,
      isActive: !current.isActive,
    };

    users[index] = updated;
    mockStorage.saveUsers([...users]);

    void this.auditRepo.recordLog({
      clinicId,
      userId: actor?.userId || current.id,
      userName: actor?.userName || actor?.userId || current.name,
      role: actor?.role || current.role,
      action: updated.isActive ? 'user.activated' : 'user.deactivated',
      details: `وضعیت کاربر ${current.name} به ${updated.isActive ? 'فعال' : 'غیرفعال'} تغییر یافت.`,
    });

    return updated;
  }
}
