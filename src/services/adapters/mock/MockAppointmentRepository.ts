import type {
  IAppointmentRepository,
  AppointmentFilters,
} from '../../repositories/IAppointmentRepository';
import type { Appointment, CreateAppointmentInput } from '../../../domain/appointment';
import type { AppointmentStatus } from '../../../domain/appointmentStatus';
import type { Actor } from '../../../domain/session';
import { canTransition, canTransitionByRole } from '../../../domain/appointmentStatus';
import { can } from '../../../domain/permissions';
import { mockStorage, simulateDelay } from './mockStorage';
import { getTodayDateString } from '../../../lib/jalali';
import { toEnglishDigits, toPersianDigits } from '../../../lib/format';
import { MockAutomationRepository } from './MockAutomationRepository';
import { MockAuditRepository } from './MockAuditRepository';
import { normalizePhoneNumber } from '../../../lib/phone';

export class MockAppointmentRepository implements IAppointmentRepository {
  private auditRepo = new MockAuditRepository();

  private enrichAndFilterMedicalNotes(apt: Appointment, actor?: Actor): Appointment {
    const clone = { ...apt };
    if (!actor) {
      delete clone.medicalNotes;
      return clone;
    }

    const hasPermission = can(actor.role, 'medical_notes:read');
    const isDoctorOfThisApt = actor.role === 'doctor' && apt.doctorId === actor.doctorId;
    const isOwner = actor.role === 'owner';

    if (hasPermission && (isOwner || isDoctorOfThisApt)) {
      const storedNote = mockStorage.getMedicalNote(apt.id);
      clone.medicalNotes = storedNote || apt.medicalNotes || undefined;
    } else {
      delete clone.medicalNotes;
    }

    return clone;
  }

  async getAppointments(
    clinicId: string,
    filters?: AppointmentFilters,
    actor?: Actor
  ): Promise<Appointment[]> {
    await simulateDelay();
    let list = mockStorage.getAppointments().filter((apt) => apt.clinicId === clinicId);

    // Apply role-based scoping (Fail-closed: if doctor has no doctorId, return empty)
    if (actor?.role === 'doctor') {
      if (!actor.doctorId) {
        return [];
      }
      list = list.filter((apt) => apt.doctorId === actor.doctorId);
    } else if (actor?.role === 'patient') {
      const actorPhone = actor.phone ? normalizePhoneNumber(actor.phone) : '';
      list = list.filter((apt) => {
        const aptPhone = normalizePhoneNumber(apt.clientPhone);
        return (actorPhone && aptPhone === actorPhone) || (actor.clientId && apt.clientId === actor.clientId);
      });
    }

    // Apply explicit filters
    if (filters?.date) {
      list = list.filter((apt) => apt.date === filters.date);
    }
    if (filters?.status) {
      list = list.filter((apt) => apt.status === filters.status);
    }
    if (filters?.doctorId) {
      list = list.filter((apt) => apt.doctorId === filters.doctorId);
    }
    if (filters?.clientId) {
      list = list.filter((apt) => apt.clientId === filters.clientId);
    }
    if (filters?.search) {
      const qOriginal = filters.search.trim().toLowerCase();
      const qNorm = toEnglishDigits(filters.search).trim().toLowerCase();
      list = list.filter(
        (apt) =>
          apt.clientName.toLowerCase().includes(qOriginal) ||
          apt.clientPhone.includes(qNorm) ||
          toEnglishDigits(apt.clientPhone).includes(qNorm) ||
          apt.trackingCode.toLowerCase().includes(qNorm) ||
          apt.serviceName.toLowerCase().includes(qOriginal)
      );
    }

    return list.map((apt) => this.enrichAndFilterMedicalNotes(apt, actor));
  }

  async getTodayQueue(
    clinicId: string,
    limit: number = 5,
    actor?: Actor
  ): Promise<Appointment[]> {
    await simulateDelay();
    const today = getTodayDateString();
    let all = mockStorage.getAppointments().filter((apt) => apt.clinicId === clinicId && apt.date === today);

    // Fail-closed for doctor without doctorId
    if (actor?.role === 'doctor') {
      if (!actor.doctorId) {
        return [];
      }
      all = all.filter((apt) => apt.doctorId === actor.doctorId);
    }

    // Exclude cancelled and completed appointments
    all = all.filter((apt) => apt.status !== 'cancelled' && apt.status !== 'completed');

    // Sort ascending by time (canonical HH:mm)
    all.sort((a, b) => {
      const aTime = toEnglishDigits(a.time);
      const bTime = toEnglishDigits(b.time);
      return aTime.localeCompare(bTime);
    });

    const sliced = all.slice(0, limit);
    return sliced.map((apt) => this.enrichAndFilterMedicalNotes(apt, actor));
  }

  async getAppointmentById(
    clinicId: string,
    id: string,
    actor?: Actor
  ): Promise<Appointment | null> {
    await simulateDelay();
    const item = mockStorage
      .getAppointments()
      .find((apt) => apt.clinicId === clinicId && apt.id === id);

    if (!item) return null;

    // Fail-closed for doctor
    if (actor?.role === 'doctor') {
      if (!actor.doctorId || item.doctorId !== actor.doctorId) {
        return null;
      }
    }
    if (actor?.role === 'patient') {
      const actorPhone = actor.phone ? normalizePhoneNumber(actor.phone) : '';
      const aptPhone = normalizePhoneNumber(item.clientPhone);
      if (actorPhone !== aptPhone && actor.clientId !== item.clientId) {
        return null;
      }
    }

    const enriched = this.enrichAndFilterMedicalNotes(item, actor);
    if (enriched.medicalNotes && actor) {
      void this.auditRepo.recordLog({
        clinicId,
        userId: actor.userId,
        userName: actor.userName || actor.userId || actor.role,
        role: actor.role,
        action: 'medical_notes.view',
        details: `مشاهده یادداشت پزشکی نوبت ${item.trackingCode}`,
      });
    }

    return enriched;
  }

  async createAppointment(
    clinicId: string,
    input: CreateAppointmentInput,
    actor?: Actor
  ): Promise<Appointment> {
    if (actor?.role === 'patient') {
      throw new Error('دسترسی غیرمجاز: مراجع مجاز به ثبت نوبت جدید نمیباشد.');
    }
    await simulateDelay();
    const services = mockStorage.getServices();
    const doctors = mockStorage.getDoctors();

    const service = services.find((s) => s.id === input.serviceId);
    const doctor = doctors.find((d) => d.id === input.doctorId);

    const now = new Date().toISOString();
    const trackingNum = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `AR-${toPersianDigits(trackingNum)}`;
    // Upsert client record based on phone AND name
    const normalizedPhone = normalizePhoneNumber(input.clientPhone);
    const normalizedInputName = input.clientName.trim();
    const allClients = mockStorage.getClients();
    
    // Look for exact match by phone AND name
    let client = allClients.find(
      (c) =>
        c.clinicId === clinicId &&
        normalizePhoneNumber(c.phone) === normalizedPhone &&
        c.name.trim() === normalizedInputName
    );

    // If no exact match, check if any existing client shares this phone (family member)
    const familyPrimaryClient = allClients.find(
      (c) => c.clinicId === clinicId && normalizePhoneNumber(c.phone) === normalizedPhone
    );

    if (!client) {
      const newClient = {
        id: `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        clinicId,
        name: normalizedInputName,
        phone: normalizedPhone,
        totalVisits: 1,
        totalSpent: service?.price || 0,
        lastVisitDate: input.date,
        status: 'new' as const,
        parentClientId: familyPrimaryClient ? (familyPrimaryClient.parentClientId || familyPrimaryClient.id) : undefined,
        createdAt: now,
      };
      client = newClient;
      mockStorage.saveClients([newClient, ...allClients]);
    } else {
      client.totalVisits = (client.totalVisits || 0) + 1;
      client.totalSpent = (client.totalSpent || 0) + (service?.price || 0);
      client.lastVisitDate = input.date;
      mockStorage.saveClients([...allClients]);
    }
    const id = `apt-${Date.now()}`;

    // Store medicalNotes in isolated storage
    if (input.medicalNotes) {
      mockStorage.saveMedicalNote(id, input.medicalNotes);
    }

    const newApt: Appointment = {
      id,
      clinicId,
      clientId: client.id,
      trackingCode,
      date: input.date,
      time: input.time,
      clientName: input.clientName,
      clientPhone: input.clientPhone,
      serviceId: input.serviceId,
      serviceName: service?.name || 'خدمت کلینیک',
      doctorId: input.doctorId,
      doctorName: doctor?.name || 'پزشک معالج',
      durationMinutes: service?.duration || 30,
      price: service?.price || 0,
      status: 'pending_confirmation',
      source: input.source,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    const current = mockStorage.getAppointments();
    mockStorage.saveAppointments([newApt, ...current]);

    return newApt;
  }

  async updateStatus(
    clinicId: string,
    id: string,
    newStatus: AppointmentStatus,
    actor?: Actor
  ): Promise<Appointment> {
    await simulateDelay();
    const appointments = mockStorage.getAppointments();
    const aptIndex = appointments.findIndex(
      (a) => a.clinicId === clinicId && a.id === id
    );

    if (aptIndex === -1) {
      throw new Error('نوبت مورد نظر یافت نشد.');
    }

    const apt = appointments[aptIndex];

    // Ownership check: Doctor can only update their own appointments
    if (actor?.role === 'doctor') {
      if (!actor.doctorId || apt.doctorId !== actor.doctorId) {
        throw new Error('دسترسی غیرمجاز: پزشک تنها مجاز به مدیریت نوبت‌های خود می‌باشد.');
      }
    }

    // Ownership check: Patient can only update their own appointments
    if (actor?.role === 'patient') {
      if (newStatus !== 'cancelled') {
        throw new Error('دسترسی غیرمجاز: مراجع مجاز به ثبت نوبت جدید نمیباشد.');
      }
      const actorPhone = actor.phone ? normalizePhoneNumber(actor.phone) : '';
      const aptPhone = normalizePhoneNumber(apt.clientPhone);
      const matchPhone = Boolean(actorPhone && aptPhone === actorPhone);
      const matchClient = Boolean(actor.clientId && apt.clientId === actor.clientId);
      if (!matchPhone && !matchClient) {
        throw new Error('دسترسی غیرمجاز: بیمار تنها مجاز به مدیریت نوبت خود می‌باشد.');
      }
    }

    // State transition validation (with role check if actor provided)
    const isAllowed = actor
      ? canTransitionByRole(apt.status, newStatus, actor.role)
      : canTransition(apt.status, newStatus);

    if (!isAllowed) {
      throw new Error(`نقش ${actor?.role || 'جاری'} مجاز به تغییر وضعیت از «${apt.status}» به «${newStatus}» نمی‌باشد.`);
    }

    const updated: Appointment = {
      ...apt,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    appointments[aptIndex] = updated;
    mockStorage.saveAppointments([...appointments]);

    // Record audit log
    if (actor) {
      void this.auditRepo.recordLog({
        clinicId,
        userId: actor.userId,
        userName: actor.userName || actor.userId || actor.role,
        role: actor.role,
        action: 'appointment.status_change',
        details: `تغییر وضعیت نوبت ${apt.trackingCode} از ${apt.status} به ${newStatus}`,
      });
    }

    // Trigger automation event on confirmation
    if (newStatus === 'confirmed') {
      const automationRepo = new MockAutomationRepository();
      await automationRepo.triggerEvent(clinicId, 'appointment.confirmed', {
        name: apt.clientName,
        clientName: apt.clientName,
        phone: apt.clientPhone,
        service: apt.serviceName,
        time: apt.time,
      });
    }

    // Trigger automation event on visit completed
    if (newStatus === 'completed') {
      const automationRepo = new MockAutomationRepository();
      await automationRepo.triggerEvent(clinicId, 'visit.completed', {
        name: apt.clientName,
        clientName: apt.clientName,
        phone: apt.clientPhone,
        service: apt.serviceName,
        time: apt.time,
      });
    }

    return updated;
  }

  async checkConflict(
    clinicId: string,
    doctorId: string,
    date: string,
    time: string,
    durationMinutes: number
  ): Promise<boolean> {
    await simulateDelay(40);
    const appointments = mockStorage.getAppointments();
    const cleanTime = toEnglishDigits(time).trim();
    const [h, m] = cleanTime.split(':').map(Number);
    const targetStart = h * 60 + m;
    const targetEnd = targetStart + durationMinutes;

    return appointments.some((a) => {
      if (a.clinicId !== clinicId || a.doctorId !== doctorId || a.date !== date || a.status === 'cancelled') {
        return false;
      }
      const [ah, am] = toEnglishDigits(a.time).trim().split(':').map(Number);
      const aStart = ah * 60 + am;
      const aEnd = aStart + (a.durationMinutes || 30);
      return targetStart < aEnd && targetEnd > aStart;
    });
  }

  async updateMedicalNotes(
    clinicId: string,
    id: string,
    notes: string,
    actor?: Actor
  ): Promise<void> {
    await simulateDelay(40);
    if (actor && !can(actor.role, 'medical_notes:write')) {
      throw new Error('شما دسترسی لازم برای ویرایش یادداشت پزشکی را ندارید.');
    }

    const appointments = mockStorage.getAppointments();
    const apt = appointments.find((a) => a.clinicId === clinicId && a.id === id);
    if (!apt) {
      throw new Error('نوبت مورد نظر یافت نشد.');
    }

    // Ownership check: doctor can only update notes for their own appointments
    if (actor?.role === 'doctor') {
      if (!actor.doctorId || apt.doctorId !== actor.doctorId) {
        throw new Error('دسترسی غیرمجاز: پزشک تنها مجاز به ثبت یادداشت در نوبت‌های خود می‌باشد.');
      }
    }

    mockStorage.saveMedicalNote(id, notes);

    if (actor) {
      void this.auditRepo.recordLog({
        clinicId,
        userId: actor.userId,
        userName: actor.userName || actor.userId || actor.role,
        role: actor.role,
        action: 'medical_notes.update',
        details: `ثبت یا ویرایش یادداشت پزشکی برای نوبت ${apt.trackingCode || id}`,
      });
    }
  }
}
