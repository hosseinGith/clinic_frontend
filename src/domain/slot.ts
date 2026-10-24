import type { Doctor } from './doctor';
import type { Appointment } from './appointment';
import { toPersianDigits, toEnglishDigits } from '../lib/format';

export interface TimeSlot {
  id: string;
  time: string; // Persian formatted: "09:00"
  rawTime: string; // "09:00"
  available: boolean;
  reason?: string;
}

export interface CalculateSlotsParams {
  doctor: Doctor;
  serviceDurationMinutes: number;
  existingAppointments: Appointment[];
  date: string; // YYYY-MM-DD
}

/**
 * Calculates available time slots for a doctor on a specific date based on working hours,
 * service duration, and existing appointments (excluding cancelled ones).
 */
export const calculateAvailableSlots = (params: CalculateSlotsParams): TimeSlot[] => {
  const { doctor, serviceDurationMinutes, existingAppointments, date } = params;
  const slots: TimeSlot[] = [];

  // Filter existing active appointments on this date for this doctor
  const activeBookings = existingAppointments.filter((apt) => {
    return (
      apt.doctorId === doctor.id &&
      apt.date === date &&
      apt.status !== 'cancelled'
    );
  });

  const startMinutes = doctor.startHour * 60; // e.g. 9 * 60 = 540
  const endMinutes = doctor.endHour * 60; // e.g. 20 * 60 = 1200
  
  // Step forward using a dynamic common step so candidate start times are properly granular
  const stepMinutes = Math.min(30, doctor.slotIntervalMinutes || 30);

  let currentMinute = startMinutes;

  while (currentMinute + serviceDurationMinutes <= endMinutes) {
    const hours = Math.floor(currentMinute / 60);
    const mins = currentMinute % 60;
    const rawTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    const persianTime = toPersianDigits(rawTime);

    const slotStart = currentMinute;
    const slotEnd = currentMinute + serviceDurationMinutes;

    // Check collision with any active appointment
    const hasConflict = activeBookings.some((apt) => {
      // Normalize apt.time from Persian or English
      const aptRawTime = toEnglishDigits(apt.time).trim();
      const [aptH, aptM] = aptRawTime.split(':').map(Number);
      const aptStart = aptH * 60 + aptM;
      const aptEnd = aptStart + (apt.durationMinutes || 30);

      // Overlap condition: slotStart < aptEnd and slotEnd > aptStart
      return slotStart < aptEnd && slotEnd > aptStart;
    });

    slots.push({
      id: `slot-${doctor.id}-${rawTime.replace(':', '')}`,
      time: persianTime,
      rawTime,
      available: !hasConflict,
      reason: hasConflict ? 'رزرو شده' : undefined,
    });

    currentMinute += stepMinutes;
  }

  return slots;
};
