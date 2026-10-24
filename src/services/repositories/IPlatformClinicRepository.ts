export type ClinicStatus = 'active' | 'suspended' | 'deleted';

export interface PlatformClinicOwner {
  id: string;
  name: string;
  phone: string;
  role?: string;
}

export interface PlatformClinicItem {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  phone?: string;
  address?: string;
  workingHours?: string;
  status: ClinicStatus;
  deletedAt?: string | null;
  createdAt: string;
  owner?: PlatformClinicOwner | null;
  totalUsers: number;
  totalAppointments: number;
}

export interface PlatformClinicCounts {
  doctors: number;
  services: number;
  clients: number;
  appointments: number;
  users: number;
}

export interface PlatformClinicDetails {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  phone?: string;
  address?: string;
  workingHours?: string;
  status: ClinicStatus;
  deletedAt?: string | null;
  createdAt: string;
  lastAppointmentAt?: string | null;
  counts: PlatformClinicCounts;
  owner?: PlatformClinicOwner | null;
}

export interface PlatformClinicsListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClinicStatus;
  sort?: 'createdAt' | 'name' | 'slug' | 'status';
  order?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface PlatformClinicsListResponse {
  items: PlatformClinicItem[];
  total: number;
  page: number;
  limit: number;
}

export interface PlatformSummaryLatestClinic {
  id: string;
  slug: string;
  name: string;
  status: ClinicStatus;
  createdAt: string;
}

export interface PlatformClinicsSummary {
  total: number;
  active: number;
  suspended: number;
  deleted: number;
  createdLast30Days: number;
  latest: PlatformSummaryLatestClinic[];
}

export interface CreateClinicPayload {
  slug: string;
  name: string;
  tagline?: string;
  phone?: string;
  address?: string;
  workingHours?: string;
  ownerName: string;
  ownerPhone: string;
}

export interface UpdateClinicPayload {
  name?: string;
  tagline?: string;
  phone?: string;
  address?: string;
  workingHours?: string;
}

export interface UpdateClinicStatusPayload {
  status: ClinicStatus;
}

export interface DeleteClinicPayload {
  confirmSlug: string;
}

import type { Doctor } from '../../domain/doctor';
import type { Service } from '../../domain/service';
import type { BlockedDay } from '../../domain/holiday';

export interface IPlatformClinicRepository {
  getSummary(): Promise<PlatformClinicsSummary>;
  listClinics(query?: PlatformClinicsListQuery): Promise<PlatformClinicsListResponse>;
  getClinic(id: string): Promise<PlatformClinicDetails>;
  createClinic(payload: CreateClinicPayload): Promise<{ clinic: PlatformClinicItem; owner: PlatformClinicOwner }>;
  updateClinic(id: string, payload: UpdateClinicPayload): Promise<PlatformClinicDetails>;
  updateClinicStatus(id: string, status: ClinicStatus): Promise<{ id: string; slug: string; name: string; status: ClinicStatus; deletedAt?: string | null }>;
  deleteClinic(id: string, confirmSlug: string): Promise<{ success: boolean; message: string }>;

  // Doctors
  getDoctors(clinicId: string): Promise<Doctor[]>;
  createDoctor(clinicId: string, payload: Partial<Doctor>): Promise<Doctor>;
  updateDoctor(clinicId: string, doctorId: string, payload: Partial<Doctor>): Promise<Doctor>;
  deleteDoctor(clinicId: string, doctorId: string): Promise<{ success: boolean }>;

  // Services
  getServices(clinicId: string): Promise<Service[]>;
  createService(clinicId: string, payload: Partial<Service>): Promise<Service>;
  updateService(clinicId: string, serviceId: string, payload: Partial<Service>): Promise<Service>;
  deleteService(clinicId: string, serviceId: string): Promise<{ success: boolean }>;

  // Holidays
  getHolidays(clinicId: string, doctorId?: string): Promise<BlockedDay[]>;
  createHoliday(clinicId: string, payload: { doctorId?: string | null; date: string; reason?: string | null }): Promise<BlockedDay>;
  deleteHoliday(clinicId: string, holidayId: string): Promise<{ success: boolean }>;
}
