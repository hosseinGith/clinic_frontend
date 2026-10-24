import type { AppointmentStatus } from './appointmentStatus';

export type AppointmentSource = 'online_booking' | 'reception_manual' | 'followup';

export interface Appointment {
  id: string;
  clinicId: string;
  trackingCode: string; // e.g. "MF-8492"
  date: string; // YYYY-MM-DD
  time: string; // "09:00"
  clientId?: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  doctorId: string;
  doctorName: string;
  durationMinutes: number;
  price: number;
  status: AppointmentStatus;
  source: AppointmentSource;
  notes?: string;
  medicalNotes?: string; // Sensitive medical disclosures (allergies, health history)
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentInput {
  clinicId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  doctorId: string;
  source: AppointmentSource;
  notes?: string;
  medicalNotes?: string;
}
