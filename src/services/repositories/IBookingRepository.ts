import type { TimeSlot } from '../../domain/slot';
import type { Appointment } from '../../domain/appointment';

export interface BookingSubmissionInput {
  clinicId: string;
  serviceId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // "09:00" or "09:00"
  clientName: string;
  clientPhone: string;
  medicalNotes?: string;
  notes?: string;
  verificationToken: string;
  captchaToken: string;
}

export interface IBookingRepository {
  getAvailableSlots(params: {
    clinicId: string;
    doctorId: string;
    serviceId: string;
    date: string;
  }): Promise<TimeSlot[]>;

  submitBooking(input: BookingSubmissionInput): Promise<{
    appointment: Appointment;
    trackingCode: string;
  }>;
}
