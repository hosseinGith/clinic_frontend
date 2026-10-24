import type {
  IBookingRepository,
  BookingSubmissionInput,
} from '../../repositories/IBookingRepository';
import type { TimeSlot } from '../../../domain/slot';
import type { Appointment } from '../../../domain/appointment';
import { calculateAvailableSlots } from '../../../domain/slot';
import { mockStorage, simulateDelay } from './mockStorage';
import { toEnglishDigits } from '../../../lib/format';
import { normalizePhoneNumber } from '../../../lib/phone';
import { MockAutomationRepository } from './MockAutomationRepository';

export class MockBookingRepository implements IBookingRepository {
  private automationRepo = new MockAutomationRepository();

  async getAvailableSlots(params: {
    clinicId: string;
    doctorId: string;
    serviceId: string;
    date: string;
  }): Promise<TimeSlot[]> {
    await simulateDelay(60);
    const { doctorId, serviceId, date, clinicId } = params;

    const doctor = mockStorage.getDoctors().find((d) => d.clinicId === clinicId && d.id === doctorId);
    const service = mockStorage.getServices().find((s) => s.clinicId === clinicId && s.id === serviceId);

    if (!doctor || !service) {
      return [];
    }

    const appointments = mockStorage.getAppointments().filter((a) => a.clinicId === clinicId);

    return calculateAvailableSlots({
      doctor,
      serviceDurationMinutes: service.duration,
      existingAppointments: appointments,
      date,
    });
  }

  async submitBooking(input: BookingSubmissionInput): Promise<{
    appointment: Appointment;
    trackingCode: string;
  }> {
    await simulateDelay(100);
    const {
      clinicId,
      serviceId,
      doctorId,
      date,
      time,
      clientName,
      clientPhone,
      notes,
      medicalNotes,
      verificationToken,
      captchaToken,
    } = input;

    const normalizedPhone = normalizePhoneNumber(clientPhone);

    // 1. Enforce atomic OTP phone verification token lock to protect against race condition / double-submit
    if (!verificationToken || !mockStorage.lockToken(normalizedPhone, verificationToken)) {
      throw new Error(
        'اعتبارسنجی شماره تلفن همراه نامعتبر است، منقضی شده، یا در حال پردازش می‌باشد. لطفاً مجدداً بررسی فرمایید.'
      );
    }

    try {
      // 2. Validate captcha
      if (!captchaToken || !captchaToken.trim()) {
        throw new Error('کپچا الزامی است یا اعتبارسنجی آن ناموفق بود.');
      }

      // 3. Validate service and doctor
      const service = mockStorage.getServices().find((s) => s.clinicId === clinicId && s.id === serviceId);
      const doctor = mockStorage.getDoctors().find((d) => d.clinicId === clinicId && d.id === doctorId);

      if (!service || !doctor) {
        throw new Error('خدمت یا پزشک انتخاب‌شده در سیستم معتبر نیست.');
      }

      // 4. Check rate limit (max 3 bookings per hour per normalized phone)
      const recentCount = mockStorage.getRecentBookingCount(normalizedPhone, 60);
      if (recentCount >= 3) {
        throw new Error(
          'تعداد درخواست‌های رزرو از این شماره بیش از حد مجاز در ساعت است (حداکثر 3 نوبت). لطفاً بعداً تلاش فرمایید.'
        );
      }

      // 5. Double check conflict before committing
      const appointments = mockStorage.getAppointments();
      const canonicalTime = toEnglishDigits(time).trim();
      const [h, m] = canonicalTime.split(':').map(Number);
      const targetStart = h * 60 + m;
      const targetEnd = targetStart + service.duration;

      const conflict = appointments.some((a) => {
        if (a.clinicId !== clinicId || a.doctorId !== doctorId || a.date !== date || a.status === 'cancelled') {
          return false;
        }
        const [ah, am] = toEnglishDigits(a.time).trim().split(':').map(Number);
        const aStart = ah * 60 + am;
        const aEnd = aStart + (a.durationMinutes || 30);
        return targetStart < aEnd && targetEnd > aStart;
      });

      if (conflict) {
        throw new Error('متأسفانه در حین تکمیل فرم، این ساعت توسط کاربر دیگری رزرو شد. لطفاً ساعت دیگری را انتخاب فرمایید.');
      }

    // 6. Generate dynamic canonical tracking code (e.g. "AR-8492")
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `AR-${randomCode}`;
    const appointmentId = `apt-online-${Date.now()}`;

    // 7. Upsert client based on phone AND name
    const allClients = mockStorage.getClients();
    const normalizedInputName = clientName.trim();

    let client = allClients.find(
      (c) =>
        c.clinicId === clinicId &&
        normalizePhoneNumber(c.phone) === normalizedPhone &&
        c.name.trim() === normalizedInputName
    );

    const familyPrimaryClient = allClients.find(
      (c) => c.clinicId === clinicId && normalizePhoneNumber(c.phone) === normalizedPhone
    );

    const now = new Date().toISOString();

    if (!client) {
      const newClient = {
        id: `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        clinicId,
        name: normalizedInputName,
        phone: normalizedPhone,
        totalVisits: 1,
        totalSpent: service.price,
        lastVisitDate: date,
        status: 'new' as const,
        parentClientId: familyPrimaryClient ? (familyPrimaryClient.parentClientId || familyPrimaryClient.id) : undefined,
        createdAt: now,
      };
      client = newClient;
      mockStorage.saveClients([newClient, ...allClients]);
    } else {
      client.totalVisits = (client.totalVisits || 0) + 1;
      client.totalSpent = (client.totalSpent || 0) + service.price;
      client.lastVisitDate = date;
      mockStorage.saveClients([...allClients]);
    }

    // Store medicalNotes in isolated storage
    if (medicalNotes) {
      mockStorage.saveMedicalNote(appointmentId, medicalNotes);
    }

    const newAppointment: Appointment = {
      id: appointmentId,
      clinicId,
      clientId: client.id,
      trackingCode,
      date,
      time: canonicalTime,
      clientName,
      clientPhone: normalizedPhone,
      serviceId,
      serviceName: service.name,
      doctorId,
      doctorName: doctor.name,
      durationMinutes: service.duration,
      price: service.price,
      status: 'pending_confirmation',
      source: 'online_booking',
      notes,
      createdAt: now,
      updatedAt: now,
    };

    mockStorage.saveAppointments([newAppointment, ...appointments]);

    // 8. Consume token and record booking attempt ONLY after success
    mockStorage.consumeToken(verificationToken);
    mockStorage.recordBookingAttempt(normalizedPhone);

    // Emit domain event to automation engine
    await this.automationRepo.triggerEvent(clinicId, 'appointment.created', {
      name: clientName,
      clientName,
      phone: normalizedPhone,
      service: service.name,
      time: newAppointment.time,
    });

      return {
        appointment: newAppointment,
        trackingCode,
      };
    } catch (err: unknown) {
      // Re-issue / restore token if booking failed so user does not have to re-verify phone
      mockStorage.releaseToken(verificationToken);
      throw err;
    }
  }
}
