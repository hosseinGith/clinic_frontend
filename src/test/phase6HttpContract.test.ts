import { describe, it, expect } from 'vitest';
import {
  toAppointmentCreateDto,
  toCheckConflictDto,
  toBookingSubmissionDto,
  toOutboxMessageDto,
  toAuditLogDto,
  mapAppointmentDtoToDomain,
  mapClientDtoToDomain,
  mapLeadDtoToDomain,
  mapServiceDtoToDomain,
  mapDoctorDtoToDomain,
} from '../services/adapters/http/mappers';
import type {
  AppointmentDto,
  ClientDto,
  LeadDto,
  ServiceDto,
  DoctorDto,
} from '../services/adapters/http/mappers';
import type { CreateAppointmentInput } from '../domain/appointment';
import type { BookingSubmissionInput } from '../services/repositories/IBookingRepository';

describe('Phase 6: HTTP Wire Contract & Snake_Case DTO Mappers', () => {
  describe('1. Request Mappers (Domain -> Snake_Case DTO on the Wire)', () => {
    it('toAppointmentCreateDto maps camelCase input to snake_case wire payload', () => {
      const input: CreateAppointmentInput = {
        clinicId: 'ariana',
        date: '2026-10-25',
        time: '14:30',
        clientName: 'مریم سپهری',
        clientPhone: '09121112233',
        serviceId: 'srv-1',
        doctorId: 'doc-1',
        source: 'reception_manual',
        notes: 'مراجعه اول',
      };

      const dto = toAppointmentCreateDto(input);

      expect(dto.clinic_id).toBe('ariana');
      expect(dto.appointment_date).toBe('2026-10-25');
      expect(dto.appointment_time).toBe('14:30');
      expect(dto.client_name).toBe('مریم سپهری');
      expect(dto.client_phone).toBe('09121112233');
      expect(dto.service_id).toBe('srv-1');
      expect(dto.doctor_id).toBe('doc-1');
      expect(dto.source).toBe('reception_manual');
      expect(dto.notes).toBe('مراجعه اول');
    });

    it('toCheckConflictDto converts camelCase parameters to snake_case', () => {
      const dto = toCheckConflictDto({
        doctorId: 'doc-42',
        date: '2026-10-26',
        time: '10:00',
        durationMinutes: 45,
      });

      expect(dto.doctor_id).toBe('doc-42');
      expect(dto.date).toBe('2026-10-26');
      expect(dto.time).toBe('10:00');
      expect(dto.duration_minutes).toBe(45);
    });

    it('toBookingSubmissionDto maps booking inputs including captcha and phone token', () => {
      const input: BookingSubmissionInput = {
        clinicId: 'ariana',
        serviceId: 'srv-botox',
        doctorId: 'doc-niloufar',
        date: '2026-10-28',
        time: '11:00',
        clientName: 'نیما فلاح',
        clientPhone: '09129998877',
        notes: 'توضیحات تست',
        captchaToken: 'captcha-token-123',
        verificationToken: 'phone-token-456',
      };

      const dto = toBookingSubmissionDto(input);

      expect(dto.clinic_id).toBe('ariana');
      expect(dto.service_id).toBe('srv-botox');
      expect(dto.doctor_id).toBe('doc-niloufar');
      expect(dto.date).toBe('2026-10-28');
      expect(dto.time).toBe('11:00');
      expect(dto.client_name).toBe('نیما فلاح');
      expect(dto.client_phone).toBe('09129998877');
      expect(dto.notes).toBe('توضیحات تست');
      expect(dto.captcha_token).toBe('captcha-token-123');
      expect(dto.verification_token).toBe('phone-token-456');
    });

    it('toOutboxMessageDto maps outgoing message fields to snake_case', () => {
      const dto = toOutboxMessageDto({
        clinicId: 'ariana',
        recipientPhone: '09121112233',
        recipientName: 'علی رضایی',
        channel: 'sms',
        content: 'یادآوری نوبت شما فردا ساعت ۱۰',
        status: 'pending',
        triggerEvent: 'appointment.confirmed',
        scheduledFor: '2026-10-27T08:00:00Z',
      });

      expect(dto.clinic_id).toBe('ariana');
      expect(dto.recipient_phone).toBe('09121112233');
      expect(dto.recipient_name).toBe('علی رضایی');
      expect(dto.channel).toBe('sms');
      expect(dto.content).toBe('یادآوری نوبت شما فردا ساعت ۱۰');
      expect(dto.status).toBe('pending');
      expect(dto.trigger_event).toBe('appointment.confirmed');
      expect(dto.scheduled_for).toBe('2026-10-27T08:00:00Z');
    });

    it('toAuditLogDto maps audit log entry params to snake_case', () => {
      const dto = toAuditLogDto({
        clinicId: 'ariana',
        userId: 'u-1',
        userName: 'مدیر سیستم',
        role: 'owner',
        action: 'appointment.status_change',
        details: 'تغییر نوبت به تأیید شده',
      });

      expect(dto.clinic_id).toBe('ariana');
      expect(dto.user_id).toBe('u-1');
      expect(dto.user_name).toBe('مدیر سیستم');
      expect(dto.role).toBe('owner');
      expect(dto.action).toBe('appointment.status_change');
      expect(dto.details).toBe('تغییر نوبت به تأیید شده');
    });
  });

  describe('2. Response Mappers (Snake_Case DTO from Wire -> Domain)', () => {
    it('mapAppointmentDtoToDomain correctly translates snake_case DTO to camelCase domain', () => {
      const dto: AppointmentDto = {
        id: 'apt-1',
        clinic_id: 'ariana',
        tracking_code: 'MF-1001',
        appointment_date: '2026-10-20',
        appointment_time: '16:00',
        client_name: 'رویا کمالی',
        client_phone: '09125556677',
        service_id: 'srv-1',
        service_name: 'فیلر لب',
        doctor_id: 'doc-1',
        doctor_name: 'دکتر سپهری',
        duration_minutes: 30,
        price: 2500000,
        status: 'confirmed',
        source: 'online_booking',
        medical_notes: 'سابقه تبخال ندارد',
        created_at: '2026-10-18T10:00:00Z',
        updated_at: '2026-10-18T10:00:00Z',
      };

      const domain = mapAppointmentDtoToDomain(dto);

      expect(domain.id).toBe('apt-1');
      expect(domain.clinicId).toBe('ariana');
      expect(domain.trackingCode).toBe('MF-1001');
      expect(domain.date).toBe('2026-10-20');
      expect(domain.time).toBe('16:00');
      expect(domain.durationMinutes).toBe(30);
      expect(domain.medicalNotes).toBe('سابقه تبخال ندارد');
      expect(domain.status).toBe('confirmed');
    });

    it('mapClientDtoToDomain and mapLeadDtoToDomain map correctly', () => {
      const clientDto: ClientDto = {
        id: 'c-1',
        clinic_id: 'ariana',
        name: 'فرزانه نوری',
        phone: '09128889900',
        status: 'at_risk',
        total_visits: 3,
        total_spent: 4500000,
        last_visit_date: '2026-07-01',
        recovery_value: 3000000,
        created_at: '2026-01-01T00:00:00Z',
      };
      const client = mapClientDtoToDomain(clientDto);
      expect(client.totalVisits).toBe(3);
      expect(client.totalSpent).toBe(4500000);
      expect(client.recoveryValue).toBe(3000000);
      expect(client.lastVisitDate).toBe('2026-07-01');

      const leadDto: LeadDto = {
        id: 'l-1',
        clinic_id: 'ariana',
        name: 'هدی حسینی',
        phone: '09127778899',
        interested_service: 'لیزر کندلا',
        status: 'hot',
        is_decision_ready: true,
        score: 95,
        source: 'اینستاگرام',
        estimated_value: 1200000,
        created_at: '2026-10-18T12:00:00Z',
      };
      const lead = mapLeadDtoToDomain(leadDto);
      expect(lead.interestedService).toBe('لیزر کندلا');
      expect(lead.isDecisionReady).toBe(true);
      expect(lead.estimatedValue).toBe(1200000);
    });

    it('mapServiceDtoToDomain and mapDoctorDtoToDomain map catalog entities', () => {
      const srvDto: ServiceDto = {
        id: 's-1',
        clinic_id: 'ariana',
        name: 'پاکسازی پوست',
        duration_minutes: 60,
        price: 800000,
        category: 'مراقبت پوست',
        is_active: true,
      };
      const srv = mapServiceDtoToDomain(srvDto);
      expect(srv.duration).toBe(60);
      expect(srv.isActive).toBe(true);

      const docDto: DoctorDto = {
        id: 'd-1',
        clinic_id: 'ariana',
        name: 'دکتر احمدی',
        specialty: 'پوست و مو',
        start_hour: 10,
        end_hour: 18,
        slot_interval_minutes: 30,
        avatar_url: '/avatars/doc.jpg',
        is_active: true,
      };
      const doc = mapDoctorDtoToDomain(docDto);
      expect(doc.startHour).toBe(10);
      expect(doc.endHour).toBe(18);
      expect(doc.slotIntervalMinutes).toBe(30);
      expect(doc.avatar).toBe('/avatars/doc.jpg');
    });
  });
});
