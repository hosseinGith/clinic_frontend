import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockBookingRepository } from '../services/adapters/mock/MockBookingRepository';
import { MockCatalogRepository } from '../services/adapters/mock/MockCatalogRepository';
import { mockStorage } from '../services/adapters/mock/mockStorage';
import { SEED_CLINIC } from '../mocks/seed';
import type { BookingSubmissionInput } from '../services/repositories/IBookingRepository';

import { getTodayDateString } from '../lib/jalali';

describe('Phase 3: Booking Flow & Hardening', () => {
  let bookingRepo: MockBookingRepository;
  let catalogRepo: MockCatalogRepository;
  const clinicId = SEED_CLINIC.id;

  beforeEach(() => {
    mockStorage.resetToSeed();
    bookingRepo = new MockBookingRepository();
    catalogRepo = new MockCatalogRepository();
  });

  const createInput = (overrides: Partial<BookingSubmissionInput> = {}): BookingSubmissionInput => ({
    clinicId,
    serviceId: 's1',
    doctorId: 'd1',
    date: getTodayDateString(),
    time: '18:30',
    clientName: 'نیلوفر راد',
    clientPhone: '09124445566',
    verificationToken: 'valid-vtok-test',
    captchaToken: 'mock-captcha-token-valid',
    ...overrides,
  });

  describe('1. Phone Verification Token Preservation on Failures', () => {
    it('does not consume verification token when a booking conflict occurs', async () => {
      const phone = '09124445566';
      mockStorage.saveVerificationToken(phone, 'tok-conflict-test', Date.now() + 15 * 60 * 1000);

      // Book an initial appointment at 10:30 with doctor d1
      const initialInput = createInput({
        time: '10:30',
        verificationToken: 'tok-conflict-test',
        clientPhone: phone,
      });

      // Cause a conflict by attempting to book the exact same slot that is already booked in seed
      // (seed has apt-1 at 09:00, apt-2 at 10:30 with d1)
      await expect(bookingRepo.submitBooking(initialInput)).rejects.toThrow(
        'این ساعت توسط کاربر دیگری رزرو شد'
      );

      // Verify the token is STILL valid and NOT consumed because the booking failed!
      expect(mockStorage.isTokenValid(phone, 'tok-conflict-test')).toBe(true);

      // The user can now use the SAME token to book a non-conflicting time (18:30)
      const nonConflictingInput = createInput({
        time: '18:30',
        verificationToken: 'tok-conflict-test',
        clientPhone: phone,
      });

      const result = await bookingRepo.submitBooking(nonConflictingInput);
      expect(result.appointment.id).toBeDefined();

      // After a SUCCESSFUL booking, the token IS consumed
      expect(mockStorage.isTokenValid(phone, 'tok-conflict-test')).toBe(false);
    });

    it('does not consume rate limit on failed booking', async () => {
      const phone = '09128889900';
      mockStorage.saveVerificationToken(phone, 'tok-rate-limit-test', Date.now() + 15 * 60 * 1000);

      const beforeCount = mockStorage.getRecentBookingCount(phone, 60);

      // Attempt conflicting booking
      const conflictingInput = createInput({
        time: '09:00', // d1 already has appointment at 09:00
        verificationToken: 'tok-rate-limit-test',
        clientPhone: phone,
      });

      await expect(bookingRepo.submitBooking(conflictingInput)).rejects.toThrow(
        'این ساعت توسط کاربر دیگری رزرو شد'
      );

      const afterCount = mockStorage.getRecentBookingCount(phone, 60);
      expect(afterCount).toBe(beforeCount);
    });
  });

  describe('2. Captcha Token Validation', () => {
    it('rejects booking submission when captchaToken is missing or empty', async () => {
      const phone = '09121112244';
      mockStorage.saveVerificationToken(phone, 'tok-captcha-test', Date.now() + 15 * 60 * 1000);

      const inputWithoutCaptcha = createInput({
        verificationToken: 'tok-captcha-test',
        clientPhone: phone,
        captchaToken: '',
      });

      await expect(bookingRepo.submitBooking(inputWithoutCaptcha)).rejects.toThrow(
        'کپچا'
      );
    });

    it('HttpBookingRepository includes captcha_token in request payload', async () => {
      const { HttpBookingRepository } = await import('../services/adapters/http');
      let sentBody: any = null;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
        sentBody = JSON.parse(options.body as string);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            appointment: {
              id: 'apt-http-1',
              clinic_id: clinicId,
              tracking_code: 'AR-7777',
              date: '2026-10-18',
              time: '18:00',
              client_name: 'آرزو',
              client_phone: '09121112233',
              service_id: 's1',
              service_name: 'بوتاکس',
              doctor_id: 'd1',
              doctor_name: 'دکتر نادری',
              duration_minutes: 30,
              price: 4500000,
              status: 'pending_confirmation',
              source: 'online_booking',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            tracking_code: 'AR-7777',
          }),
        };
      });

      try {
        const httpBookingRepo = new HttpBookingRepository();
        const res = await httpBookingRepo.submitBooking(createInput({ captchaToken: 'turnstile-token-xyz' }));
        expect(res.trackingCode).toBe('AR-7777');
        expect(sentBody?.captcha_token).toBe('turnstile-token-xyz');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('3. Clinic Slug Resolution via Catalog Repository', () => {
    it('returns clinic for valid slug "ariana" and null for invalid slug', async () => {
      const validClinic = await catalogRepo.getClinicBySlug('ariana');
      expect(validClinic).not.toBeNull();
      expect(validClinic?.slug).toBe('ariana');

      const invalidClinic = await catalogRepo.getClinicBySlug('non-existent-clinic-slug');
      expect(invalidClinic).toBeNull();
    });
  });

  describe('4. Client Upserting on Booking', () => {
    it('upserts a new client with status new and assigns clientId to the appointment', async () => {
      const newPhone = '09127776655';
      mockStorage.saveVerificationToken(newPhone, 'tok-upsert-client', Date.now() + 15 * 60 * 1000);

      const input = createInput({
        clientName: 'سارا کاظمی',
        clientPhone: newPhone,
        verificationToken: 'tok-upsert-client',
        time: '19:00',
      });

      const res = await bookingRepo.submitBooking(input);
      expect(res.appointment.clientId).toBeDefined();

      const clients = mockStorage.getClients();
      const client = clients.find((c) => c.phone === newPhone);
      expect(client).toBeDefined();
      expect(client?.name).toBe('سارا کاظمی');
      expect(client?.status).toBe('new');
      expect(res.appointment.clientId).toBe(client?.id);
    });
  });
});
