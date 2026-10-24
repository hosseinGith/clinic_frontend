import { describe, it, expect } from 'vitest';
import { calculateAvailableSlots } from '../domain/slot';
import type { Doctor } from '../domain/doctor';
import type { Appointment } from '../domain/appointment';

describe('Available Time Slots Calculation', () => {
  const mockDoctor: Doctor = {
    id: 'd1',
    clinicId: 'c1',
    name: 'دکتر تست',
    specialty: 'پوست',
    startHour: 9,
    endHour: 12,
    slotIntervalMinutes: 60,
    isActive: true,
  };

  it('generates all slots as available when no existing appointments exist', () => {
    const slots = calculateAvailableSlots({
      doctor: mockDoctor,
      serviceDurationMinutes: 60,
      existingAppointments: [],
      date: '2026-10-20',
    });

    // 09:00, 09:30, 10:00, 10:30, 11:00 (with step <= 30 min and 60 min service)
    expect(slots.length).toBe(5);
    expect(slots.every((s) => s.available)).toBe(true);
    expect(slots[0].rawTime).toBe('09:00');
  });

  it('marks a slot as unavailable if there is an overlapping active appointment', () => {
    const existing: Appointment[] = [
      {
        id: 'apt-test',
        clinicId: 'c1',
        trackingCode: 'AR-1000',
        date: '2026-10-20',
        time: '۰۹:۰۰',
        clientName: 'مراجع تست',
        clientPhone: '09120000000',
        serviceId: 's1',
        serviceName: 'بوتاکس',
        doctorId: 'd1',
        doctorName: 'دکتر تست',
        durationMinutes: 60,
        price: 1000,
        status: 'confirmed',
        source: 'online_booking',
        createdAt: '2026-10-20T08:00:00Z',
        updatedAt: '2026-10-20T08:00:00Z',
      },
    ];

    const slots = calculateAvailableSlots({
      doctor: mockDoctor,
      serviceDurationMinutes: 60,
      existingAppointments: existing,
      date: '2026-10-20',
    });

    // 09:00 (09:00-10:00) overlaps with apt (09:00-10:00) -> unavailable
    expect(slots[0].available).toBe(false);
    expect(slots[0].reason).toBe('رزرو شده');
    // 09:30 (09:30-10:30) overlaps with apt (09:00-10:00) -> unavailable
    expect(slots[1].available).toBe(false);
    // 10:00 (10:00-11:00) does not overlap -> available
    expect(slots[2].available).toBe(true);
  });

  it('ignores cancelled appointments when checking collision', () => {
    const existing: Appointment[] = [
      {
        id: 'apt-cancelled',
        clinicId: 'c1',
        trackingCode: 'AR-1000',
        date: '2026-10-20',
        time: '۰۹:۰۰',
        clientName: 'مراجع لغوشده',
        clientPhone: '09120000000',
        serviceId: 's1',
        serviceName: 'بوتاکس',
        doctorId: 'd1',
        doctorName: 'دکتر تست',
        durationMinutes: 60,
        price: 1000,
        status: 'cancelled',
        source: 'online_booking',
        createdAt: '2026-10-20T08:00:00Z',
        updatedAt: '2026-10-20T08:00:00Z',
      },
    ];

    const slots = calculateAvailableSlots({
      doctor: mockDoctor,
      serviceDurationMinutes: 60,
      existingAppointments: existing,
      date: '2026-10-20',
    });

    expect(slots[0].available).toBe(true);
  });
});
