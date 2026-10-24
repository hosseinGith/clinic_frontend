import { describe, it, expect, beforeEach } from 'vitest';
import { MockBookingRepository } from '../services/adapters/mock/MockBookingRepository';
import { MockAuthRepository } from '../services/adapters/mock/MockAuthRepository';
import { mockStorage } from '../services/adapters/mock/mockStorage';
import { SEED_CLINIC } from '../mocks/seed';
import type { BookingSubmissionInput } from '../services/repositories/IBookingRepository';

describe('Booking Repository & Verification Token Protection', () => {
  let bookingRepo: MockBookingRepository;
  let authRepo: MockAuthRepository;
  const clinicId = SEED_CLINIC.id;

  beforeEach(() => {
    mockStorage.resetToSeed();
    bookingRepo = new MockBookingRepository();
    authRepo = new MockAuthRepository();
  });

  const createValidBookingInput = (phone: string, token: string): BookingSubmissionInput => ({
    clinicId,
    serviceId: 's1',
    doctorId: 'd1',
    date: '1403/07/20',
    time: '14:00',
    clientName: 'مریم حسینی',
    clientPhone: phone,
    verificationToken: token,
    captchaToken: 'valid-captcha-mock',
    notes: 'توضیحات تستی',
  });

  it('rejects booking submission if verificationToken is missing or invalid', async () => {
    const input = createValidBookingInput('09121114455', 'fake-token-12345');
    await expect(bookingRepo.submitBooking(input)).rejects.toThrow(
      'اعتبارسنجی شماره تلفن همراه نامعتبر است'
    );
  });

  it('successfully books appointment with verified token and consumes it', async () => {
    const phone = '09121114455';
    // 1. Request OTP & verify phone to get valid token
    await authRepo.requestOtp(phone);
    const verifyRes = await authRepo.verifyPhoneOwnership(phone, '123456');
    expect(verifyRes.success).toBe(true);
    const token = verifyRes.verificationToken!;
    expect(token).toBeDefined();

    // 2. Submit booking using the token
    const input = createValidBookingInput(phone, token);
    const bookingResult = await bookingRepo.submitBooking(input);
    expect(bookingResult.appointment.id).toBeDefined();
    expect(bookingResult.trackingCode).toBeDefined();

    // 3. Token cannot be reused (single-use)
    const secondInput = createValidBookingInput(phone, token);
    await expect(bookingRepo.submitBooking(secondInput)).rejects.toThrow(
      'اعتبارسنجی شماره تلفن همراه نامعتبر است'
    );
  });

  it('rejects booking if token does not match the client phone', async () => {
    const phoneA = '09121114455';
    const phoneB = '09129998877';

    // Verify phoneA
    await authRepo.requestOtp(phoneA);
    const verifyRes = await authRepo.verifyPhoneOwnership(phoneA, '123456');
    const tokenA = verifyRes.verificationToken!;

    // Attempt to book for phoneB using token for phoneA
    const input = createValidBookingInput(phoneB, tokenA);
    await expect(bookingRepo.submitBooking(input)).rejects.toThrow(
      'اعتبارسنجی شماره تلفن همراه نامعتبر است'
    );
  });

  it('enforces booking rate limit (max 3 bookings per hour per phone)', async () => {
    const phone = '09123332211';
    const times = ['10:00', '11:00', '12:00', '13:00'];

    for (let i = 0; i < 3; i++) {
      mockStorage.clearOtpState(phone);
      await authRepo.requestOtp(phone);
      const v = await authRepo.verifyPhoneOwnership(phone, '123456');
      const input = {
        ...createValidBookingInput(phone, v.verificationToken!),
        time: times[i],
      };
      const res = await bookingRepo.submitBooking(input);
      expect(res.appointment.id).toBeDefined();
    }

    // 4th booking within an hour must be rejected by booking repo
    const token4 = 'vtok-test-rate-limit-4';
    mockStorage.saveVerificationToken(phone, token4, Date.now() + 15 * 60 * 1000);
    const input4 = {
      ...createValidBookingInput(phone, token4),
      time: times[3],
    };
    await expect(bookingRepo.submitBooking(input4)).rejects.toThrow('بیش از حد مجاز در ساعت است');
  });
});
