import {
  SEED_APPOINTMENTS,
  SEED_CLIENTS,
  SEED_LEADS,
  SEED_SERVICES,
  SEED_DOCTORS,
  SEED_AUTOMATIONS,
  SEED_NEXT_ACTIONS,
  SEED_CLINIC,
  SEED_USERS,
  buildSeed,
} from '../../../mocks/seed';
import type { Appointment } from '../../../domain/appointment';
import type { Client } from '../../../domain/client';
import type { Lead } from '../../../domain/lead';
import type { Service } from '../../../domain/service';
import type { Doctor } from '../../../domain/doctor';
import type { Automation, OutboxMessage } from '../../../domain/automation';
import type { DashboardNextAction } from '../../../domain/dashboard';
import type { UserProfile } from '../../../domain/session';
import type { AuditLogEntry } from '../../../domain/audit';

import { normalizePhoneNumber } from '../../../lib/phone';
import { getTodayDateString } from '../../../lib/jalali';

const STORAGE_KEY_PREFIX = 'medflow_mock_';

export interface OtpSessionState {
  code: string;
  sentAt: number;
  expiresAt: number;
  attempts: number;
  lockedUntil?: number;
}

export interface PhoneVerificationToken {
  token: string;
  phone: string;
  expiresAt: number;
  status?: 'active' | 'pending_consumption' | 'consumed';
  lockedAt?: number;
}

class MockStorage {
  private get<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window === 'undefined') return defaultValue;
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(value));
      }
    } catch {
      // Storage full or unavailable
    }
  }

  // --- Users ---
  public getUsers(): UserProfile[] {
    return this.get<UserProfile[]>('users', SEED_USERS);
  }

  public saveUsers(items: UserProfile[]): void {
    this.set('users', items);
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLogEntry[] {
    const initialLogs: AuditLogEntry[] = [
      {
        id: 'log-init-1',
        clinicId: SEED_CLINIC.id,
        userId: 'usr-sara',
        userName: 'سارا حسینی',
        role: 'reception',
        action: 'auth.login_success',
        actionLabel: 'ورود موفق به سامانه',
        details: 'ورود موفق از طریق پیامک OTP',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
    return this.get<AuditLogEntry[]>('audit_logs', initialLogs);
  }

  public saveAuditLogs(items: AuditLogEntry[]): void {
    this.set('audit_logs', items);
  }

  // --- Appointments ---
  public getAppointments(): Appointment[] {
    const today = getTodayDateString();
    const storedSeedDate = this.get<string | null>('seed_date', null);

    if (storedSeedDate !== today) {
      const currentStored = this.get<Appointment[]>('appointments', []);
      const userAppointments = currentStored.filter(
        (a) => !/^apt-(\d+|tom-\d+|past-\d+)$/.test(a.id)
      );
      const freshSeed = buildSeed(today);
      const combined = [...freshSeed.appointments, ...userAppointments];
      this.saveAppointments(combined);
      this.set('seed_date', today);
      return combined;
    }

    return this.get<Appointment[]>('appointments', SEED_APPOINTMENTS);
  }

  public saveAppointments(items: Appointment[]): void {
    // Medical notes separation: strip medicalNotes from regular appointment array
    // and store in a dedicated isolated store to prevent unauthorized exposure.
    const notesStore = this.getAllMedicalNotes();
    const sanitized = items.map((apt) => {
      if (apt.medicalNotes) {
        notesStore[apt.id] = apt.medicalNotes;
      }
      const clone = { ...apt };
      delete clone.medicalNotes;
      return clone;
    });

    this.set('appointments', sanitized);
    this.set('medical_notes_store', notesStore);
  }

  // --- Medical Notes Storage (Isolated & Privacy Protected) ---
  public getAllMedicalNotes(): Record<string, string> {
    const defaultNotes: Record<string, string> = {
      'apt-1': 'سابقه حساسیت به داروی لیدوکائین. نیاز به تست پوستی قبل از تزریق.',
      'apt-2': 'سابقه مصرف راکوتان تا 3 ماه پیش.',
    };
    return this.get<Record<string, string>>('medical_notes_store', defaultNotes);
  }

  public getMedicalNote(appointmentId: string): string | undefined {
    const store = this.getAllMedicalNotes();
    return store[appointmentId];
  }

  public saveMedicalNote(appointmentId: string, note: string): void {
    const store = this.getAllMedicalNotes();
    store[appointmentId] = note;
    this.set('medical_notes_store', store);
  }

  // --- Clients ---
  public getClients(): Client[] {
    return this.get<Client[]>('clients', SEED_CLIENTS);
  }

  public saveClients(items: Client[]): void {
    this.set('clients', items);
  }

  // --- Leads ---
  public getLeads(): Lead[] {
    return this.get<Lead[]>('leads', SEED_LEADS);
  }

  public saveLeads(items: Lead[]): void {
    this.set('leads', items);
  }

  // --- Services & Doctors ---
  public getServices(): Service[] {
    return this.get<Service[]>('services', SEED_SERVICES);
  }

  public getDoctors(): Doctor[] {
    return this.get<Doctor[]>('doctors', SEED_DOCTORS);
  }

  // --- Automations ---
  public getAutomations(): Automation[] {
    return this.get<Automation[]>('automations', SEED_AUTOMATIONS);
  }

  public saveAutomations(items: Automation[]): void {
    this.set('automations', items);
  }

  // --- Next Actions ---
  public getNextActions(): DashboardNextAction[] {
    return this.get<DashboardNextAction[]>('next_actions', SEED_NEXT_ACTIONS);
  }

  // --- Outbox Messages ---
  public getOutbox(): OutboxMessage[] {
    const initialOutbox: OutboxMessage[] = [
      {
        id: 'msg-init-1',
        clinicId: SEED_CLINIC.id,
        recipientPhone: '09192341108',
        recipientName: 'نرگس موسوی',
        channel: 'whatsapp',
        content: 'نوبت شما برای فیلر لب امروز ساعت 10:30 در کلینیک آریانا با موفقیت تأیید گردید.',
        status: 'sent',
        triggerEvent: 'appointment.confirmed',
        createdAt: 'امروز 10:30',
      },
      {
        id: 'msg-init-2',
        clinicId: SEED_CLINIC.id,
        recipientPhone: '09124567890',
        recipientName: 'مریم احمدی',
        channel: 'sms',
        content: 'درخواست نوبت بوتاکس شما دریافت شد و در دست بررسی پذیرش کلینیک آریانا قرار دارد.',
        status: 'failed',
        triggerEvent: 'appointment.created',
        createdAt: 'امروز 09:00',
      },
    ];
    return this.get<OutboxMessage[]>('outbox', initialOutbox);
  }

  public saveOutbox(items: OutboxMessage[]): void {
    this.set('outbox', items);
  }

  public clearOutbox(): void {
    this.set('outbox', []);
  }

  public getOutboxMessages(): OutboxMessage[] {
    return this.getOutbox();
  }

  // --- OTP Verification & Rate Limiting ---
  public getOtpState(phone: string): OtpSessionState | null {
    const norm = normalizePhoneNumber(phone);
    const all = this.get<Record<string, OtpSessionState>>('otp_sessions', {});
    return all[norm] || null;
  }

  public saveOtpState(phone: string, state: OtpSessionState): void {
    const norm = normalizePhoneNumber(phone);
    const all = this.get<Record<string, OtpSessionState>>('otp_sessions', {});
    all[norm] = state;
    this.set('otp_sessions', all);
  }

  public clearOtpState(phone: string): void {
    const norm = normalizePhoneNumber(phone);
    const all = this.get<Record<string, OtpSessionState>>('otp_sessions', {});
    delete all[norm];
    this.set('otp_sessions', all);
  }

  // --- OTP Request Rate Limiting (max 3 per 10 minutes) ---
  public getOtpRequestCount(phone: string, withinMinutes: number = 10): number {
    const norm = normalizePhoneNumber(phone);
    const key = `otp_request_rate_${norm}`;
    const timestamps = this.get<number[]>(key, []);
    const threshold = Date.now() - withinMinutes * 60 * 1000;
    return timestamps.filter((t) => t > threshold).length;
  }

  public recordOtpRequest(phone: string): void {
    const norm = normalizePhoneNumber(phone);
    const key = `otp_request_rate_${norm}`;
    const timestamps = this.get<number[]>(key, []);
    const now = Date.now();
    const threshold = now - 10 * 60 * 1000;
    const updated = [...timestamps.filter((t) => t > threshold), now];
    this.set(key, updated);
  }

  // --- Phone Verification Tokens for Booking (Single-use, short-lived) ---
  public saveVerificationToken(phone: string, token: string, expiresAt?: number): void {
    const norm = normalizePhoneNumber(phone);
    const all = this.get<Record<string, PhoneVerificationToken>>('phone_verification_tokens', {});
    const exp = expiresAt !== undefined ? expiresAt : Date.now() + 10 * 60 * 1000;
    all[token] = { token, phone: norm, expiresAt: exp, status: 'active' };
    this.set('phone_verification_tokens', all);
  }

  public isTokenValid(phone: string, token: string): boolean {
    if (!token) return false;
    const norm = normalizePhoneNumber(phone);
    const all = this.get<Record<string, PhoneVerificationToken>>('phone_verification_tokens', {});
    const record = all[token];
    if (!record) return false;
    
    // Auto-release stale lock after 30 seconds
    const isLocked = record.status === 'pending_consumption' && record.lockedAt && (Date.now() - record.lockedAt < 30000);
    if (isLocked) return false;

    return record.phone === norm && Date.now() <= record.expiresAt && record.status !== 'consumed';
  }

  /**
   * Atomically locks the token for pending consumption during booking submission.
   * Returns true if successfully acquired lock, false if token is invalid or already locked.
   */
  public lockToken(phone: string, token: string): boolean {
    if (!this.isTokenValid(phone, token)) return false;
    const all = this.get<Record<string, PhoneVerificationToken>>('phone_verification_tokens', {});
    const record = all[token];
    if (!record) return false;

    record.status = 'pending_consumption';
    record.lockedAt = Date.now();
    this.set('phone_verification_tokens', all);
    return true;
  }

  /**
   * Re-activates or releases a token if a booking fails (e.g. slot collision)
   */
  public releaseToken(token: string): void {
    const all = this.get<Record<string, PhoneVerificationToken>>('phone_verification_tokens', {});
    const record = all[token];
    if (record && record.status === 'pending_consumption') {
      record.status = 'active';
      delete record.lockedAt;
      this.set('phone_verification_tokens', all);
    }
  }

  public consumeToken(token: string): void {
    const all = this.get<Record<string, PhoneVerificationToken>>('phone_verification_tokens', {});
    delete all[token];
    this.set('phone_verification_tokens', all);
  }

  public verifyAndConsumeToken(phone: string, token: string): boolean {
    if (!this.isTokenValid(phone, token)) return false;
    this.consumeToken(token);
    return true;
  }

  // --- Booking Rate Limiting ---
  public getRecentBookingCount(phone: string, withinMinutes: number = 60): number {
    const norm = normalizePhoneNumber(phone);
    const key = `booking_rate_${norm}`;
    const timestamps = this.get<number[]>(key, []);
    const threshold = Date.now() - withinMinutes * 60 * 1000;
    const recent = timestamps.filter((t) => t > threshold);
    return recent.length;
  }

  public recordBookingAttempt(phone: string): void {
    const norm = normalizePhoneNumber(phone);
    const key = `booking_rate_${norm}`;
    const timestamps = this.get<number[]>(key, []);
    const now = Date.now();
    const threshold = now - 60 * 60 * 1000;
    const updated = [...timestamps.filter((t) => t > threshold), now];
    this.set(key, updated);
  }

  public resetToSeed(): void {
    const today = getTodayDateString();
    const freshSeed = buildSeed(today);
    this.set('seed_date', today);
    this.saveAppointments(freshSeed.appointments);
    this.saveClients(freshSeed.clients);
    this.saveLeads(freshSeed.leads);
    this.saveAutomations(freshSeed.automations);
    this.saveUsers(freshSeed.users);
    this.set('outbox', []);
  }

  public getSeedDate(): string | null {
    return this.get<string | null>('seed_date', null);
  }

  public setSeedDate(date: string): void {
    this.set('seed_date', date);
  }
}

export const mockStorage = new MockStorage();

export const simulateDelay = (ms: number = 80): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
