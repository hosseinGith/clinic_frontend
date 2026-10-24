import { describe, it, expect, beforeEach } from 'vitest';
import { MockAuthRepository } from '../services/adapters/mock/MockAuthRepository';
import { mockStorage } from '../services/adapters/mock/mockStorage';

describe('Auth Repository & OTP Logic', () => {
  let authRepo: MockAuthRepository;

  beforeEach(() => {
    mockStorage.resetToSeed();
    localStorage.clear();
    sessionStorage.clear();
    authRepo = new MockAuthRepository();
  });

  it('generates OTP successfully for valid Iranian phone number', async () => {
    const res = await authRepo.requestOtp('09121110003');
    expect(res.success).toBe(true);
    expect(res.expiresInSeconds).toBe(120);
  });

  it('rejects invalid Iranian phone numbers', async () => {
    await expect(authRepo.requestOtp('12345')).rejects.toThrow();
    await expect(authRepo.requestOtp('08123456789')).rejects.toThrow();
  });

  it('prevents inactive users from requesting OTP', async () => {
    // Create an inactive user in storage
    const users = mockStorage.getUsers();
    users.push({
      id: 'usr-inactive',
      name: 'کاربر مسدود',
      phone: '09129990000',
      role: 'reception',
      roleTitle: 'پذیرش',
      avatarInitials: 'ک',
      isActive: false,
      createdAt: '1403/01/01',
    });
    mockStorage.saveUsers(users);

    await expect(authRepo.requestOtp('09129990000')).rejects.toThrow(
      'حساب کاربری شما توسط مدیر سیستم غیرفعال شده است.'
    );
  });

  it('verifies correct OTP code (123456) and provisions session', async () => {
    await authRepo.requestOtp('09121110003');
    const verifyRes = await authRepo.verifyOtp('09121110003', '123456');

    expect(verifyRes.success).toBe(true);
    expect(verifyRes.session).toBeDefined();
    expect(verifyRes.session?.user.name).toBe('سارا حسینی');
    expect(verifyRes.session?.user.role).toBe('reception');
    expect(verifyRes.session?.isAuthenticated).toBe(true);
  });

  it('fails with incorrect code and locks out after 3 failed attempts', async () => {
    const phone = '09121110001';
    await authRepo.requestOtp(phone);

    // 1st wrong attempt
    const attempt1 = await authRepo.verifyOtp(phone, '999999');
    expect(attempt1.success).toBe(false);
    expect(attempt1.error).toContain('کد وارد شده صحیح نمی‌باشد');

    // 2nd wrong attempt
    const attempt2 = await authRepo.verifyOtp(phone, '888888');
    expect(attempt2.success).toBe(false);

    // 3rd wrong attempt -> lockout
    const attempt3 = await authRepo.verifyOtp(phone, '777777');
    expect(attempt3.success).toBe(false);
    expect(attempt3.error).toContain('3 بار کد اشتباه وارد شد');

    // Subsequent requestOtp is also locked
    await expect(authRepo.requestOtp(phone)).rejects.toThrow('تعداد تلاش‌های ناموفق');
  });

  it('fails verification if OTP is expired', async () => {
    const phone = '09121110002';
    await authRepo.requestOtp(phone);

    // Manually expire the OTP in storage
    const state = mockStorage.getOtpState(phone);
    if (state) {
      state.expiresAt = Date.now() - 1000;
      mockStorage.saveOtpState(phone, state);
    }

    const res = await authRepo.verifyOtp(phone, '123456');
    expect(res.success).toBe(false);
    expect(res.error).toContain('منقضی شده است');
  });

  it('logs out and clears session', async () => {
    await authRepo.requestOtp('09121110003');
    await authRepo.verifyOtp('09121110003', '123456');

    const currentUserBefore = await authRepo.getCurrentUser();
    expect(currentUserBefore).not.toBeNull();

    await authRepo.logout();
    const currentUserAfter = await authRepo.getCurrentUser();
    expect(currentUserAfter).toBeNull();
  });

  it('requestOtp preserves failed attempts counter and does not reset attempts', async () => {
    const phone = '09121110001';
    await authRepo.requestOtp(phone);

    // 2 failed attempts
    await authRepo.verifyOtp(phone, '000000');
    await authRepo.verifyOtp(phone, '111111');

    // Request new OTP
    await authRepo.requestOtp(phone);

    // 3rd failed attempt should lock out immediately
    const res = await authRepo.verifyOtp(phone, '222222');
    expect(res.success).toBe(false);
    expect(res.error).toContain('3 بار کد اشتباه وارد شد');

    // Account locked
    await expect(authRepo.requestOtp(phone)).rejects.toThrow('تعداد تلاش‌های ناموفق');
  });

  it('enforces rate limit of maximum 3 OTP requests within 10 minutes', async () => {
    const phone = '09125556677';
    await authRepo.requestOtp(phone); // 1
    await authRepo.requestOtp(phone); // 2
    await authRepo.requestOtp(phone); // 3

    // 4th request must throw rate limit error
    await expect(authRepo.requestOtp(phone)).rejects.toThrow('بیش از حد مجاز است');
  });

  it('verifyPhoneOwnership validates code and returns single-use token without logging in user', async () => {
    const phone = '09123334455';
    // Initially not logged in
    expect(await authRepo.getCurrentUser()).toBeNull();

    // Request OTP first
    await authRepo.requestOtp(phone);

    const result = await authRepo.verifyPhoneOwnership(phone, '123456');
    expect(result.success).toBe(true);
    expect(result.verificationToken).toBeDefined();
    expect(result.verificationToken?.length).toBeGreaterThan(10);

    // Still not logged in (no session created)
    expect(await authRepo.getCurrentUser()).toBeNull();

    // Rejects invalid code
    const invalidResult = await authRepo.verifyPhoneOwnership(phone, '000000');
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toBeDefined();
  });
});
