import { describe, it, expect, beforeEach } from 'vitest';
import { buildSeed } from '../mocks/seed';
import { mockStorage } from '../services/adapters/mock/mockStorage';
import { MockAppointmentRepository } from '../services/adapters/mock/MockAppointmentRepository';
import { MockClientRepository } from '../services/adapters/mock/MockClientRepository';
import { formatTimeFa, formatTrackingCodeFa, toEnglishDigits } from '../lib/format';
import { formatPhoneNumber } from '../lib/phone';

describe('Phase 2: Data Normalization, Seed & Formatting Rules', () => {
  const testDate = '2026-10-18';
  let aptRepo: MockAppointmentRepository;
  let clientRepo: MockClientRepository;

  beforeEach(() => {
    mockStorage.resetToSeed();
    aptRepo = new MockAppointmentRepository();
    clientRepo = new MockClientRepository();
  });

  describe('buildSeed Structure & Validation', () => {
    it('generates exactly 24 appointments for today', () => {
      const seed = buildSeed(testDate);
      const todayApts = seed.appointments.filter((a) => a.date === testDate);
      expect(todayApts).toHaveLength(24);
    });

    it('has all valid HH:mm times with valid minutes (< 60) within working hours 9:00 - 20:00', () => {
      const seed = buildSeed(testDate);
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

      for (const apt of seed.appointments) {
        // Must be canonical Latin digits
        expect(apt.time).toMatch(timeRegex);

        const [h, m] = apt.time.split(':').map(Number);
        const startMinutes = h * 60 + m;
        const endMinutes = startMinutes + apt.durationMinutes;

        // Must be within doctor working hours: 09:00 (540) to 20:00 (1200)
        expect(startMinutes).toBeGreaterThanOrEqual(9 * 60);
        expect(endMinutes).toBeLessThanOrEqual(20 * 60);

        // Canonical trackingCode format AR-xxxx with Latin digits
        expect(apt.trackingCode).toMatch(/^AR-\d+$/);

        // Canonical clientPhone starting with 09 and Latin digits
        expect(apt.clientPhone).toMatch(/^09\d{9}$/);
      }
    });

    it('has zero overlapping appointments for the same doctor on the same day', () => {
      const seed = buildSeed(testDate);
      const aptsByDoctorAndDate = new Map<string, typeof seed.appointments>();

      for (const apt of seed.appointments) {
        const key = `${apt.doctorId}_${apt.date}`;
        const list = aptsByDoctorAndDate.get(key) || [];
        list.push(apt);
        aptsByDoctorAndDate.set(key, list);
      }

      for (const [, list] of aptsByDoctorAndDate.entries()) {
        const intervals = list.map((a) => {
          const [h, m] = a.time.split(':').map(Number);
          const start = h * 60 + m;
          const end = start + a.durationMinutes;
          return { id: a.id, start, end };
        });

        // Check each pair for overlap: startA < endB && endA > startB
        for (let i = 0; i < intervals.length; i++) {
          for (let j = i + 1; j < intervals.length; j++) {
            const a = intervals[i];
            const b = intervals[j];
            const hasOverlap = a.start < b.end && a.end > b.start;
            expect(hasOverlap, `Conflict detected between ${a.id} and ${b.id}`).toBe(false);
          }
        }
      }
    });

    it('contains between 5 to 8 appointments for tomorrow', () => {
      const seed = buildSeed(testDate);
      const tomorrowApts = seed.appointments.filter((a) => a.date > testDate);
      expect(tomorrowApts.length).toBeGreaterThanOrEqual(5);
      expect(tomorrowApts.length).toBeLessThanOrEqual(8);
    });

    it('includes patient user client ID c1 inside SEED_CLIENTS with Latin phone', () => {
      const seed = buildSeed(testDate);
      const clientC1 = seed.clients.find((c) => c.id === 'c1');
      expect(clientC1).toBeDefined();
      expect(clientC1?.phone).toMatch(/^09\d{9}$/);
    });
  });

  describe('Storage Date Rollover & Fresh Seed Generation', () => {
    it('refreshes seed appointments when date changes while preserving custom user appointments', () => {
      // Save an appointment for yesterday under a previous seed_date
      mockStorage.setSeedDate('2026-10-17');
      const customUserApt = {
        id: 'apt-custom-user-1',
        clinicId: 'clinic-ariana',
        trackingCode: 'AR-9999',
        date: testDate,
        time: '18:00',
        clientName: 'کاربر تستی جدید',
        clientPhone: '09129990000',
        serviceId: 's1',
        serviceName: 'بوتاکس',
        doctorId: 'd1',
        doctorName: 'دکتر نادری',
        durationMinutes: 30,
        price: 4500000,
        status: 'confirmed' as const,
        source: 'online_booking' as const,
        createdAt: '2026-10-18T10:00:00Z',
        updatedAt: '2026-10-18T10:00:00Z',
      };
      mockStorage.saveAppointments([customUserApt]);

      // Calling getAppointments triggers rollover to today's seed
      const apts = mockStorage.getAppointments();
      expect(apts.length).toBeGreaterThanOrEqual(24);
      // User created appointment must be preserved
      expect(apts.some((a) => a.id === 'apt-custom-user-1')).toBe(true);
    });
  });

  describe('Search with Persian & English digits', () => {
    it('finds appointments when search query contains Persian digits ۰۹۱۲', async () => {
      const results = await aptRepo.getAppointments('clinic-ariana', { search: '۰۹۱۲' });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((a) => a.clientPhone.includes('0912') || toEnglishDigits(a.clientPhone).includes('0912'))).toBe(true);
    });

    it('finds clients when searching with Persian digits', async () => {
      const clients = await clientRepo.getClients('clinic-ariana', '۰۹۱۲');
      expect(clients.length).toBeGreaterThan(0);
    });
  });

  describe('Formatting Helpers in lib/format.ts', () => {
    it('formats time to Latin digits with formatTimeFa', () => {
      expect(formatTimeFa('09:00')).toBe('09:00');
      expect(formatTimeFa('14:30')).toBe('14:30');
    });

    it('formats tracking code to Latin digits with formatTrackingCodeFa', () => {
      expect(formatTrackingCodeFa('AR-8492')).toBe('AR-8492');
    });

    it('formats phone numbers using formatPhoneNumber in Latin digits', () => {
      expect(formatPhoneNumber('09121112233')).toBe('0912 111 2233');
    });
  });
});
