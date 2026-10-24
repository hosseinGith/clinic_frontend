export const queryKeys = {
  appointments: {
    all: (clinicId: string) => ['appointments', clinicId] as const,
    list: (clinicId: string, filters?: Record<string, unknown>) =>
      ['appointments', clinicId, 'list', filters] as const,
    todayQueue: (clinicId: string, actorId?: string) =>
      ['appointments', clinicId, 'todayQueue', actorId] as const,
    detail: (clinicId: string, id: string) =>
      ['appointments', clinicId, 'detail', id] as const,
    myAppointments: (clinicId: string, phoneOrId: string) =>
      ['appointments', clinicId, 'myAppointments', phoneOrId] as const,
  },
  dashboard: {
    summary: (clinicId: string) => ['dashboard', clinicId, 'summary'] as const,
    nextActions: (clinicId: string) => ['dashboard', clinicId, 'nextActions'] as const,
  },
  clients: {
    all: (clinicId: string, search?: string) =>
      ['clients', clinicId, { search }] as const,
    atRisk: (clinicId: string) => ['clients', clinicId, 'atRisk'] as const,
    detail: (clinicId: string, id: string) => ['clients', clinicId, id] as const,
  },
  leads: {
    all: (clinicId: string) => ['leads', clinicId] as const,
    hot: (clinicId: string) => ['leads', clinicId, 'hot'] as const,
  },
  catalog: {
    services: (clinicId: string) => ['catalog', clinicId, 'services'] as const,
    doctors: (clinicId: string) => ['catalog', clinicId, 'doctors'] as const,
    clinicBySlug: (slug: string) => ['catalog', 'clinic', slug] as const,
  },
  automations: {
    all: (clinicId: string) => ['automations', clinicId] as const,
    stats: (clinicId: string) => ['automations', clinicId, 'stats'] as const,
  },
  booking: {
    slots: (clinicId: string, doctorId: string, serviceId: string, date: string) =>
      ['booking', clinicId, 'slots', { doctorId, serviceId, date }] as const,
  },
  messages: {
    outbox: (clinicId: string) => ['messages', clinicId, 'outbox'] as const,
  },
  integrations: {
    all: () => ['integrations', 'all'] as const,
    sidebar: () => ['integrations', 'sidebar'] as const,
  },
  auth: {
    currentUser: () => ['auth', 'currentUser'] as const,
    users: (clinicId: string) => ['auth', clinicId, 'users'] as const,
  },
  audit: {
    logs: (clinicId: string) => ['audit', clinicId, 'logs'] as const,
  },
  platform: {
    summary: () => ['platform', 'summary'] as const,
    clinics: (query?: Record<string, unknown>) => ['platform', 'clinics', query] as const,
    clinicDetail: (id: string) => ['platform', 'clinics', 'detail', id] as const,
    clinicSubscription: (id: string) => ['platform', 'clinics', id, 'subscription'] as const,
    plans: (includeInactive?: boolean) => ['platform', 'plans', { includeInactive }] as const,
    planDetail: (id: string) => ['platform', 'plans', id] as const,
    invoices: (query?: Record<string, unknown>) => ['platform', 'invoices', query] as const,
    invoiceDetail: (id: string) => ['platform', 'invoices', id] as const,
    payments: (query?: Record<string, unknown>) => ['platform', 'payments', query] as const,
    revenueSummary: (query?: Record<string, unknown>) => ['platform', 'revenue', 'summary', query] as const,
    revenueTimeseries: (query?: Record<string, unknown>) => ['platform', 'revenue', 'timeseries', query] as const,
    revenueByClinic: (query?: Record<string, unknown>) => ['platform', 'revenue', 'by-clinic', query] as const,
    revenueByPlan: (query?: Record<string, unknown>) => ['platform', 'revenue', 'by-plan', query] as const,
  },
  subscription: {
    me: (clinicId?: string) => ['subscription', clinicId || 'me'] as const,
    invoices: (clinicId?: string, query?: Record<string, unknown>) => ['subscription', clinicId || 'me', 'invoices', query] as const,
  },
};

export const platformQueryKeys = queryKeys.platform;
export const subscriptionQueryKeys = queryKeys.subscription;

