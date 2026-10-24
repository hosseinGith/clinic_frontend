import { httpClient, ApiError } from '../../api/httpClient';
import type { IAppointmentRepository, AppointmentFilters } from '../../repositories/IAppointmentRepository';
import type { IClientRepository } from '../../repositories/IClientRepository';
import type { ILeadRepository } from '../../repositories/ILeadRepository';
import type { ICatalogRepository } from '../../repositories/ICatalogRepository';
import type { IAutomationRepository } from '../../repositories/IAutomationRepository';
import type { IDashboardRepository } from '../../repositories/IDashboardRepository';
import type { IBookingRepository, BookingSubmissionInput } from '../../repositories/IBookingRepository';
import type { IMessageRepository } from '../../repositories/IMessageRepository';
import type { Appointment, CreateAppointmentInput } from '../../../domain/appointment';
import type { AppointmentStatus } from '../../../domain/appointmentStatus';
import type { Client } from '../../../domain/client';
import type { Lead } from '../../../domain/lead';
import type { Service } from '../../../domain/service';
import type { Doctor } from '../../../domain/doctor';
import type { Automation, AutomationEvent, AutomationStats, OutboxMessage } from '../../../domain/automation';
import type { DashboardSummary, DashboardNextAction } from '../../../domain/dashboard';
import type { TimeSlot } from '../../../domain/slot';
import type { ClinicWorkspace, Actor } from '../../../domain/session';
import {
  mapAppointmentDtoToDomain,
  mapClientDtoToDomain,
  mapLeadDtoToDomain,
  mapServiceDtoToDomain,
  mapDoctorDtoToDomain,
  toAppointmentCreateDto,
  toCheckConflictDto,
  toBookingSubmissionDto,
  toOutboxMessageDto,
} from './mappers';
import type {
  AppointmentDto,
  ClientDto,
  LeadDto,
  ServiceDto,
  DoctorDto,
} from './mappers';

export class HttpAppointmentRepository implements IAppointmentRepository {
  async getAppointments(clinicId: string, filters?: AppointmentFilters): Promise<Appointment[]> {
    const dtos = await httpClient.get<AppointmentDto[]>(`/clinics/${clinicId}/appointments`, {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
    return dtos.map(mapAppointmentDtoToDomain);
  }

  async getTodayQueue(clinicId: string, limit: number = 5): Promise<Appointment[]> {
    const dtos = await httpClient.get<AppointmentDto[]>(`/clinics/${clinicId}/appointments/today`, {
      params: { limit },
    });
    return dtos.map(mapAppointmentDtoToDomain);
  }

  async getAppointmentById(clinicId: string, id: string): Promise<Appointment | null> {
    try {
      const dto = await httpClient.get<AppointmentDto>(`/clinics/${clinicId}/appointments/${id}`);
      return dto ? mapAppointmentDtoToDomain(dto) : null;
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async createAppointment(clinicId: string, input: CreateAppointmentInput, actor?: Actor): Promise<Appointment> {
    if (actor?.role === 'patient') {
      throw new Error('دسترسی غیرمجاز: مراجع مجاز به ثبت نوبت جدید نمیباشد.');
    }
    const payload = toAppointmentCreateDto(input);
    const dto = await httpClient.post<AppointmentDto>(`/clinics/${clinicId}/appointments`, payload);
    return mapAppointmentDtoToDomain(dto);
  }

  async updateStatus(clinicId: string, id: string, newStatus: AppointmentStatus, actor?: Actor): Promise<Appointment> {
    if (actor?.role === 'patient' && newStatus !== 'cancelled') {
      throw new Error('دسترسی غیرمجاز: مراجع مجاز به ثبت نوبت جدید نمیباشد.');
    }
    const dto = await httpClient.patch<AppointmentDto>(`/clinics/${clinicId}/appointments/${id}/status`, {
      status: newStatus,
    });
    return mapAppointmentDtoToDomain(dto);
  }

  async checkConflict(clinicId: string, doctorId: string, date: string, time: string, durationMinutes: number): Promise<boolean> {
    const payload = toCheckConflictDto({ doctorId, date, time, durationMinutes });
    const res = await httpClient.post<{ hasConflict: boolean }>(`/clinics/${clinicId}/appointments/check-conflict`, payload);
    return res.hasConflict;
  }

  async updateMedicalNotes(clinicId: string, id: string, notes: string): Promise<void> {
    await httpClient.patch(`/clinics/${clinicId}/appointments/${id}/medical-notes`, {
      medical_notes: notes,
    });
  }
}

export class HttpClientRepository implements IClientRepository {
  async getClients(clinicId: string, search?: string): Promise<Client[]> {
    const dtos = await httpClient.get<ClientDto[]>(`/clinics/${clinicId}/clients`, { params: { search } });
    return dtos.map(mapClientDtoToDomain);
  }

  async getAtRiskClients(clinicId: string): Promise<Client[]> {
    const dtos = await httpClient.get<ClientDto[]>(`/clinics/${clinicId}/clients/at-risk`);
    return dtos.map(mapClientDtoToDomain);
  }

  async getClientById(clinicId: string, id: string): Promise<Client | null> {
    try {
      const dto = await httpClient.get<ClientDto>(`/clinics/${clinicId}/clients/${id}`);
      return dto ? mapClientDtoToDomain(dto) : null;
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }
}

export class HttpLeadRepository implements ILeadRepository {
  async getLeads(clinicId: string): Promise<Lead[]> {
    const dtos = await httpClient.get<LeadDto[]>(`/clinics/${clinicId}/leads`);
    return dtos.map(mapLeadDtoToDomain);
  }

  async getHotLeads(clinicId: string): Promise<Lead[]> {
    const dtos = await httpClient.get<LeadDto[]>(`/clinics/${clinicId}/leads/hot`);
    return dtos.map(mapLeadDtoToDomain);
  }
}

export class HttpCatalogRepository implements ICatalogRepository {
  async getServices(clinicId: string): Promise<Service[]> {
    const dtos = await httpClient.get<ServiceDto[]>(`/clinics/${clinicId}/catalog/services`);
    return dtos.map(mapServiceDtoToDomain);
  }

  async getDoctors(clinicId: string): Promise<Doctor[]> {
    const dtos = await httpClient.get<DoctorDto[]>(`/clinics/${clinicId}/catalog/doctors`);
    return dtos.map(mapDoctorDtoToDomain);
  }

  async getServiceById(clinicId: string, id: string): Promise<Service | null> {
    try {
      const dto = await httpClient.get<ServiceDto>(`/clinics/${clinicId}/catalog/services/${id}`);
      return dto ? mapServiceDtoToDomain(dto) : null;
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async getDoctorById(clinicId: string, id: string): Promise<Doctor | null> {
    try {
      const dto = await httpClient.get<DoctorDto>(`/clinics/${clinicId}/catalog/doctors/${id}`);
      return dto ? mapDoctorDtoToDomain(dto) : null;
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async getClinicBySlug(slug: string): Promise<ClinicWorkspace | null> {
    try {
      const dto = await httpClient.get<ClinicWorkspace>(`/public/clinics/${slug}`);
      return dto || null;
    } catch {
      return null;
    }
  }
}

export class HttpAutomationRepository implements IAutomationRepository {
  async getAutomations(clinicId: string): Promise<Automation[]> {
    return httpClient.get<Automation[]>(`/clinics/${clinicId}/automations`);
  }

  async getStats(clinicId: string): Promise<AutomationStats> {
    return httpClient.get<AutomationStats>(`/clinics/${clinicId}/automations/stats`);
  }

  async setEnabled(clinicId: string, id: string, enabled: boolean): Promise<void> {
    await httpClient.patch(`/clinics/${clinicId}/automations/${id}`, { enabled });
  }

  async triggerEvent(clinicId: string, event: AutomationEvent, payload: Record<string, any>): Promise<void> {
    await httpClient.post(`/clinics/${clinicId}/automations/events`, { event, payload });
  }
}

export class HttpDashboardRepository implements IDashboardRepository {
  async getSummary(clinicId: string): Promise<DashboardSummary> {
    return httpClient.get<DashboardSummary>(`/clinics/${clinicId}/dashboard/summary`);
  }

  async getNextActions(clinicId: string): Promise<DashboardNextAction[]> {
    return httpClient.get<DashboardNextAction[]>(`/clinics/${clinicId}/dashboard/next-actions`);
  }
}

export class HttpBookingRepository implements IBookingRepository {
  async getAvailableSlots(params: { clinicId: string; doctorId: string; serviceId: string; date: string }): Promise<TimeSlot[]> {
    return httpClient.get<TimeSlot[]>(`/public/clinics/${params.clinicId}/booking/slots`, { params });
  }

  async submitBooking(input: BookingSubmissionInput): Promise<{ appointment: Appointment; trackingCode: string }> {
    const payload = toBookingSubmissionDto(input);
    const res = await httpClient.post<{ appointment: AppointmentDto; tracking_code: string }>(
      `/public/clinics/${input.clinicId}/booking`,
      payload
    );
    return {
      appointment: mapAppointmentDtoToDomain(res.appointment),
      trackingCode: res.tracking_code,
    };
  }
}

export class HttpMessageRepository implements IMessageRepository {
  async getOutboxMessages(clinicId: string): Promise<OutboxMessage[]> {
    return httpClient.get<OutboxMessage[]>(`/clinics/${clinicId}/messages/outbox`);
  }

  async saveMessage(message: Omit<OutboxMessage, 'id' | 'createdAt'>): Promise<OutboxMessage> {
    const payload = toOutboxMessageDto(message);
    return httpClient.post<OutboxMessage>(`/clinics/${message.clinicId}/messages/outbox`, payload);
  }
}

export { HttpAuthRepository } from './HttpAuthRepository';
export { HttpAuditRepository } from './HttpAuditRepository';
export { HttpPlatformAuthRepository } from './HttpPlatformAuthRepository';
export { HttpPlatformClinicRepository } from './HttpPlatformClinicRepository';
export { HttpPlatformBillingRepository } from './HttpPlatformBillingRepository';
export { HttpSubscriptionRepository } from './HttpSubscriptionRepository';

