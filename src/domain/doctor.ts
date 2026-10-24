export interface WorkDaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  isActive: boolean;
  startHour: number; // e.g. 9
  endHour: number; // e.g. 18
  breakStartHour?: number | null;
  breakEndHour?: number | null;
}

export interface Doctor {
  id: string;
  clinicId: string;
  name: string;
  specialty: string;
  startHour: number; // e.g. 9 for 09:00
  endHour: number; // e.g. 20 for 20:00
  slotIntervalMinutes: number; // e.g. 45
  avatar?: string;
  isActive: boolean;
  weeklySchedule?: WorkDaySchedule[] | null;
}
