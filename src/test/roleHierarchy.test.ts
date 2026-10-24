import { describe, it, expect, beforeEach } from 'vitest';
import { MockAuthRepository } from '../services/adapters/mock/MockAuthRepository';
import { mockStorage } from '../services/adapters/mock/mockStorage';
import { SEED_CLINIC } from '../mocks/seed';
import type { Actor } from '../domain/session';

describe('Role Hierarchy & Admin Enforcement Rules', () => {
  let authRepo: MockAuthRepository;
  const clinicId = SEED_CLINIC.id;

  const ownerActor: Actor = {
    userId: 'usr-owner',
    userName: 'دکتر کاوه آریا',
    role: 'owner',
    clinicId,
  };

  const adminActor: Actor = {
    userId: 'usr-admin',
    userName: 'مریم کمالی',
    role: 'admin',
    clinicId,
  };

  beforeEach(() => {
    mockStorage.resetToSeed();
    authRepo = new MockAuthRepository();
  });

  describe('Admin Restrictions', () => {
    it('prevents admin from creating a user with owner role', async () => {
      await expect(
        authRepo.createUser(
          clinicId,
          {
            name: 'مالک جدید',
            phone: '09128881111',
            role: 'owner',
            roleTitle: 'مالک',
          },
          adminActor
        )
      ).rejects.toThrow('مدیر عملیات مجاز به ایجاد کاربر با نقش مدیر ارشد یا مدیر عملیات نمی‌باشد.');
    });

    it('prevents admin from creating a user with admin role', async () => {
      await expect(
        authRepo.createUser(
          clinicId,
          {
            name: 'ادمین جدید',
            phone: '09128882222',
            role: 'admin',
            roleTitle: 'مدیر سیستم',
          },
          adminActor
        )
      ).rejects.toThrow('مدیر عملیات مجاز به ایجاد کاربر با نقش مدیر ارشد یا مدیر عملیات نمی‌باشد.');
    });

    it('allows admin to create a reception user', async () => {
      const newUser = await authRepo.createUser(
        clinicId,
        {
          name: 'پذیرش جدید',
          phone: '09128883333',
          role: 'reception',
          roleTitle: 'پذیرش کلینیک',
        },
        adminActor
      );
      expect(newUser.id).toBeDefined();
      expect(newUser.role).toBe('reception');
    });

    it('prevents admin from modifying role of an existing owner or admin', async () => {
      // Trying to change owner's role
      await expect(
        authRepo.updateUserRole(clinicId, 'usr-owner', 'reception', adminActor)
      ).rejects.toThrow('مدیر عملیات مجاز به ویرایش نقش مدیر ارشد یا سایر مدیران نمی‌باشد.');
    });

    it('prevents admin from toggling active status of an owner or admin', async () => {
      // Trying to deactivate owner
      await expect(
        authRepo.toggleUserStatus(clinicId, 'usr-owner', adminActor)
      ).rejects.toThrow('مدیر عملیات مجاز به تغییر وضعیت حساب مدیر ارشد یا سایر مدیران نمی‌باشد.');
    });

    it('prevents admin from promoting someone to owner or admin', async () => {
      await expect(
        authRepo.updateUserRole(clinicId, 'usr-sara', 'owner', adminActor)
      ).rejects.toThrow('مدیر عملیات مجاز به ارتقای کاربران به نقش مدیر ارشد یا مدیر عملیات نمی‌باشد.');
    });
  });

  describe('Self-Action & Demotion Safeguards', () => {
    it('prevents any user from changing their own role', async () => {
      await expect(
        authRepo.updateUserRole(clinicId, 'usr-admin', 'reception', adminActor)
      ).rejects.toThrow('امکان تغییر سطح دسترسی حساب کاربری خودتان وجود ندارد.');

      await expect(
        authRepo.updateUserRole(clinicId, 'usr-owner', 'doctor', ownerActor)
      ).rejects.toThrow('امکان تغییر سطح دسترسی حساب کاربری خودتان وجود ندارد.');
    });

    it('prevents any user from deactivating their own account', async () => {
      await expect(
        authRepo.toggleUserStatus(clinicId, 'usr-admin', adminActor)
      ).rejects.toThrow('امکان غیرفعال‌سازی حساب کاربری خودتان وجود ندارد.');

      await expect(
        authRepo.toggleUserStatus(clinicId, 'usr-owner', ownerActor)
      ).rejects.toThrow('امکان غیرفعال‌سازی حساب کاربری خودتان وجود ندارد.');
    });

    it('prevents deactivating or demoting the last remaining owner', async () => {
      // Create a second owner first
      const owner2 = await authRepo.createUser(
        clinicId,
        {
          name: 'مالک دوم',
          phone: '09127778899',
          role: 'owner',
          roleTitle: 'مالک دوم',
        },
        ownerActor
      );

      // Now we have 2 owners. Demoting owner2 should work
      await expect(
        authRepo.updateUserRole(clinicId, owner2.id, 'reception', ownerActor)
      ).resolves.not.toThrow();

      // Now only 1 owner left (usr-owner). Deactivating the last owner should fail
      const adminOther: Actor = {
        userId: 'usr-admin-other',
        role: 'owner',
        clinicId,
      };
      await expect(
        authRepo.updateUserRole(clinicId, 'usr-owner', 'reception', adminOther)
      ).rejects.toThrow('امکان تنزل نقش آخرین مدیر ارشد (Owner) کلینیک وجود ندارد.');

      await expect(
        authRepo.toggleUserStatus(clinicId, 'usr-owner', adminOther)
      ).rejects.toThrow('امکان غیرفعال‌سازی آخرین مدیر ارشد (Owner) کلینیک وجود ندارد.');
    });
  });

  describe('Doctor Role DoctorId Requirement', () => {
    it('requires doctorId when creating user with role doctor', async () => {
      await expect(
        authRepo.createUser(
          clinicId,
          {
            name: 'پزشک جدید',
            phone: '09124445566',
            role: 'doctor',
            roleTitle: 'پزشک معالج',
          },
          ownerActor
        )
      ).rejects.toThrow('انتخاب پزشک معالج برای نقش پزشک متخصص الزامی است.');
    });

    it('successfully creates doctor user when doctorId is provided', async () => {
      const doc = await authRepo.createUser(
        clinicId,
        {
          name: 'پزشک جدید',
          phone: '09124445566',
          role: 'doctor',
          roleTitle: 'پزشک معالج',
          doctorId: 'd1',
        },
        ownerActor
      );
      expect(doc.role).toBe('doctor');
      expect(doc.doctorId).toBe('d1');
    });

    it('requires doctorId when changing existing user role to doctor', async () => {
      await expect(
        authRepo.updateUserRole(clinicId, 'usr-sara', 'doctor', ownerActor)
      ).rejects.toThrow('تخصیص شناسه پزشک معالج برای نقش پزشک الزامی است.');
    });

    it('successfully updates user to doctor role when doctorId is provided', async () => {
      const updated = await authRepo.updateUserRole(clinicId, 'usr-sara', 'doctor', ownerActor, 'd2');
      expect(updated.role).toBe('doctor');
      expect(updated.doctorId).toBe('d2');
    });
  });
});
