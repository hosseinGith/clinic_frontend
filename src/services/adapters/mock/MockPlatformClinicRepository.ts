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

const RESERVED_SLUGS = [
  'api',
  'platform',
  'admin',
  'auth',
  'public',
  'login',
  'register',
  'health',
  'docs',
  'booking',
];

const INITIAL_MOCK_CLINICS: PlatformClinicItem[] = [
  {
    id: 'clinic-ariana',
    slug: 'ariana',
    name: 'کلینیک تخصصی پوست و زیبایی آریانا',
    tagline: 'پیشرو در ارائه خدمات پوست، مو و زیبایی',
    phone: '021-88884321',
    address: 'تهران، خیابان ولیعصر، بالاتر از پارک وی',
    workingHours: 'شنبه تا پنجشنبه 9 تا 20',
    status: 'active',
    createdAt: '2026-01-15T08:00:00.000Z',
    owner: {
      id: 'usr-owner-1',
      name: 'دکتر علی کاظمی',
      phone: '09121110001',
    },
    totalUsers: 6,
    totalAppointments: 142,
  },
  {
    id: 'clinic-shafa',
    slug: 'shafa',
    name: 'درمانگاه شبانه‌روزی شفا',
    tagline: 'خدمات درمانی و بالینی 24 ساعته',
    phone: '021-22003344',
    address: 'تهران، سعادت‌آباد، میدان کاج',
    workingHours: 'شبانه روزی',
    status: 'active',
    createdAt: '2026-02-10T10:30:00.000Z',
    owner: {
      id: 'usr-owner-2',
      name: 'دکتر مریم شفیعی',
      phone: '09122220002',
    },
    totalUsers: 12,
    totalAppointments: 320,
  },
  {
    id: 'clinic-omid',
    slug: 'omid',
    name: 'کلینیک دندانپزشکی امید',
    tagline: 'مرکز تخصصی ایمپلنت و ارتودنسی',
    phone: '021-44556677',
    address: 'تهران، شهرک غرب، بلوار فرحزادی',
    workingHours: '10 تا 18',
    status: 'suspended',
    createdAt: '2026-03-01T14:15:00.000Z',
    owner: {
      id: 'usr-owner-3',
      name: 'دکتر بهزاد امیدی',
      phone: '09123330003',
    },
    totalUsers: 4,
    totalAppointments: 85,
  },
  {
    id: 'clinic-pars',
    slug: 'pars',
    name: 'مرکز جراحی پارس',
    tagline: 'کلینیک تخصصی چشم پزشکی',
    phone: '021-88776655',
    address: 'تهران، ملاصدرا، پلاک 2',
    workingHours: '8 تا 20',
    status: 'deleted',
    deletedAt: '2026-03-10T11:00:00.000Z',
    createdAt: '2026-01-20T11:00:00.000Z',
    owner: {
      id: 'usr-owner-4',
      name: 'دکتر حمید پارسا',
      phone: '09124440004',
    },
    totalUsers: 8,
    totalAppointments: 190,
  },
];

export class MockPlatformClinicRepository implements IPlatformClinicRepository {
  private clinics: PlatformClinicItem[] = [...INITIAL_MOCK_CLINICS];

  async getSummary(): Promise<PlatformClinicsSummary> {
    await new Promise((res) => setTimeout(res, 200));

    const total = this.clinics.length;
    const active = this.clinics.filter((c) => c.status === 'active').length;
    const suspended = this.clinics.filter((c) => c.status === 'suspended').length;
    const deleted = this.clinics.filter((c) => c.status === 'deleted').length;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const createdLast30Days = this.clinics.filter(
      (c) => new Date(c.createdAt).getTime() >= thirtyDaysAgo
    ).length;

    const latest = [...this.clinics]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        status: c.status,
        createdAt: c.createdAt,
      }));

    return {
      total,
      active,
      suspended,
      deleted,
      createdLast30Days,
      latest,
    };
  }

  async listClinics(query: PlatformClinicsListQuery = {}): Promise<PlatformClinicsListResponse> {
    await new Promise((res) => setTimeout(res, 250));

    let filtered = [...this.clinics];

    // Status filter: Default excludes deleted unless explicitly requested
    if (query.status) {
      filtered = filtered.filter((c) => c.status === query.status);
    } else {
      filtered = filtered.filter((c) => c.status !== 'deleted');
    }

    // Search filter
    if (query.search && query.search.trim()) {
      const term = query.search.trim().toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.slug.toLowerCase().includes(term) ||
          (c.phone && c.phone.includes(term))
      );
    }

    // Sort
    const sortField = query.sort || 'createdAt';
    const isAsc = (query.order || 'DESC').toUpperCase() === 'ASC';

    filtered.sort((a, b) => {
      let valA: any = a[sortField as keyof PlatformClinicItem] ?? '';
      let valB: any = b[sortField as keyof PlatformClinicItem] ?? '';

      if (sortField === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return isAsc ? -1 : 1;
      if (valA > valB) return isAsc ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const items = filtered.slice(skip, skip + limit);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async getClinic(id: string): Promise<PlatformClinicDetails> {
    await new Promise((res) => setTimeout(res, 200));
    const clinic = this.clinics.find((c) => c.id === id);
    if (!clinic) {
      const err = new Error('کلینیک مورد نظر یافت نشد.');
      (err as any).status = 404;
      throw err;
    }

    return {
      id: clinic.id,
      slug: clinic.slug,
      name: clinic.name,
      tagline: clinic.tagline,
      phone: clinic.phone,
      address: clinic.address,
      workingHours: clinic.workingHours,
      status: clinic.status,
      deletedAt: clinic.deletedAt,
      createdAt: clinic.createdAt,
      lastAppointmentAt: '2026-10-20T18:30:00.000Z',
      counts: {
        doctors: Math.max(1, Math.floor(clinic.totalUsers / 2)),
        services: 6,
        clients: 84,
        appointments: clinic.totalAppointments,
        users: clinic.totalUsers,
      },
      owner: clinic.owner || null,
    };
  }

  async createClinic(
    payload: CreateClinicPayload
  ): Promise<{ clinic: PlatformClinicItem; owner: PlatformClinicOwner }> {
    await new Promise((res) => setTimeout(res, 350));

    const cleanSlug = payload.slug.trim().toLowerCase();

    if (RESERVED_SLUGS.includes(cleanSlug)) {
      const err = new Error('این شناسه انگلیسی جزو کلمات رزروشده سامانه است و امکان استفاده از آن وجود ندارد.');
      (err as any).status = 400;
      throw err;
    }

    const exists = this.clinics.some((c) => c.slug === cleanSlug);
    if (exists) {
      const err = new Error('کلینیکی با این شناسه انگلیسی (slug) از قبل وجود دارد.');
      (err as any).status = 409;
      throw err;
    }

    const newOwner: PlatformClinicOwner = {
      id: `usr-mock-${Date.now()}`,
      name: payload.ownerName,
      phone: payload.ownerPhone,
      role: 'owner',
    };

    const newClinic: PlatformClinicItem = {
      id: `clinic-${cleanSlug}`,
      slug: cleanSlug,
      name: payload.name,
      tagline: payload.tagline,
      phone: payload.phone,
      address: payload.address,
      workingHours: payload.workingHours,
      status: 'active',
      createdAt: new Date().toISOString(),
      owner: newOwner,
      totalUsers: 1,
      totalAppointments: 0,
    };

    this.clinics.unshift(newClinic);
    return { clinic: newClinic, owner: newOwner };
  }

  async updateClinic(id: string, payload: UpdateClinicPayload): Promise<PlatformClinicDetails> {
    await new Promise((res) => setTimeout(res, 250));
    const idx = this.clinics.findIndex((c) => c.id === id);
    if (idx === -1) {
      const err = new Error('کلینیک یافت نشد.');
      (err as any).status = 404;
      throw err;
    }

    this.clinics[idx] = {
      ...this.clinics[idx],
      name: payload.name ?? this.clinics[idx].name,
      tagline: payload.tagline ?? this.clinics[idx].tagline,
      phone: payload.phone ?? this.clinics[idx].phone,
      address: payload.address ?? this.clinics[idx].address,
      workingHours: payload.workingHours ?? this.clinics[idx].workingHours,
    };

    return this.getClinic(id);
  }

  async updateClinicStatus(
    id: string,
    targetStatus: ClinicStatus
  ): Promise<{ id: string; slug: string; name: string; status: ClinicStatus; deletedAt?: string | null }> {
    await new Promise((res) => setTimeout(res, 200));
    const idx = this.clinics.findIndex((c) => c.id === id);
    if (idx === -1) {
      const err = new Error('کلینیک یافت نشد.');
      (err as any).status = 404;
      throw err;
    }

    const currentStatus = this.clinics[idx].status;

    // Transition state machine validation
    const isValidTransition =
      (currentStatus === 'active' && (targetStatus === 'suspended' || targetStatus === 'deleted')) ||
      (currentStatus === 'suspended' && (targetStatus === 'active' || targetStatus === 'deleted')) ||
      (currentStatus === 'deleted' && targetStatus === 'active');

    if (!isValidTransition) {
      const err = new Error(`امکان انتقال وضعیت از ${currentStatus} به ${targetStatus} وجود ندارد.`);
      (err as any).status = 409;
      throw err;
    }

    this.clinics[idx].status = targetStatus;
    if (targetStatus === 'deleted') {
      this.clinics[idx].deletedAt = new Date().toISOString();
    } else {
      this.clinics[idx].deletedAt = null;
    }

    return {
      id: this.clinics[idx].id,
      slug: this.clinics[idx].slug,
      name: this.clinics[idx].name,
      status: this.clinics[idx].status,
      deletedAt: this.clinics[idx].deletedAt,
    };
  }

  async deleteClinic(id: string, confirmSlug: string): Promise<{ success: boolean; message: string }> {
    await new Promise((res) => setTimeout(res, 300));
    const clinic = this.clinics.find((c) => c.id === id);
    if (!clinic) {
      const err = new Error('کلینیک یافت نشد.');
      (err as any).status = 404;
      throw err;
    }

    if (clinic.status !== 'deleted') {
      const err = new Error('حذف دائمی کلینیک تنها پس از انتقال به وضعیت حذف‌شده (deleted) امکان‌پذیر است.');
      (err as any).status = 409;
      throw err;
    }

    if (clinic.slug !== confirmSlug) {
      const err = new Error('شناسه انگلیسی واردشده برای تایید حذف با شناسه کلینیک مطابقت ندارد.');
      (err as any).status = 400;
      throw err;
    }

    this.clinics = this.clinics.filter((c) => c.id !== id);
    return { success: true, message: `کلینیک ${clinic.name} با موفقیت حذف دائم گردید.` };
  }

  // --- Mock Data & Methods for Doctors, Services, and Holidays ---

  private doctors: Doctor[] = [
    {
      id: 'doc-1',
      clinicId: 'clinic-ariana',
      name: 'دکتر علیرضا محمدی',
      specialty: 'متخصص پوست و مو',
      startHour: 9,
      endHour: 18,
      slotIntervalMinutes: 30,
      isActive: true,
      weeklySchedule: [
        { dayOfWeek: 6, isActive: true, startHour: 9, endHour: 18 },
        { dayOfWeek: 0, isActive: true, startHour: 9, endHour: 18 },
        { dayOfWeek: 1, isActive: true, startHour: 9, endHour: 18 },
        { dayOfWeek: 2, isActive: true, startHour: 9, endHour: 18 },
        { dayOfWeek: 3, isActive: true, startHour: 9, endHour: 18 },
        { dayOfWeek: 4, isActive: false, startHour: 9, endHour: 18 },
        { dayOfWeek: 5, isActive: false, startHour: 9, endHour: 18 },
      ],
    },
  ];

  private services: Service[] = [
    {
      id: 'srv-1',
      clinicId: 'clinic-ariana',
      name: 'ویزیت تخصصی پوست',
      duration: 30,
      price: 450000,
      category: 'پوست و مو',
      isActive: true,
    },
  ];

  private holidays: BlockedDay[] = [
    {
      id: 'hol-1',
      clinicId: 'clinic-ariana',
      doctorId: null,
      date: '2026-12-30',
      reason: 'تعطیل رسمی کلینیک',
    },
  ];

  async getDoctors(clinicId: string): Promise<Doctor[]> {
    return this.doctors.filter((d) => d.clinicId === clinicId);
  }

  async createDoctor(clinicId: string, payload: Partial<Doctor>): Promise<Doctor> {
    const doc: Doctor = {
      id: `doc-${Date.now()}`,
      clinicId,
      name: payload.name || 'پزشک جدید',
      specialty: payload.specialty || 'پزشک عمومی',
      startHour: payload.startHour ?? 9,
      endHour: payload.endHour ?? 18,
      slotIntervalMinutes: payload.slotIntervalMinutes ?? 30,
      avatar: payload.avatar,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      weeklySchedule: payload.weeklySchedule ?? null,
    };
    this.doctors.push(doc);
    return doc;
  }

  async updateDoctor(clinicId: string, doctorId: string, payload: Partial<Doctor>): Promise<Doctor> {
    const idx = this.doctors.findIndex((d) => d.id === doctorId && d.clinicId === clinicId);
    if (idx === -1) throw new Error('پزشک یافت نشد.');
    this.doctors[idx] = { ...this.doctors[idx], ...payload };
    return this.doctors[idx];
  }

  async deleteDoctor(clinicId: string, doctorId: string): Promise<{ success: boolean }> {
    this.doctors = this.doctors.filter((d) => !(d.id === doctorId && d.clinicId === clinicId));
    return { success: true };
  }

  async getServices(clinicId: string): Promise<Service[]> {
    return this.services.filter((s) => s.clinicId === clinicId);
  }

  async createService(clinicId: string, payload: Partial<Service>): Promise<Service> {
    const srv: Service = {
      id: `srv-${Date.now()}`,
      clinicId,
      name: payload.name || 'خدمت جدید',
      duration: payload.duration ?? 30,
      price: payload.price ?? 0,
      category: payload.category || 'عمومی',
      description: payload.description,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    };
    this.services.push(srv);
    return srv;
  }

  async updateService(clinicId: string, serviceId: string, payload: Partial<Service>): Promise<Service> {
    const idx = this.services.findIndex((s) => s.id === serviceId && s.clinicId === clinicId);
    if (idx === -1) throw new Error('خدمت یافت نشد.');
    this.services[idx] = { ...this.services[idx], ...payload };
    return this.services[idx];
  }

  async deleteService(clinicId: string, serviceId: string): Promise<{ success: boolean }> {
    this.services = this.services.filter((s) => !(s.id === serviceId && s.clinicId === clinicId));
    return { success: true };
  }

  async getHolidays(clinicId: string, doctorId?: string): Promise<BlockedDay[]> {
    return this.holidays.filter(
      (h) => h.clinicId === clinicId && (!doctorId || h.doctorId === doctorId),
    );
  }

  async createHoliday(
    clinicId: string,
    payload: { doctorId?: string | null; date: string; reason?: string | null },
  ): Promise<BlockedDay> {
    const holiday: BlockedDay = {
      id: `hol-${Date.now()}`,
      clinicId,
      doctorId: payload.doctorId || null,
      date: payload.date,
      reason: payload.reason || null,
      createdAt: new Date().toISOString(),
    };
    this.holidays.push(holiday);
    return holiday;
  }

  async deleteHoliday(clinicId: string, holidayId: string): Promise<{ success: boolean }> {
    this.holidays = this.holidays.filter((h) => !(h.id === holidayId && h.clinicId === clinicId));
    return { success: true };
  }
}
