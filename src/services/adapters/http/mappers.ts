import type { Appointment } from '../../../domain/appointment';
import type { AppointmentStatus } from '../../../domain/appointmentStatus';
import type { Client } from '../../../domain/client';
import type { Lead } from '../../../domain/lead';
import type { Service } from '../../../domain/service';
import type { Doctor } from '../../../domain/doctor';

export interface AppointmentDto {
  id: string;
  clinic_id: string;
  tracking_code: string;
  appointment_date: string;
  appointment_time: string;
  client_id?: string;
  client_name: string;
  client_phone: string;
  service_id: string;
  service_name: string;
  doctor_id: string;
  doctor_name: string;
  duration_minutes: number;
  price: number;
  status: AppointmentStatus;
  source: 'online_booking' | 'reception_manual' | 'followup';
  notes?: string;
  medical_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientDto {
  id: string;
  clinic_id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'active' | 'at_risk' | 'churned' | 'new';
  total_visits: number;
  total_spent: number;
  last_visit_date?: string;
  recovery_value?: number;
  notes?: string;
  created_at: string;
}

export interface LeadDto {
  id: string;
  clinic_id: string;
  name: string;
  phone: string;
  interested_service: string;
  status: 'new' | 'hot' | 'contacted' | 'converted' | 'dropped';
  is_decision_ready: boolean;
  score: number;
  source: string;
  estimated_value: number;
  created_at: string;
}

export interface ServiceDto {
  id: string;
  clinic_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  category: string;
  description?: string;
  is_active: boolean;
}

export interface DoctorDto {
  id: string;
  clinic_id: string;
  name: string;
  specialty: string;
  start_hour: number;
  end_hour: number;
  slot_interval_minutes: number;
  avatar_url?: string;
  is_active: boolean;
}

export const mapAppointmentDtoToDomain = (dto: AppointmentDto): Appointment => ({
  id: dto.id,
  clinicId: dto.clinic_id,
  trackingCode: dto.tracking_code,
  date: dto.appointment_date,
  time: dto.appointment_time,
  clientId: dto.client_id,
  clientName: dto.client_name,
  clientPhone: dto.client_phone,
  serviceId: dto.service_id,
  serviceName: dto.service_name,
  doctorId: dto.doctor_id,
  doctorName: dto.doctor_name,
  durationMinutes: dto.duration_minutes,
  price: dto.price,
  status: dto.status,
  source: dto.source,
  notes: dto.notes,
  medicalNotes: dto.medical_notes,
  createdAt: dto.created_at,
  updatedAt: dto.updated_at,
});

export const mapClientDtoToDomain = (dto: ClientDto): Client => ({
  id: dto.id,
  clinicId: dto.clinic_id,
  name: dto.name,
  phone: dto.phone,
  email: dto.email,
  status: dto.status,
  totalVisits: dto.total_visits,
  totalSpent: dto.total_spent,
  lastVisitDate: dto.last_visit_date,
  recoveryValue: dto.recovery_value,
  notes: dto.notes,
  createdAt: dto.created_at,
});

export const mapLeadDtoToDomain = (dto: LeadDto): Lead => ({
  id: dto.id,
  clinicId: dto.clinic_id,
  name: dto.name,
  phone: dto.phone,
  interestedService: dto.interested_service,
  status: dto.status,
  isDecisionReady: dto.is_decision_ready,
  score: dto.score,
  source: dto.source,
  estimatedValue: dto.estimated_value,
  createdAt: dto.created_at,
});

export const mapServiceDtoToDomain = (dto: ServiceDto): Service => ({
  id: dto.id,
  clinicId: dto.clinic_id,
  name: dto.name,
  duration: dto.duration_minutes,
  price: dto.price,
  category: dto.category,
  description: dto.description,
  isActive: dto.is_active,
});

export const mapDoctorDtoToDomain = (dto: DoctorDto): Doctor => ({
  id: dto.id,
  clinicId: dto.clinic_id,
  name: dto.name,
  specialty: dto.specialty,
  startHour: dto.start_hour,
  endHour: dto.end_hour,
  slotIntervalMinutes: dto.slot_interval_minutes,
  avatar: dto.avatar_url,
  isActive: dto.is_active,
});

/* =========================================================================
   Request DTOs & Mappers (JSON on the wire — snake_case)
   ========================================================================= */

export interface CreateAppointmentRequestDto {
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  client_name: string;
  client_phone: string;
  service_id: string;
  doctor_id: string;
  source: string;
  notes?: string;
  medical_notes?: string;
}

export const toAppointmentCreateDto = (
  input: import('../../../domain/appointment').CreateAppointmentInput
): CreateAppointmentRequestDto => ({
  clinic_id: input.clinicId,
  appointment_date: input.date,
  appointment_time: input.time,
  client_name: input.clientName,
  client_phone: input.clientPhone,
  service_id: input.serviceId,
  doctor_id: input.doctorId,
  source: input.source,
  notes: input.notes,
  medical_notes: input.medicalNotes,
});

export interface CheckConflictRequestDto {
  doctor_id: string;
  date: string;
  time: string;
  duration_minutes: number;
}

export const toCheckConflictDto = (params: {
  doctorId: string;
  date: string;
  time: string;
  durationMinutes: number;
}): CheckConflictRequestDto => ({
  doctor_id: params.doctorId,
  date: params.date,
  time: params.time,
  duration_minutes: params.durationMinutes,
});

export interface BookingSubmissionRequestDto {
  clinic_id: string;
  service_id: string;
  doctor_id: string;
  date: string;
  time: string;
  client_name: string;
  client_phone: string;
  medical_notes?: string;
  notes?: string;
  captcha_token: string;
  verification_token: string;
}

export const toBookingSubmissionDto = (
  input: import('../../repositories/IBookingRepository').BookingSubmissionInput
): BookingSubmissionRequestDto => ({
  clinic_id: input.clinicId,
  service_id: input.serviceId,
  doctor_id: input.doctorId,
  date: input.date,
  time: input.time,
  client_name: input.clientName,
  client_phone: input.clientPhone,
  medical_notes: input.medicalNotes,
  notes: input.notes,
  captcha_token: input.captchaToken,
  verification_token: input.verificationToken,
});

export interface OutboxMessageRequestDto {
  clinic_id: string;
  recipient_phone: string;
  recipient_name: string;
  channel: string;
  content: string;
  status: string;
  trigger_event: string;
  scheduled_for?: string;
}

export const toOutboxMessageDto = (
  msg: Omit<import('../../../domain/automation').OutboxMessage, 'id' | 'createdAt'>
): OutboxMessageRequestDto => ({
  clinic_id: msg.clinicId,
  recipient_phone: msg.recipientPhone,
  recipient_name: msg.recipientName,
  channel: msg.channel,
  content: msg.content,
  status: msg.status,
  trigger_event: msg.triggerEvent,
  scheduled_for: msg.scheduledFor,
});

export interface AuditLogRequestDto {
  clinic_id: string;
  user_id: string;
  user_name: string;
  role: string;
  action: string;
  details?: string;
}

export const toAuditLogDto = (params: {
  clinicId: string;
  userId: string;
  userName: string;
  role: import('../../../domain/session').Role;
  action: import('../../../domain/audit').AuditAction;
  details?: string;
}): AuditLogRequestDto => ({
  clinic_id: params.clinicId,
  user_id: params.userId,
  user_name: params.userName,
  role: params.role,
  action: params.action,
  details: params.details,
});

