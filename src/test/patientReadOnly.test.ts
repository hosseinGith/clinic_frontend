import { describe, it, expect, beforeEach } from 'vitest';
import { MockAppointmentRepository } from '../services/adapters/mock/MockAppointmentRepository';
import { mockStorage } from '../services/adapters/mock/mockStorage';
import { SEED_CLINIC } from '../mocks/seed';
import { can } from '../domain/permissions';
import type { Actor } from '../domain/session';

describe('Patient read-only enforcement', () => {
  let repo: MockAppointmentRepository;
  const clinicId = SEED_CLINIC.id;
  const patient: Actor = {
    userId: 'usr-patient',
    role: 'patient',
    clinicId,
    phone: '09121112233',
    clientId: 'c1',
  };

  beforeEach(() => {
    mockStorage.resetToSeed();
    repo = new MockAppointmentRepository();
  });

  it('patient permissions', () => {
    expect(can('patient', 'appointments:create')).toBe(false);
    expect(can('patient', 'appointments:update_status')).toBe(true);
    expect(can('patient', 'appointments:read')).toBe(false);
    expect(can('patient', 'appointments:read_own')).toBe(true);
  });

  it('patient cannot create appointment via repository', async () => {
    await expect(
      repo.createAppointment(
        clinicId,
        {
          clinicId,
          date: '2026-11-01',
          time: '10:00',
          clientName: 'x',
          clientPhone: '09121112233',
          serviceId: 's1',
          doctorId: 'd1',
          source: 'online_booking',
        },
        patient
      )
    ).rejects.toThrow('دسترسی غیرمجاز');
  });

  it('patient cannot update status via repository', async () => {
    await expect(
      repo.updateStatus(clinicId, 'apt-1', 'confirmed', patient)
    ).rejects.toThrow('دسترسی غیرمجاز');
  });

  it('patient only sees their own appointments', async () => {
    const list = await repo.getAppointments(clinicId, undefined, patient);
    expect(list.length).toBeGreaterThan(0);
    for (const apt of list) {
      const matchesPhone = apt.clientPhone === '09121112233';
      const matchesClient = apt.clientId === 'c1';
      expect(matchesPhone || matchesClient).toBe(true);
    }
  });
});
