import {
  LayoutDashboard,
  Calendar,
  Users,
  Target,
  MessageSquare,
  Megaphone,
  BarChart3,
  Settings,
  Shield,
  UserCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Permission } from '../domain/permissions';

export interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: LucideIcon;
  badge?: number | string;
  permission?: Permission;
}

export const MAIN_NAVIGATION: NavItem[] = [
  {
    id: 'dashboard',
    title: 'داشبورد',
    path: '/',
    icon: LayoutDashboard,
    permission: 'appointments:read',
  },
  {
    id: 'appointments',
    title: 'نوبت‌ها',
    path: '/appointments',
    icon: Calendar,
    permission: 'appointments:read',
  },
  {
    id: 'clients',
    title: 'مشتریان',
    path: '/clients',
    icon: Users,
    permission: 'clients:read',
  },
  {
    id: 'leads',
    title: 'سرنخ‌ها',
    path: '/leads',
    icon: Target,
    badge: 4,
    permission: 'leads:read',
  },
  {
    id: 'messages',
    title: 'پیام‌ها',
    path: '/messages',
    icon: MessageSquare,
    permission: 'messages:read',
  },
  {
    id: 'marketing',
    title: 'بازاریابی',
    path: '/marketing',
    icon: Megaphone,
    permission: 'marketing:manage',
  },
  {
    id: 'reports',
    title: 'گزارش‌ها',
    path: '/reports',
    icon: BarChart3,
    permission: 'reports:read',
  },
  {
    id: 'users',
    title: 'کاربران و دسترسی‌ها',
    path: '/settings/users',
    icon: UserCheck,
    permission: 'users:manage',
  },
  {
    id: 'audit-logs',
    title: 'گزارش‌های امنیتی',
    path: '/settings/audit-logs',
    icon: Shield,
    permission: 'audit:read',
  },
  {
    id: 'settings',
    title: 'تنظیمات',
    path: '/settings',
    icon: Settings,
    permission: 'settings:manage',
  },
];
