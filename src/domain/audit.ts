import type { Role } from './session';

export type AuditAction =
  | 'auth.login_success'
  | 'auth.login_failed'
  | 'auth.logout'
  | 'medical_notes.view'
  | 'medical_notes.update'
  | 'appointment.status_change'
  | 'user.role_change'
  | 'user.created'
  | 'user.activated'
  | 'user.deactivated';

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  'auth.login_success': 'ورود موفق به سامانه',
  'auth.login_failed': 'تلاش ناموفق برای ورود',
  'auth.logout': 'خروج از حساب کاربری',
  'medical_notes.view': 'مشاهده پرونده حساس پزشکی',
  'medical_notes.update': 'ویرایش یا ثبت پرونده پزشکی',
  'appointment.status_change': 'تغییر وضعیت نوبت',
  'user.role_change': 'تغییر سطح دسترسی کاربر',
  'user.created': 'ایجاد کاربر جدید',
  'user.activated': 'فعال‌سازی حساب کاربر',
  'user.deactivated': 'غیرفعال‌سازی حساب کاربر',
};

export interface AuditLogEntry {
  id: string;
  clinicId: string;
  userId: string;
  userName: string;
  role: Role;
  action: AuditAction;
  actionLabel: string;
  details?: string;
  createdAt: string;
}
