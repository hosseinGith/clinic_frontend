import { platformClient } from '../../api/platformClient';
import type {
  IPlatformClinicRepository,
  PlatformClinicsSummary,
  PlatformClinicsListQuery,
  PlatformClinicsListResponse,
  PlatformClinicDetails,
  PlatformClinicItem,
  PlatformClinicOwner,
  CreateClinicPayload,
  UpdateClinicPayload,
  ClinicStatus,
} from '../../repositories/IPlatformClinicRepository';
import type { Doctor } from '../../../domain/doctor';
import type { Service } from '../../../domain/service';
import type { BlockedDay } from '../../../domain/holiday';

export class HttpPlatformClinicRepository implements IPlatformClinicRepository {
  async getSummary(): Promise<PlatformClinicsSummary> {
    return platformClient.get<PlatformClinicsSummary>('/clinics/summary');
  }

  async listClinics(query?: PlatformClinicsListQuery): Promise<PlatformClinicsListResponse> {
    return platformClient.get<PlatformClinicsListResponse>('/clinics', {
      params: query as Record<string, string | number | boolean | undefined>,
    });
  }

  async getClinic(id: string): Promise<PlatformClinicDetails> {
    return platformClient.get<PlatformClinicDetails>(`/clinics/${id}`);
  }

  async createClinic(
    payload: CreateClinicPayload
  ): Promise<{ clinic: PlatformClinicItem; owner: PlatformClinicOwner }> {
    return platformClient.post<{ clinic: PlatformClinicItem; owner: PlatformClinicOwner }>(
      '/clinics',
      payload
    );
  }

  async updateClinic(id: string, payload: UpdateClinicPayload): Promise<PlatformClinicDetails> {
    return platformClient.patch<PlatformClinicDetails>(`/clinics/${id}`, payload);
  }

  async updateClinicStatus(
    id: string,
    status: ClinicStatus
  ): Promise<{ id: string; slug: string; name: string; status: ClinicStatus; deletedAt?: string | null }> {
    return platformClient.patch(`/clinics/${id}/status`, { status });
  }

  async deleteClinic(id: string, confirmSlug: string): Promise<{ success: boolean; message: string }> {
    return platformClient.delete<{ success: boolean; message: string }>(`/clinics/${id}`, {
      confirmSlug,
    });
  }

  // --- Doctors ---

  async getDoctors(clinicId: string): Promise<Doctor[]> {
    const list = await platformClient.get<any[]>(`/clinics/${clinicId}/doctors`);
    return (list || []).map((item) => ({
      id: item.id,
      clinicId: item.clinic_id,
      name: item.name,
      specialty: item.specialty,
      startHour: item.start_hour,
      endHour: item.end_hour,
      slotIntervalMinutes: item.slot_interval_minutes,
      avatar: item.avatar_url,
      isActive: item.is_active,
      weeklySchedule: item.weekly_schedule,
    }));
  }

  async createDoctor(clinicId: string, payload: Partial<Doctor>): Promise<Doctor> {
    const res = await platformClient.post<any>(`/clinics/${clinicId}/doctors`, {
      name: payload.name,
      specialty: payload.specialty,
      start_hour: payload.startHour,
      end_hour: payload.endHour,
      slot_interval_minutes: payload.slotIntervalMinutes,
      avatar_url: payload.avatar,
      is_active: payload.isActive,
      weekly_schedule: payload.weeklySchedule,
    });
    return {
      id: res.id,
      clinicId: res.clinic_id,
      name: res.name,
      specialty: res.specialty,
      startHour: res.start_hour,
      endHour: res.end_hour,
      slotIntervalMinutes: res.slot_interval_minutes,
      avatar: res.avatar_url,
      isActive: res.is_active,
      weeklySchedule: res.weekly_schedule,
    };
  }

  async updateDoctor(clinicId: string, doctorId: string, payload: Partial<Doctor>): Promise<Doctor> {
    const res = await platformClient.patch<any>(`/clinics/${clinicId}/doctors/${doctorId}`, {
      name: payload.name,
      specialty: payload.specialty,
      start_hour: payload.startHour,
      end_hour: payload.endHour,
      slot_interval_minutes: payload.slotIntervalMinutes,
      avatar_url: payload.avatar,
      is_active: payload.isActive,
      weekly_schedule: payload.weeklySchedule,
    });
    return {
      id: res.id,
      clinicId: res.clinic_id,
      name: res.name,
      specialty: res.specialty,
      startHour: res.start_hour,
      endHour: res.end_hour,
      slotIntervalMinutes: res.slot_interval_minutes,
      avatar: res.avatar_url,
      isActive: res.is_active,
      weeklySchedule: res.weekly_schedule,
    };
  }

  async deleteDoctor(clinicId: string, doctorId: string): Promise<{ success: boolean }> {
    return platformClient.delete<{ success: boolean }>(`/clinics/${clinicId}/doctors/${doctorId}`);
  }

  // --- Services ---

  async getServices(clinicId: string): Promise<Service[]> {
    const list = await platformClient.get<any[]>(`/clinics/${clinicId}/services`);
    return (list || []).map((item) => ({
      id: item.id,
      clinicId: item.clinic_id,
      name: item.name,
      duration: item.duration_minutes,
      price: Math.round(Number(item.price) / 10), // Rials to Tomans
      category: item.category,
      description: item.description,
      isActive: item.is_active,
    }));
  }

  async createService(clinicId: string, payload: Partial<Service>): Promise<Service> {
    const res = await platformClient.post<any>(`/clinics/${clinicId}/services`, {
      name: payload.name,
      duration_minutes: payload.duration,
      price: payload.price !== undefined ? payload.price * 10 : 0, // Tomans to Rials
      category: payload.category,
      description: payload.description,
      is_active: payload.isActive,
    });
    return {
      id: res.id,
      clinicId: res.clinic_id,
      name: res.name,
      duration: res.duration_minutes,
      price: Math.round(Number(res.price) / 10),
      category: res.category,
      description: res.description,
      isActive: res.is_active,
    };
  }

  async updateService(clinicId: string, serviceId: string, payload: Partial<Service>): Promise<Service> {
    const res = await platformClient.patch<any>(`/clinics/${clinicId}/services/${serviceId}`, {
      name: payload.name,
      duration_minutes: payload.duration,
      price: payload.price !== undefined ? payload.price * 10 : undefined,
      category: payload.category,
      description: payload.description,
      is_active: payload.isActive,
    });
    return {
      id: res.id,
      clinicId: res.clinic_id,
      name: res.name,
      duration: res.duration_minutes,
      price: Math.round(Number(res.price) / 10),
      category: res.category,
      description: res.description,
      isActive: res.is_active,
    };
  }

  async deleteService(clinicId: string, serviceId: string): Promise<{ success: boolean }> {
    return platformClient.delete<{ success: boolean }>(`/clinics/${clinicId}/services/${serviceId}`);
  }

  // --- Holidays ---

  async getHolidays(clinicId: string, doctorId?: string): Promise<BlockedDay[]> {
    const list = await platformClient.get<any[]>(`/clinics/${clinicId}/holidays`, {
      params: doctorId ? { doctorId } : undefined,
    });
    return (list || []).map((item) => ({
      id: item.id,
      clinicId: item.clinic_id,
      doctorId: item.doctor_id,
      date: item.date,
      reason: item.reason,
      createdAt: item.created_at,
    }));
  }

  async createHoliday(
    clinicId: string,
    payload: { doctorId?: string | null; date: string; reason?: string | null },
  ): Promise<BlockedDay> {
    const res = await platformClient.post<any>(`/clinics/${clinicId}/holidays`, {
      doctorId: payload.doctorId,
      date: payload.date,
      reason: payload.reason,
    });
    return {
      id: res.id,
      clinicId: res.clinic_id,
      doctorId: res.doctor_id,
      date: res.date,
      reason: res.reason,
      createdAt: res.created_at,
    };
  }

  async deleteHoliday(clinicId: string, holidayId: string): Promise<{ success: boolean }> {
    return platformClient.delete<{ success: boolean }>(`/clinics/${clinicId}/holidays/${holidayId}`);
  }
}
