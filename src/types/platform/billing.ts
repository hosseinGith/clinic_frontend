export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'expired' | 'canceled';
export type BillingCycle = 'monthly' | 'yearly';
export type InvoiceStatus = 'open' | 'paid' | 'void';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type PaymentMethod = 'manual' | 'gateway';

export interface Plan {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  priceMonthly: number; // in Rials
  priceYearly: number;  // in Rials
  maxDoctors: number;
  maxMonthlyAppointments: number;
  monthlySmsQuota: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subscription {
  id: string;
  clinicId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startsAt: string;
  currentPeriodEnd?: string | null;
  trialEndsAt?: string | null;
  graceEndsAt?: string | null;
  autoRenew: boolean;
  priceAtSubscription: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClinicSubscriptionUsage {
  subscription: Subscription | null;
  plan: Plan | null;
  usage: {
    doctorsCount: number;
    maxDoctors: number;
    doctorsPercentage: number;
    monthlyAppointmentsCount: number;
    maxMonthlyAppointments: number;
    appointmentsPercentage: number;
    monthlySmsCount: number;
    monthlySmsQuota: number;
    smsPercentage: number;
  };
  daysRemaining: number;
}

export interface Invoice {
  id: string;
  clinicId: string;
  subscriptionId: string;
  number: string;
  amount: number; // in Rials
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  paidAt?: string | null;
  voidReason?: string | null;
  createdAt: string;
  clinicName?: string;
  clinicSlug?: string;
}

export interface Payment {
  id: string;
  clinicId: string;
  invoiceId: string;
  amount: number; // in Rials
  status: PaymentStatus;
  method: PaymentMethod;
  gatewayRef?: string | null;
  idempotencyKey?: string | null;
  recordedBy: string;
  createdAt: string;
}

export interface RevenueSummary {
  mrr: number; // in Rials
  totalRevenue: number; // in Rials
  previousRevenue: number;
  growthRate: number;
  subscriptionsCount: {
    trial: number;
    active: number;
    past_due: number;
    expired: number;
    canceled: number;
    total: number;
  };
  overdueInvoices: {
    count: number;
    totalAmount: number;
  };
  expiringIn14DaysCount: number;
  estimatedClinicRevenue: number; // in Rials
}

export interface RevenueTimeseriesPoint {
  date: string;
  amount: number;
  count: number;
}

export interface RevenueByClinicItem {
  clinicId: string;
  clinicName: string;
  clinicSlug: string;
  totalPaid: number;
  paymentCount: number;
}

export interface RevenueByPlanItem {
  planId: string;
  planCode: string;
  planName: string;
  totalPaid: number;
  paymentCount: number;
}
