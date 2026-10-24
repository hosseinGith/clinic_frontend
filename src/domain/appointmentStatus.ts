export type AppointmentStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'pending_payment'
  | 'in_clinic'
  | 'completed'
  | 'cancelled';

export const AppointmentStatus = {
  PENDING_CONFIRMATION: 'pending_confirmation',
  CONFIRMED: 'confirmed',
  PENDING_PAYMENT: 'pending_payment',
  IN_CLINIC: 'in_clinic',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export interface StatusMeta {
  label: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
}

export const STATUS_META: Record<AppointmentStatus, StatusMeta> = {
  pending_confirmation: {
    label: 'در انتظار تأیید',
    bgClass: 'bg-neutral-100',
    textClass: 'text-neutral-700',
    dotClass: 'bg-neutral-400',
  },
  confirmed: {
    label: 'تأیید شده',
    bgClass: 'bg-teal-50',
    textClass: 'text-teal-800',
    dotClass: 'bg-[#0f766e]',
  },
  pending_payment: {
    label: 'در انتظار پرداخت',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    dotClass: 'bg-amber-500',
  },
  in_clinic: {
    label: 'در کلینیک',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-800',
    dotClass: 'bg-sky-500',
  },
  completed: {
    label: 'تکمیل شده',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    dotClass: 'bg-emerald-600',
  },
  cancelled: {
    label: 'لغو شده',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-800',
    dotClass: 'bg-rose-500',
  },
};

/**
 * State Transition Matrix for Appointments.
 */
const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending_confirmation: ['confirmed', 'cancelled'],
  confirmed: ['in_clinic', 'pending_payment', 'cancelled'],
  pending_payment: ['in_clinic', 'confirmed', 'completed', 'cancelled'],
  in_clinic: ['completed', 'pending_payment', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * Role-specific allowed transitions.
 */
import type { Role } from './session';

const ROLE_ALLOWED_TRANSITIONS: Record<Role, Partial<Record<AppointmentStatus, AppointmentStatus[]>>> = {
  owner: ALLOWED_TRANSITIONS,
  admin: ALLOWED_TRANSITIONS,
  reception: {
    pending_confirmation: ['confirmed', 'cancelled'],
    confirmed: ['in_clinic', 'pending_payment', 'cancelled'],
    pending_payment: ['in_clinic', 'confirmed', 'completed', 'cancelled'],
    in_clinic: ['completed', 'pending_payment', 'cancelled'],
    completed: [],
    cancelled: [],
  },
  doctor: {
    confirmed: ['in_clinic'],
    in_clinic: ['completed'],
    pending_confirmation: [],
    pending_payment: [],
    completed: [],
    cancelled: [],
  },
  patient: {
    pending_confirmation: ['cancelled'],
    confirmed: ['cancelled'],
    pending_payment: ['cancelled'],
    in_clinic: [],
    completed: [],
    cancelled: [],
  },
  super_admin: {},
};

/**
 * Checks whether transitioning from one status to another is permitted generally.
 */
export const canTransition = (
  from: AppointmentStatus,
  to: AppointmentStatus,
  role?: Role
): boolean => {
  if (role) {
    return canTransitionByRole(from, to, role);
  }
  if (from === to) return false;
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
};

/**
 * Checks whether transitioning from one status to another is permitted for a specific role.
 */
export const canTransitionByRole = (
  from: AppointmentStatus,
  to: AppointmentStatus,
  role: Role
): boolean => {
  if (from === to) return false;
  const roleTransitions = ROLE_ALLOWED_TRANSITIONS[role] || ALLOWED_TRANSITIONS;
  const allowed = roleTransitions[from];
  return allowed ? allowed.includes(to) : false;
};

/**
 * Returns the list of permitted next statuses for an appointment.
 */
export const getAvailableTransitions = (
  status: AppointmentStatus
): AppointmentStatus[] => {
  return ALLOWED_TRANSITIONS[status] || [];
};

/**
 * Returns the list of permitted next statuses for a specific role.
 */
export const getAvailableTransitionsByRole = (
  status: AppointmentStatus,
  role: Role
): AppointmentStatus[] => {
  const roleTransitions = ROLE_ALLOWED_TRANSITIONS[role] || ALLOWED_TRANSITIONS;
  return roleTransitions[status] || [];
};
