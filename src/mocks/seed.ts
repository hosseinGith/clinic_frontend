import type { Appointment } from '../domain/appointment';
import type { Client } from '../domain/client';
import type { Lead } from '../domain/lead';
import type { Service } from '../domain/service';
import type { Doctor } from '../domain/doctor';
import type { Automation } from '../domain/automation';
import type { DashboardNextAction } from '../domain/dashboard';
import type { ClinicWorkspace, UserProfile } from '../domain/session';
import { getTodayDateString } from '../lib/jalali';

export const SEED_CLINIC: ClinicWorkspace = {
  id: 'clinic-ariana',
  slug: 'ariana',
  name: 'کلینیک زیبایی آریانا',
  tagline: 'سیستم رشد و عملیات کلینیک',
  phone: '021-88884321',
  address: 'تهران، خیابان ولیعصر، بالاتر از پارک وی',
  workingHours: 'شنبه تا پنجشنبه 9 تا 20',
};

export const SEED_USERS: UserProfile[] = [
  {
    id: 'usr-owner',
    name: 'دکتر کاوه آریا',
    roleTitle: 'صاحب کلینیک',
    role: 'owner',
    avatarInitials: 'ک',
    email: 'kaveh@ariana.clinic',
    phone: '09121110001',
    clinicId: SEED_CLINIC.id,
    isActive: true,
    createdAt: '1403/01/01',
  },
  {
    id: 'usr-admin',
    name: 'مریم کمالی',
    roleTitle: 'مدیر عملیات',
    role: 'admin',
    avatarInitials: 'م',
    email: 'maryam.kamali@ariana.clinic',
    phone: '09121110002',
    clinicId: SEED_CLINIC.id,
    isActive: true,
    createdAt: '1403/02/15',
  },
  {
    id: 'usr-sara',
    name: 'سارا حسینی',
    roleTitle: 'مدیر پذیرش',
    role: 'reception',
    avatarInitials: 'س',
    email: 'sara.hosseini@ariana.clinic',
    phone: '09121110003',
    clinicId: SEED_CLINIC.id,
    isActive: true,
    createdAt: '1403/03/10',
  },
  {
    id: 'usr-naderi',
    name: 'دکتر نادری',
    roleTitle: 'متخصص پوست و لیزر',
    role: 'doctor',
    avatarInitials: 'ن',
    email: 'dr.naderi@ariana.clinic',
    phone: '09121110004',
    doctorId: 'd1',
    clinicId: SEED_CLINIC.id,
    isActive: true,
    createdAt: '1403/01/15',
  },
  {
    id: 'usr-bahrami',
    name: 'دکتر بهرامی',
    roleTitle: 'متخصص پوست و زیبایی',
    role: 'doctor',
    avatarInitials: 'ب',
    email: 'dr.bahrami@ariana.clinic',
    phone: '09121110005',
    doctorId: 'd2',
    clinicId: SEED_CLINIC.id,
    isActive: true,
    createdAt: '1403/02/01',
  },
  {
    id: 'usr-patient',
    name: 'مریم احمدی',
    roleTitle: 'مراجع کلینیک',
    role: 'patient',
    avatarInitials: 'م',
    phone: '09121112233',
    clientId: 'c1',
    clinicId: SEED_CLINIC.id,
    isActive: true,
    createdAt: '1403/04/01',
  },
];

export const SEED_USER: UserProfile = SEED_USERS[2]; // سارا حسینی (مدیر پذیرش)

export const SEED_SERVICES: Service[] = [
  { id: 's1', clinicId: SEED_CLINIC.id, name: 'بوتاکس', duration: 30, price: 4500000, category: 'تزریقات زیبایی', isActive: true },
  { id: 's2', clinicId: SEED_CLINIC.id, name: 'فیلر لب', duration: 45, price: 6800000, category: 'تزریقات زیبایی', isActive: true },
  { id: 's3', clinicId: SEED_CLINIC.id, name: 'هایفوتراپی', duration: 60, price: 9200000, category: 'جوانسازی و لیفت', isActive: true },
  { id: 's4', clinicId: SEED_CLINIC.id, name: 'مزوتراپی', duration: 40, price: 3800000, category: 'جوانسازی پوست', isActive: true },
  { id: 's5', clinicId: SEED_CLINIC.id, name: 'لیفت با نخ', duration: 90, price: 12500000, category: 'جوانسازی و لیفت', isActive: true },
];

export const SEED_DOCTORS: Doctor[] = [
  { id: 'd1', clinicId: SEED_CLINIC.id, name: 'دکتر نادری', specialty: 'پوست و زیبایی', startHour: 9, endHour: 20, slotIntervalMinutes: 45, isActive: true },
  { id: 'd2', clinicId: SEED_CLINIC.id, name: 'دکتر بهرامی', specialty: 'پوست و زیبایی', startHour: 9, endHour: 20, slotIntervalMinutes: 45, isActive: true },
];

export const SEED_AUTOMATIONS: Automation[] = [
  {
    id: 'auto-booking-created',
    clinicId: SEED_CLINIC.id,
    title: 'تأیید دریافت درخواست نوبت آنلاین',
    channel: 'پیامک شخصیسازیشده',
    healthy: true,
    event: 'appointment.created',
    messageTemplate: 'مراجع گرامی {name}، درخواست نوبت شما برای خدمت {service} دریافت شد و در دست بررسی است.',
    enabled: true,
    totalTriggered: 18,
  },
  {
    id: 'reminder',
    clinicId: SEED_CLINIC.id,
    title: 'یادآوری 24 ساعت قبل',
    channel: 'پیامک و واتساپ',
    healthy: true,
    event: 'appointment.reminder_24h',
    messageTemplate: 'مراجع گرامی {name}، یادآوری نوبت شما برای فردا ساعت {time} در کلینیک آریانا تنظیم شده است.',
    enabled: true,
    totalTriggered: 84,
  },
  {
    id: 'hot_lead',
    clinicId: SEED_CLINIC.id,
    title: 'پیگیری سرنخ داغ',
    channel: 'پیامک و واتساپ',
    healthy: true,
    event: 'lead.hot',
    messageTemplate: 'سلام {name} عزیز، مشاوره اختصاصی {service} هم‌اکنون در دسترس شماست.',
    enabled: true,
    totalTriggered: 42,
  },
  {
    id: 'winback',
    clinicId: SEED_CLINIC.id,
    title: 'بازگشت مشتری غیرفعال',
    channel: 'پیامک شخصیسازیشده',
    healthy: true,
    event: 'client.inactive',
    messageTemplate: '{name} عزیز، دلتنگ حضور شماییم. هدیه مراقبت پوست کلینیک آریانا برای شما آماده است.',
    enabled: true,
    totalTriggered: 35,
  },
  {
    id: 'survey',
    clinicId: SEED_CLINIC.id,
    title: 'نظرسنجی بعد از مراجعه',
    channel: 'پیامک شخصیسازیشده',
    healthy: true,
    event: 'visit.completed',
    messageTemplate: '{name} گرامی، میزان رضایت شما از خدمات درمانگر کلینیک چقدر است؟',
    enabled: true,
    totalTriggered: 25,
  },
];

export const SEED_NEXT_ACTIONS: DashboardNextAction[] = [
  {
    id: 'a1',
    priority: 'high',
    title: 'پیگیری 3 مشتری در خطر',
    description: 'لیست هدف و متن پیشنهادی از قبل آماده شده است.',
    value: '12٬800٬000 تومان',
    valueLabel: 'فرصت فروش',
    actionType: 'call_clients',
  },
  {
    id: 'a2',
    priority: 'medium',
    title: 'پاسخ به 7 سرنخ داغ',
    description: 'لیست هدف و متن پیشنهادی از قبل آماده شده است.',
    value: '43٪ نرخ تبدیل',
    valueLabel: 'فرصت فروش',
    actionType: 'reply_leads',
  },
  {
    id: 'a3',
    priority: 'low',
    title: 'تأیید نوبتهای فردا',
    description: 'لیست هدف و متن پیشنهادی از قبل آماده شده است.',
    value: '37٪ کاهش کنسلی',
    valueLabel: 'کاهش کنسلی',
    actionType: 'confirm_tomorrow',
  },
];

/**
 * Calculates tomorrow and yesterday canonical dates (YYYY-MM-DD) from a base date.
 */
function getRelativeDate(baseDateStr: string, offsetDays: number): string {
  const parts = baseDateStr.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface SeedData {
  clinic: ClinicWorkspace;
  users: UserProfile[];
  services: Service[];
  doctors: Doctor[];
  appointments: Appointment[];
  clients: Client[];
  leads: Lead[];
  automations: Automation[];
  nextActions: DashboardNextAction[];
}

/**
 * Re-builds seed appointments, clients, and leads deterministically for a given today date.
 */
export function buildSeed(today: string = getTodayDateString()): SeedData {
  const tomorrow = getRelativeDate(today, 1);
  const yesterday = getRelativeDate(today, -1);

  const appointments: Appointment[] = [
    // 5 Primary Today Appointments
    {
      id: 'apt-1',
      clinicId: SEED_CLINIC.id,
      clientId: 'c1',
      trackingCode: 'AR-8492',
      date: today,
      time: '09:00',
      clientName: 'مریم احمدی',
      clientPhone: '09121112233',
      serviceId: 's1',
      serviceName: 'بوتاکس',
      doctorId: 'd1',
      doctorName: 'دکتر نادری',
      durationMinutes: 30,
      price: 4500000,
      status: 'pending_confirmation',
      source: 'online_booking',
      createdAt: `${today}T08:15:00Z`,
      updatedAt: `${today}T08:15:00Z`,
    },
    {
      id: 'apt-2',
      clinicId: SEED_CLINIC.id,
      trackingCode: 'AR-8493',
      date: today,
      time: '10:30',
      clientName: 'نرگس موسوی',
      clientPhone: '09192341108',
      serviceId: 's2',
      serviceName: 'فیلر لب',
      doctorId: 'd1',
      doctorName: 'دکتر نادری',
      durationMinutes: 45,
      price: 6800000,
      status: 'confirmed',
      source: 'reception_manual',
      createdAt: `${today}T08:30:00Z`,
      updatedAt: `${today}T08:35:00Z`,
    },
    {
      id: 'apt-3',
      clinicId: SEED_CLINIC.id,
      trackingCode: 'AR-8494',
      date: today,
      time: '12:00',
      clientName: 'الهام رضایی',
      clientPhone: '09357710345',
      serviceId: 's3',
      serviceName: 'هایفوتراپی',
      doctorId: 'd2',
      doctorName: 'دکتر بهرامی',
      durationMinutes: 60,
      price: 9200000,
      status: 'pending_payment',
      source: 'online_booking',
      createdAt: `${today}T08:45:00Z`,
      updatedAt: `${today}T09:00:00Z`,
    },
    {
      id: 'apt-4',
      clinicId: SEED_CLINIC.id,
      trackingCode: 'AR-8495',
      date: today,
      time: '13:30',
      clientName: 'سارا جعفری',
      clientPhone: '09101126773',
      serviceId: 's4',
      serviceName: 'مزوتراپی',
      doctorId: 'd2',
      doctorName: 'دکتر بهرامی',
      durationMinutes: 40,
      price: 3800000,
      status: 'confirmed',
      source: 'reception_manual',
      createdAt: `${today}T09:10:00Z`,
      updatedAt: `${today}T09:15:00Z`,
    },
    {
      id: 'apt-5',
      clinicId: SEED_CLINIC.id,
      trackingCode: 'AR-8496',
      date: today,
      time: '15:00',
      clientName: 'کامیلا شریفی',
      clientPhone: '09128804120',
      serviceId: 's5',
      serviceName: 'لیفت با نخ',
      doctorId: 'd1',
      doctorName: 'دکتر نادری',
      durationMinutes: 90,
      price: 12500000,
      status: 'in_clinic',
      source: 'reception_manual',
      createdAt: `${today}T09:30:00Z`,
      updatedAt: `${today}T15:00:00Z`,
    },

    // 10 Non-overlapping appointments today for Doctor d1 (Dr. Naderi)
    // Working hours: 09:00 - 20:00. Busy: 09:00-09:30, 10:30-11:15, 15:00-16:30
    { id: 'apt-6', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8497', date: today, time: '09:30', clientName: 'زهرا کاظمی', clientPhone: '09123330001', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd1', doctorName: 'دکتر نادری', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-7', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8498', date: today, time: '11:30', clientName: 'فرشته انصاری', clientPhone: '09123330002', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd1', doctorName: 'دکتر نادری', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-8', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8499', date: today, time: '12:00', clientName: 'شیرین عباسی', clientPhone: '09123330003', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd1', doctorName: 'دکتر نادری', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-9', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8500', date: today, time: '12:30', clientName: 'نیلوفر پاشایی', clientPhone: '09123330004', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd1', doctorName: 'دکتر نادری', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-10', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8501', date: today, time: '13:00', clientName: 'میترا یزدانی', clientPhone: '09123330005', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd1', doctorName: 'دکتر نادری', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-11', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8502', date: today, time: '13:30', clientName: 'پریا صادقی', clientPhone: '09123330006', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd1', doctorName: 'دکتر نادری', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-12', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8503', date: today, time: '14:00', clientName: 'آناهیتا معتمد', clientPhone: '09123330007', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd1', doctorName: 'دکتر نادری', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-13', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8504', date: today, time: '16:30', clientName: 'سمانه رسولی', clientPhone: '09123330008', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd1', doctorName: 'دکتر نادری', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-14', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8505', date: today, time: '17:00', clientName: 'مهسا قدیری', clientPhone: '09123330009', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd1', doctorName: 'دکتر نادری', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-15', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8506', date: today, time: '17:30', clientName: 'شیما نجفی', clientPhone: '09123330010', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd1', doctorName: 'دکتر نادری', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },

    // 9 Non-overlapping appointments today for Doctor d2 (Dr. Bahrami)
    // Working hours: 09:00 - 20:00. Busy: 12:00-13:00, 13:30-14:10
    { id: 'apt-16', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8507', date: today, time: '09:00', clientName: 'فرناز محمودی', clientPhone: '09123330011', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd2', doctorName: 'دکتر بهرامی', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-17', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8508', date: today, time: '09:30', clientName: 'رویا دهقان', clientPhone: '09123330012', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd2', doctorName: 'دکتر بهرامی', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-18', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8509', date: today, time: '10:00', clientName: 'طاهره صالحی', clientPhone: '09123330013', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd2', doctorName: 'دکتر بهرامی', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-19', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8510', date: today, time: '10:30', clientName: 'پروانه حسنی', clientPhone: '09123330014', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd2', doctorName: 'دکتر بهرامی', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-20', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8511', date: today, time: '11:00', clientName: 'لادن طباطبایی', clientPhone: '09123330015', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd2', doctorName: 'دکتر بهرامی', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-21', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8512', date: today, time: '14:30', clientName: 'سیمین دانشور', clientPhone: '09123330016', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd2', doctorName: 'دکتر بهرامی', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-22', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8513', date: today, time: '15:00', clientName: 'ترانه علوی', clientPhone: '09123330017', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd2', doctorName: 'دکتر بهرامی', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-23', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8514', date: today, time: '15:30', clientName: 'عاطفه نوری', clientPhone: '09123330018', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd2', doctorName: 'دکتر بهرامی', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },
    { id: 'apt-24', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8515', date: today, time: '16:00', clientName: 'مینا برومند', clientPhone: '09123330019', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd2', doctorName: 'دکتر بهرامی', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T08:00:00Z`, updatedAt: `${today}T08:00:00Z` },

    // Tomorrow appointments (6 appointments for Next Actions confirmation)
    { id: 'apt-tom-1', clinicId: SEED_CLINIC.id, trackingCode: 'AR-9001', date: tomorrow, time: '09:00', clientName: 'شادی موسوی', clientPhone: '09124440001', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd1', doctorName: 'دکتر نادری', durationMinutes: 30, price: 4500000, status: 'pending_confirmation', source: 'online_booking', createdAt: `${today}T12:00:00Z`, updatedAt: `${today}T12:00:00Z` },
    { id: 'apt-tom-2', clinicId: SEED_CLINIC.id, trackingCode: 'AR-9002', date: tomorrow, time: '10:00', clientName: 'کتایون ریاحی', clientPhone: '09124440002', serviceId: 's2', serviceName: 'فیلر لب', doctorId: 'd1', doctorName: 'دکتر نادری', durationMinutes: 45, price: 6800000, status: 'pending_confirmation', source: 'online_booking', createdAt: `${today}T12:00:00Z`, updatedAt: `${today}T12:00:00Z` },
    { id: 'apt-tom-3', clinicId: SEED_CLINIC.id, trackingCode: 'AR-9003', date: tomorrow, time: '11:00', clientName: 'بهنوش طباطبایی', clientPhone: '09124440003', serviceId: 's3', serviceName: 'هایفوتراپی', doctorId: 'd2', doctorName: 'دکتر بهرامی', durationMinutes: 60, price: 9200000, status: 'pending_confirmation', source: 'online_booking', createdAt: `${today}T12:00:00Z`, updatedAt: `${today}T12:00:00Z` },
    { id: 'apt-tom-4', clinicId: SEED_CLINIC.id, trackingCode: 'AR-9004', date: tomorrow, time: '14:00', clientName: 'نگار جواهریان', clientPhone: '09124440004', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd1', doctorName: 'دکتر نادری', durationMinutes: 30, price: 4500000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T12:00:00Z`, updatedAt: `${today}T12:00:00Z` },
    { id: 'apt-tom-5', clinicId: SEED_CLINIC.id, trackingCode: 'AR-9005', date: tomorrow, time: '15:00', clientName: 'شبنم مقدمی', clientPhone: '09124440005', serviceId: 's4', serviceName: 'مزوتراپی', doctorId: 'd2', doctorName: 'دکتر بهرامی', durationMinutes: 40, price: 3800000, status: 'confirmed', source: 'reception_manual', createdAt: `${today}T12:00:00Z`, updatedAt: `${today}T12:00:00Z` },
    { id: 'apt-tom-6', clinicId: SEED_CLINIC.id, trackingCode: 'AR-9006', date: tomorrow, time: '16:30', clientName: 'طناز طباطبایی', clientPhone: '09124440006', serviceId: 's5', serviceName: 'لیفت با نخ', doctorId: 'd2', doctorName: 'دکتر بهرامی', durationMinutes: 90, price: 12500000, status: 'pending_confirmation', source: 'online_booking', createdAt: `${today}T12:00:00Z`, updatedAt: `${today}T12:00:00Z` },

    // Yesterday completed appointments
    { id: 'apt-past-1', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8101', date: yesterday, time: '10:00', clientName: 'سمیرا هدایتی', clientPhone: '09125550001', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd1', doctorName: 'دکتر نادری', durationMinutes: 30, price: 4500000, status: 'completed', source: 'reception_manual', createdAt: `${yesterday}T08:00:00Z`, updatedAt: `${yesterday}T10:30:00Z` },
    { id: 'apt-past-2', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8102', date: yesterday, time: '11:30', clientName: 'ناهید کیانی', clientPhone: '09125550002', serviceId: 's2', serviceName: 'فیلر لب', doctorId: 'd2', doctorName: 'دکتر بهرامی', durationMinutes: 45, price: 6800000, status: 'completed', source: 'reception_manual', createdAt: `${yesterday}T08:00:00Z`, updatedAt: `${yesterday}T12:15:00Z` },
    { id: 'apt-past-3', clinicId: SEED_CLINIC.id, trackingCode: 'AR-8103', date: yesterday, time: '14:00', clientName: 'مبینا نصیری', clientPhone: '09125550003', serviceId: 's1', serviceName: 'بوتاکس', doctorId: 'd1', doctorName: 'دکتر نادری', durationMinutes: 30, price: 4500000, status: 'completed', source: 'online_booking', createdAt: `${yesterday}T08:00:00Z`, updatedAt: `${yesterday}T14:30:00Z` },
  ];

  const clients: Client[] = [
    { id: 'c1', clinicId: SEED_CLINIC.id, name: 'مریم احمدی', phone: '09121112233', status: 'active', totalVisits: 6, totalSpent: 28000000, lastVisitDate: today, createdAt: '1403/06/01' },
    { id: 'cl-1', clinicId: SEED_CLINIC.id, name: 'سپیده توکلی', phone: '09126661122', status: 'at_risk', totalVisits: 4, totalSpent: 18500000, recoveryValue: 5200000, lastVisitDate: '1404/11/20', createdAt: '1404/01/15' },
    { id: 'cl-2', clinicId: SEED_CLINIC.id, name: 'رها صادقی', phone: '09331114455', status: 'at_risk', totalVisits: 3, totalSpent: 14200000, recoveryValue: 4100000, lastVisitDate: '1404/12/05', createdAt: '1404/02/10' },
    { id: 'cl-3', clinicId: SEED_CLINIC.id, name: 'بهاره ناصری', phone: '09184449988', status: 'at_risk', totalVisits: 5, totalSpent: 22000000, recoveryValue: 3500000, lastVisitDate: '1404/12/18', createdAt: '1403/11/01' },
    { id: 'cl-5', clinicId: SEED_CLINIC.id, name: 'نرگس موسوی', phone: '09192341108', status: 'active', totalVisits: 3, totalSpent: 19400000, lastVisitDate: today, createdAt: '1404/03/15' },
  ];

  const leads: Lead[] = [
    { id: 'lead-1', clinicId: SEED_CLINIC.id, name: 'فاطمه کمالی', phone: '09123451120', interestedService: 'هایفوتراپی صورت', status: 'hot', isDecisionReady: true, score: 94, source: 'اینستاگرام', estimatedValue: 9200000, createdAt: `${today}T07:00:00Z` },
    { id: 'lead-2', clinicId: SEED_CLINIC.id, name: 'مونا کریمی', phone: '09361112233', interestedService: 'فیلر لب و چانه', status: 'hot', isDecisionReady: true, score: 91, source: 'کمپین پیامکی', estimatedValue: 11000000, createdAt: `${today}T07:30:00Z` },
    { id: 'lead-3', clinicId: SEED_CLINIC.id, name: 'نیلوفر امینی', phone: '09194445566', interestedService: 'لیفت با نخ', status: 'hot', isDecisionReady: true, score: 89, source: 'معرفی دوستان', estimatedValue: 12500000, createdAt: `${today}T08:00:00Z` },
    { id: 'lead-4', clinicId: SEED_CLINIC.id, name: 'پریناز حسینی', phone: '09128887766', interestedService: 'بوتاکس خط اخم', status: 'hot', isDecisionReady: false, score: 82, source: 'سایت', estimatedValue: 4500000, createdAt: `${today}T08:30:00Z` },
    { id: 'lead-5', clinicId: SEED_CLINIC.id, name: 'شیدا رستمی', phone: '09352223344', interestedService: 'مزوتراپی مو', status: 'hot', isDecisionReady: false, score: 79, source: 'اینستاگرام', estimatedValue: 3800000, createdAt: `${today}T09:00:00Z` },
    { id: 'lead-6', clinicId: SEED_CLINIC.id, name: 'آرزو مرادی', phone: '09105556677', interestedService: 'فیلر شقیقه', status: 'hot', isDecisionReady: false, score: 78, source: 'سایت', estimatedValue: 6800000, createdAt: `${today}T09:15:00Z` },
    { id: 'lead-7', clinicId: SEED_CLINIC.id, name: 'ساناز جلالی', phone: '09197778899', interestedService: 'هایفوتراپی گردن', status: 'hot', isDecisionReady: false, score: 76, source: 'کمپین تخفیف', estimatedValue: 7500000, createdAt: `${today}T09:30:00Z` },
  ];

  return {
    clinic: SEED_CLINIC,
    users: SEED_USERS,
    services: SEED_SERVICES,
    doctors: SEED_DOCTORS,
    appointments,
    clients,
    leads,
    automations: SEED_AUTOMATIONS,
    nextActions: SEED_NEXT_ACTIONS,
  };
}

const initialSeed = buildSeed(getTodayDateString());
export const SEED_APPOINTMENTS: Appointment[] = initialSeed.appointments;
export const SEED_CLIENTS: Client[] = initialSeed.clients;
export const SEED_LEADS: Lead[] = initialSeed.leads;
