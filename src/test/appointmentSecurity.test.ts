import { describe, it, expect, beforeEach } from 'vitest';
import { MockAppointmentRepository } from '../services/adapters/mock/MockAppointmentRepository';
import { mockStorage } from '../services/adapters/mock/mockStorage';
import { SEED_CLINIC } from '../mocks/seed';
import type { Actor } from '../domain/session';

describe('Appointment Repository Security & Ownership Rules', () => {
  let aptRepo: MockAppointmentRepository;
  const clinicId = SEED_CLINIC.id; // 'clinic-ariana'

  beforeEach(() => {
    mockStorage.resetToSeed();
    aptRepo = new MockAppointmentRepository();
  });

  describe('Doctor Fail-Closed Policy', () => {
    it('returns empty list for doctor without doctorId in getAppointments', async () => {
      const doctorWithoutId: Actor = {
        userId: 'usr-doc-ghost',
        role: 'doctor',
        clinicId,
      };

      const res = await aptRepo.getAppointments(clinicId, {}, doctorWithoutId);
      expect(res).toEqual([]);
    });

    it('returns empty list for doctor without doctorId in getTodayQueue', async () => {
      const doctorWithoutId: Actor = {
        userId: 'usr-doc-ghost',
        role: 'doctor',
        clinicId,
      };

      const queue = await aptRepo.getTodayQueue(clinicId, undefined, doctorWithoutId);
      expect(queue).toEqual([]);
    });

    it('returns null for doctor without doctorId in getAppointmentById', async () => {
      const doctorWithoutId: Actor = {
        userId: 'usr-doc-ghost',
        role: 'doctor',
        clinicId,
      };

      const apt = await aptRepo.getAppointmentById(clinicId, 'apt-1', doctorWithoutId);
      expect(apt).toBeNull();
    });

    it('returns only treating doctor appointments when doctorId is provided', async () => {
      const doctorActor: Actor = {
        userId: 'usr-naderi',
        role: 'doctor',
        clinicId,
        doctorId: 'd1',
      };

      const res = await aptRepo.getAppointments(clinicId, {}, doctorActor);
      expect(res.length).toBeGreaterThan(0);
      expect(res.every((a) => a.doctorId === 'd1')).toBe(true);
    });
  });

  describe('Ownership Rules for Status & Medical Notes Updates', () => {
    it('allows doctor to update status of their own appointment', async () => {
      const doctor1: Actor = {
        userId: 'usr-naderi',
        role: 'doctor',
        clinicId,
        doctorId: 'd1', // apt-1 has doctorId 'd1'
      };

      // Set apt-1 to confirmed first so doctor can move to in_clinic
      const apts = mockStorage.getAppointments();
      const apt1 = apts.find((a) => a.id === 'apt-1');
      if (apt1) {
        apt1.status = 'confirmed';
        mockStorage.saveAppointments(apts);
      }

      await expect(
        aptRepo.updateStatus(clinicId, 'apt-1', 'in_clinic', doctor1)
      ).resolves.not.toThrow();

      const updated = await aptRepo.getAppointmentById(clinicId, 'apt-1', doctor1);
      expect(updated?.status).toBe('in_clinic');
    });

    it('prevents doctor from updating status of another doctor appointment', async () => {
      const doctor2: Actor = {
        userId: 'usr-bahrami',
        role: 'doctor',
        clinicId,
        doctorId: 'd2', // apt-1 is d1
      };

      await expect(
        aptRepo.updateStatus(clinicId, 'apt-1', 'in_clinic', doctor2)
      ).rejects.toThrow('دسترسی غیرمجاز: پزشک تنها مجاز به مدیریت نوبت‌های خود می‌باشد.');
    });

    it('allows doctor to update medical notes of their own appointment', async () => {
      const doctor1: Actor = {
        userId: 'usr-naderi',
        role: 'doctor',
        clinicId,
        doctorId: 'd1',
      };

      await expect(
        aptRepo.updateMedicalNotes(clinicId, 'apt-1', 'وضعیت پوست پس از درمان بهبود یافته است.', doctor1)
      ).resolves.not.toThrow();
    });

    it('prevents doctor from updating medical notes of another doctor appointment', async () => {
      const doctor2: Actor = {
        userId: 'usr-bahrami',
        role: 'doctor',
        clinicId,
        doctorId: 'd2',
      };

      await expect(
        aptRepo.updateMedicalNotes(clinicId, 'apt-1', 'یادداشت غیرمجاز', doctor2)
      ).rejects.toThrow('دسترسی غیرمجاز: پزشک تنها مجاز به ثبت یادداشت در نوبت‌های خود می‌باشد.');
    });

    it('allows patient to cancel their own appointment', async () => {
      const patientActor: Actor = {
        userId: 'usr-patient',
        role: 'patient',
        clinicId,
        phone: '09121112233', // Matches apt-1
      };

      await expect(
        aptRepo.updateStatus(clinicId, 'apt-1', 'cancelled', patientActor)
      ).resolves.not.toThrow();
    });

    it('prevents patient from cancelling another patient appointment', async () => {
      const otherPatient: Actor = {
        userId: 'usr-patient-other',
        role: 'patient',
        clinicId,
        phone: '09129999999', // Does NOT match apt-1
      };

      await expect(
        aptRepo.updateStatus(clinicId, 'apt-1', 'cancelled', otherPatient)
      ).rejects.toThrow('دسترسی غیرمجاز: بیمار تنها مجاز به مدیریت نوبت خود می‌باشد.');
    });
  });

  describe('Medical Notes Visibility Redaction', () => {
    it('strips medicalNotes for reception role across all read queries', async () => {
      const receptionActor: Actor = {
        userId: 'usr-sara',
        role: 'reception',
        clinicId,
      };

      const listRes = await aptRepo.getAppointments(clinicId, {}, receptionActor);
      expect(listRes.every((a) => a.medicalNotes === undefined)).toBe(true);

      const single = await aptRepo.getAppointmentById(clinicId, 'apt-1', receptionActor);
      expect(single?.medicalNotes).toBeUndefined();

      const queue = await aptRepo.getTodayQueue(clinicId, undefined, receptionActor);
      expect(queue.every((a) => a.medicalNotes === undefined)).toBe(true);
    });

    it('strips medicalNotes for admin and patient roles', async () => {
      const adminActor: Actor = {
        userId: 'usr-admin',
        role: 'admin',
        clinicId,
      };

      const singleAdmin = await aptRepo.getAppointmentById(clinicId, 'apt-1', adminActor);
      expect(singleAdmin?.medicalNotes).toBeUndefined();

      const patientActor: Actor = {
        userId: 'usr-patient',
        role: 'patient',
        clinicId,
        phone: '09121112233',
      };

      const singlePatient = await aptRepo.getAppointmentById(clinicId, 'apt-1', patientActor);
      expect(singlePatient?.medicalNotes).toBeUndefined();
    });

    it('allows owner to see exact medicalNotes text', async () => {
      const exactNote = 'سابقه حساسیت به لیدوکائین و مصرف آسپرین';
      mockStorage.saveMedicalNote('apt-1', exactNote);

      const ownerActor: Actor = {
        userId: 'usr-owner',
        role: 'owner',
        clinicId,
      };

      const single = await aptRepo.getAppointmentById(clinicId, 'apt-1', ownerActor);
      expect(single).not.toBeNull();
      expect(single?.medicalNotes).toBe(exactNote);
    });

    it('allows treating doctor of appointment to see exact medicalNotes text', async () => {
      const exactNote = 'سابقه حساسیت به لیدوکائین و مصرف آسپرین';
      mockStorage.saveMedicalNote('apt-1', exactNote);

      const treatingDoctor: Actor = {
        userId: 'usr-naderi',
        role: 'doctor',
        clinicId,
        doctorId: 'd1', // apt-1 treating doctor
      };

      const single = await aptRepo.getAppointmentById(clinicId, 'apt-1', treatingDoctor);
      expect(single).not.toBeNull();
      expect(single?.medicalNotes).toBe(exactNote);
    });

    it('denies other doctor from seeing appointment or updating medical notes', async () => {
      const exactNote = 'سابقه حساسیت به لیدوکائین و مصرف آسپرین';
      mockStorage.saveMedicalNote('apt-1', exactNote);

      const otherDoctor: Actor = {
        userId: 'usr-bahrami',
        role: 'doctor',
        clinicId,
        doctorId: 'd2', // apt-1 has doctorId d1
      };

      const single = await aptRepo.getAppointmentById(clinicId, 'apt-1', otherDoctor);
      expect(single).toBeNull();

      await expect(
        aptRepo.updateMedicalNotes(clinicId, 'apt-1', 'تلاش نفوذ دیگر پزشک', otherDoctor)
      ).rejects.toThrow('دسترسی غیرمجاز: پزشک تنها مجاز به ثبت یادداشت در نوبت‌های خود می‌باشد.');
    });
  });
});
