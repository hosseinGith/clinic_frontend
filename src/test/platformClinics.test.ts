import { describe, it, expect, beforeEach } from 'vitest';
import { MockPlatformClinicRepository } from '../services/adapters/mock/MockPlatformClinicRepository';
import { MockPlatformAuthRepository } from '../services/adapters/mock/MockPlatformAuthRepository';

describe('Platform Clinic Repository & Operations (Phase 1 Contract)', () => {
  let clinicRepo: MockPlatformClinicRepository;
  let authRepo: MockPlatformAuthRepository;

  beforeEach(() => {
    clinicRepo = new MockPlatformClinicRepository();
    authRepo = new MockPlatformAuthRepository();
  });

  describe('MockPlatformAuthRepository', () => {
    it('sends OTP without revealing whether phone exists (zero user enumeration)', async () => {
      const res1 = await authRepo.sendOtp('09121110001');
      expect(res1.success).toBe(true);
      expect(res1.expiresIn).toBe(120);

      const res2 = await authRepo.sendOtp('09129999999');
      expect(res2.success).toBe(true);
      expect(res2.expiresIn).toBe(120);
    });

    it('rejects invalid Iranian phone formats', async () => {
      await expect(authRepo.sendOtp('12345')).rejects.toThrow('فرمت شماره موبایل نامعتبر است.');
    });

    it('locks out with 429 after 3 consecutive wrong OTP attempts', async () => {
      await authRepo.sendOtp('09121110001');

      await expect(authRepo.verifyOtp('09121110001', '00000')).rejects.toThrow('کد تأیید نامعتبر است');
      await expect(authRepo.verifyOtp('09121110001', '00001')).rejects.toThrow('کد تأیید نامعتبر است');
      await expect(authRepo.verifyOtp('09121110001', '00002')).rejects.toThrow('قفل گردیده است');

      // Next attempt must trigger 429 lockout
      await expect(authRepo.verifyOtp('09121110001', '123456')).rejects.toThrow('قفل گردیده است');
    });

    it('authenticates super_admin and restores session via refresh', async () => {
      await authRepo.sendOtp('09120000000');
      const authRes = await authRepo.verifyOtp('09120000000', '123456');
      expect(authRes.token).toBeDefined();
      expect(authRes.user.role).toBe('super_admin');

      const refreshRes = await authRepo.refreshSession();
      expect(refreshRes.token).toBeDefined();
      expect(refreshRes.user.phone).toBe('09120000000');
    });
  });

  describe('MockPlatformClinicRepository', () => {
    it('returns KPI summary according to Phase 1 backend contracts', async () => {
      const summary = await clinicRepo.getSummary();
      expect(summary.total).toBeGreaterThanOrEqual(2);
      expect(summary.active).toBeGreaterThanOrEqual(1);
      expect(typeof summary.suspended).toBe('number');
      expect(typeof summary.deleted).toBe('number');
      expect(typeof summary.createdLast30Days).toBe('number');
    });

    it('lists clinics with search, filter, and server-side pagination', async () => {
      const result = await clinicRepo.listClinics({
        page: 1,
        limit: 10,
        status: undefined,
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThanOrEqual(result.items.length);
      expect(result.page).toBe(1);

      const ariana = result.items.find((c: any) => c.slug === 'ariana');
      expect(ariana).toBeDefined();
      expect(ariana?.name).toContain('آریانا');
      expect(ariana?.owner?.name).toBeDefined();
      expect(ariana?.status).toBe('active');
    });

    it('rejects reserved slugs and duplicate slugs', async () => {
      await expect(
        clinicRepo.createClinic({
          slug: 'admin',
          name: 'تست رزرو',
          ownerName: 'دکتر تست',
          ownerPhone: '09128887766',
        }),
      ).rejects.toThrow('کلمات رزروشده سامانه است');

      await expect(
        clinicRepo.createClinic({
          slug: 'ariana',
          name: 'آریانا تکراری',
          ownerName: 'دکتر تست',
          ownerPhone: '09128887766',
        }),
      ).rejects.toThrow('کلینیکی با این شناسه انگلیسی (slug) از قبل وجود دارد');
    });

    it('creates new clinic atomically with owner information', async () => {
      const res = await clinicRepo.createClinic({
        slug: 'novin-teb',
        name: 'کلینیک تخصصی نوین طب',
        tagline: 'تخصصی قلب و عروق',
        phone: '02188887777',
        ownerName: 'دکتر نوین',
        ownerPhone: '09129990000',
      });

      expect(res.clinic.id).toBeDefined();
      expect(res.clinic.slug).toBe('novin-teb');
      expect(res.owner.name).toBe('دکتر نوین');
      expect(res.owner.phone).toBe('09129990000');
      expect(res.owner.role).toBe('owner');

      const details = await clinicRepo.getClinic(res.clinic.id);
      expect(details.slug).toBe('novin-teb');
      expect(details.name).toBe('کلینیک تخصصی نوین طب');
      expect(details.status).toBe('active');
      expect(details.owner?.name).toBe('دکتر نوین');
    });

    it('enforces status transition rules (active <-> suspended, active -> deleted, deleted -> active, etc.)', async () => {
      // 1. Suspend active clinic
      const suspended = await clinicRepo.updateClinicStatus('clinic-ariana', 'suspended');
      expect(suspended.status).toBe('suspended');

      // 2. Re-activate suspended clinic
      const activeAgain = await clinicRepo.updateClinicStatus('clinic-ariana', 'active');
      expect(activeAgain.status).toBe('active');

      // 3. Soft delete active clinic
      const deleted = await clinicRepo.updateClinicStatus('clinic-ariana', 'deleted');
      expect(deleted.status).toBe('deleted');

      // 4. Restore deleted clinic to active
      const restored = await clinicRepo.updateClinicStatus('clinic-ariana', 'active');
      expect(restored.status).toBe('active');
    });

    it('requires status to be deleted and exact slug confirmation for hard delete', async () => {
      // Trying to hard-delete an active clinic must fail
      await expect(clinicRepo.deleteClinic('clinic-shafa', 'shafa')).rejects.toThrow(
        'حذف دائمی کلینیک تنها پس از انتقال به وضعیت حذف‌شده (deleted) امکان‌پذیر است.',
      );

      // Transition to deleted first
      await clinicRepo.updateClinicStatus('clinic-shafa', 'deleted');

      // Wrong slug must fail
      await expect(clinicRepo.deleteClinic('clinic-shafa', 'wrong-slug')).rejects.toThrow(
        'شناسه انگلیسی واردشده برای تایید حذف با شناسه کلینیک مطابقت ندارد.',
      );

      // Correct slug succeeds
      const delRes = await clinicRepo.deleteClinic('clinic-shafa', 'shafa');
      expect(delRes.success).toBe(true);

      // Clinic must no longer be found
      await expect(clinicRepo.getClinic('clinic-shafa')).rejects.toThrow('یافت نشد');
    });
  });
});
