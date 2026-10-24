import type { Appointment, CreateAppointmentInput } from '../../domain/appointment';
import type { AppointmentStatus } from '../../domain/appointmentStatus';
import type { Actor } from '../../domain/session';

export interface AppointmentFilters {
  date?: string;
  status?: AppointmentStatus;
  doctorId?: string;
  search?: string;
  clientId?: string;
}

export interface IAppointmentRepository {
  getAppointments(clinicId: string, filters?: AppointmentFilters, actor?: Actor): Promise<Appointment[]>;
  getTodayQueue(clinicId: string, limit?: number, actor?: Actor): Promise<Appointment[]>;
  getAppointmentById(clinicId: string, id: string, actor?: Actor): Promise<Appointment | null>;
  createAppointment(clinicId: string, input: CreateAppointmentInput, actor?: Actor): Promise<Appointment>;
  updateStatus(clinicId: string, id: string, newStatus: AppointmentStatus, actor?: Actor): Promise<Appointment>;
  checkConflict(clinicId: string, doctorId: string, date: string, time: string, durationMinutes: number): Promise<boolean>;
  updateMedicalNotes(clinicId: string, id: string, notes: string, actor?: Actor): Promise<void>;
}
