import { describe, it, expect, beforeEach } from 'vitest';
import { mockStorage } from '../services/adapters/mock/mockStorage';
import { MockBookingRepository } from '../services/adapters/mock/MockBookingRepository';
import { MockAppointmentRepository } from '../services/adapters/mock/MockAppointmentRepository';
import { calculateAvailableSlots } from '../domain/slot';
import { canTransition } from '../domain/appointmentStatus';
import { SEED_CLINIC } from '../mocks/seed';
import type { Doctor } from '../domain/doctor';
import type { Actor } from '../domain/session';

describe('Logical Bug Fixes & Refactoring Verification', () => {
  beforeEach(() => {
    mockStorage.resetToSeed();
  });

  // Bug 1: State Machine Deadlock for Reception & Clinical Exit Flow
  describe('1. Reception Exit & Settlement Transitions', () => {
    it('allows reception to transition from in_clinic to completed and pending_payment', () => {
      expect(canTransition('in_clinic', 'completed', 'reception')).toBe(true);
      expect(canTransition('in_clinic', 'pending_payment', 'reception')).toBe(true);
      expect(canTransition('in_clinic', 'cancelled', 'reception')).toBe(true);
    });

    it('allows reception to settle pending_payment to completed', () => {
      expect(canTransition('pending_payment', 'completed', 'reception')).toBe(true);
    });
  });

  // Bug 2: Variable-Duration Time Slot Grid & Interval Collision Logic
  describe('2. Variable-Duration Time Slot Grid & Collision Logic', () => {
    const mockDoctor: Doctor = {
      id: 'd-test-var',
      clinicId: SEED_CLINIC.id,
      name: 'دکتر جراحی',
      specialty: 'پوست و مو',
      startHour: 10,
      endHour: 13, // 10:00 to 13:00 (180 mins)
      slotIntervalMinutes: 30,
      isActive: true,
    };

    it('rigorously checks collision for multi-slot treatments (e.g. 90 mins) against active bookings', () => {
      // Existing 45-minute appointment at 10:30 to 11:15
      const existing = [
        {
          id: 'apt-overlap',
          clinicId: SEED_CLINIC.id,
          trackingCode: 'AR-OVERLAP',
          date: '2026-10-25',
          time: '۱۰:۳۰', // Persian digits!
          clientName: 'بیمار همپوشان',
          clientPhone: '09121111111',
          serviceId: 's1',
          serviceName: 'بوتاکس',
          doctorId: 'd-test-var',
          doctorName: 'دکتر جراحی',
          durationMinutes: 45,
          price: 1500000,
          status: 'confirmed' as const,
          source: 'online_booking' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // A 90-minute treatment starting at 10:00 will run until 11:30 -> overlaps with 10:30-11:15!
      const slotsFor90MinService = calculateAvailableSlots({
        doctor: mockDoctor,
        serviceDurationMinutes: 90,
        existingAppointments: existing,
        date: '2026-10-25',
      });

      // 10:00 slot (10:00 - 11:30) overlaps with 10:30 - 11:15 -> MUST be unavailable
      const slot1000 = slotsFor90MinService.find((s) => s.rawTime === '10:00');
      expect(slot1000?.available).toBe(false);
      expect(slot1000?.reason).toBe('رزرو شده');

      // 10:30 slot (10:30 - 12:00) overlaps with 10:30 - 11:15 -> MUST be unavailable
      const slot1030 = slotsFor90MinService.find((s) => s.rawTime === '10:30');
      expect(slot1030?.available).toBe(false);

      // 11:00 slot (11:00 - 12:30) overlaps with 10:30 - 11:15 -> MUST be unavailable
      const slot1100 = slotsFor90MinService.find((s) => s.rawTime === '11:00');
      expect(slot1100?.available).toBe(false);

      // 11:30 slot (11:30 - 13:00) does NOT overlap (11:15 <= 11:30) -> MUST be available
      const slot1130 = slotsFor90MinService.find((s) => s.rawTime === '11:30');
      expect(slot1130?.available).toBe(true);
    });
  });

  // Bug 3: Patient Identity Collision (Shared Family Mobile Numbers)
  describe('3. Patient Identity Modeling (Shared Family Numbers)', () => {
    it('creates distinct client profiles when family members share a mobile phone with different names', async () => {
      const repo = new MockBookingRepository();
      const sharedPhone = '09129998877';

      // 1. Mother books appointment
      const motherToken = 'token-mother-123';
      mockStorage.saveVerificationToken(sharedPhone, motherToken);

      const booking1 = await repo.submitBooking({
        clinicId: SEED_CLINIC.id,
        doctorId: 'd1',
        serviceId: 's1',
        date: '2026-11-01',
        time: '18:00',
        clientName: 'مریم رضایی',
        clientPhone: sharedPhone,
        verificationToken: motherToken,
        captchaToken: 'mock-captcha-token',
      });

      // 2. Daughter books appointment with same phone number
      const daughterToken = 'token-daughter-456';
      mockStorage.saveVerificationToken(sharedPhone, daughterToken);

      const booking2 = await repo.submitBooking({
        clinicId: SEED_CLINIC.id,
        doctorId: 'd1',
        serviceId: 's1',
        date: '2026-11-01',
        time: '19:00',
        clientName: 'سارا رضایی',
        clientPhone: sharedPhone,
        verificationToken: daughterToken,
        captchaToken: 'mock-captcha-token',
      });

      // Verify that appointments have distinct client IDs
      expect(booking1.appointment.clientId).not.toBe(booking2.appointment.clientId);
      expect(booking1.appointment.clientName).toBe('مریم رضایی');
      expect(booking2.appointment.clientName).toBe('سارا رضایی');

      // Verify clients storage contains both records and links daughter to mother's profile
      const allClients = mockStorage.getClients();
      const motherClient = allClients.find((c) => c.name === 'مریم رضایی');
      const daughterClient = allClients.find((c) => c.name === 'سارا رضایی');

      expect(motherClient).toBeDefined();
      expect(daughterClient).toBeDefined();
      expect(motherClient?.id).not.toBe(daughterClient?.id);
      expect(daughterClient?.parentClientId).toBe(motherClient?.id);
    });
  });

  // Bug 4: OTP Verification Token Race Condition & Double-Submit Protection
  describe('4. OTP Verification Token Race Condition Protection', () => {
    it('locks token atomically so concurrent submissions with the same token fail with race protection', async () => {
      const phone = '09125554433';
      const token = 'token-race-test';
      mockStorage.saveVerificationToken(phone, token);

      // Verify lockToken locks atomically
      const lockedFirst = mockStorage.lockToken(phone, token);
      expect(lockedFirst).toBe(true);

      // Second attempt to lock concurrently must fail
      const lockedSecond = mockStorage.lockToken(phone, token);
      expect(lockedSecond).toBe(false);

      // Release lock
      mockStorage.releaseToken(token);
      const lockedAfterRelease = mockStorage.lockToken(phone, token);
      expect(lockedAfterRelease).toBe(true);
    });

    it('rejects double submission with already consumed or locked token', async () => {
      const repo = new MockBookingRepository();
      const phone = '09124443322';
      const token = 'token-double-submit';
      mockStorage.saveVerificationToken(phone, token);

      // First submission succeeds
      await repo.submitBooking({
        clinicId: SEED_CLINIC.id,
        doctorId: 'd1',
        serviceId: 's1',
        date: '2026-11-05',
        time: '14:00',
        clientName: 'کاربر تستی',
        clientPhone: phone,
        verificationToken: token,
        captchaToken: 'mock-captcha-token',
      });

      // Second submission with same token fails immediately
      await expect(
        repo.submitBooking({
          clinicId: SEED_CLINIC.id,
          doctorId: 'd1',
          serviceId: 's1',
          date: '2026-11-05',
          time: '15:00',
          clientName: 'کاربر تستی',
          clientPhone: phone,
          verificationToken: token,
          captchaToken: 'mock-captcha-token',
        })
      ).rejects.toThrow('اعتبارسنجی شماره تلفن همراه نامعتبر است، منقضی شده، یا در حال پردازش می‌باشد');
    });
  });

  // Bug 5: Audit Log Privacy Leak Prevention
  describe('5. Audit Log Privacy Leak Prevention', () => {
    it('records only sanitized metadata in audit log details and never exposes medical notes payload', async () => {
      const repo = new MockAppointmentRepository();
      const doctorActor: Actor = {
        userId: 'usr-naderi',
        userName: 'دکتر نادری',
        role: 'doctor',
        doctorId: 'd1',
        clinicId: SEED_CLINIC.id,
      };

      const sensitiveNote = 'بیمار دارای آلرژی شدید به لیدوکائین و سابقه جراحی بینی است.';

      // Get an appointment for d1 in SEED_CLINIC
      const apts = await repo.getAppointments(SEED_CLINIC.id, undefined, doctorActor);
      const targetApt = apts.find((a) => a.doctorId === 'd1');
      expect(targetApt).toBeDefined();

      // Update medical notes
      await repo.updateMedicalNotes(SEED_CLINIC.id, targetApt!.id, sensitiveNote, doctorActor);

      // Check audit logs
      const auditLogs = mockStorage.getAuditLogs().filter((l) => l.clinicId === SEED_CLINIC.id);
      const noteUpdateLog = auditLogs.find((l) => l.action === 'medical_notes.update');

      expect(noteUpdateLog).toBeDefined();
      expect(noteUpdateLog?.details).toContain(targetApt!.trackingCode || targetApt!.id);
      // STRICT ASSERTION: Sensitive note text MUST NOT exist in audit log details
      expect(noteUpdateLog?.details).not.toContain('آلرژی');
      expect(noteUpdateLog?.details).not.toContain('لیدوکائین');
      expect(noteUpdateLog?.details).not.toContain(sensitiveNote);
    });
  });
});
