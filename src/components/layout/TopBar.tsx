import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useClinic } from '../../app/contexts';
import { useAppointments } from '../../features/appointments/hooks/useAppointments';
import { useOutboxMessages } from '../../features/messages/hooks/useMessages';
import { toPersianDigits } from '../../lib/format';
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  Building2,
  Check,
  LogOut,
} from 'lucide-react';
import { ROLE_LABELS } from '../../domain/session';

export interface TopBarProps {
  onOpenMobileSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileSidebar }) => {
  const navigate = useNavigate();
  const { user, session, logout } = useAuth();
  const { clinic, clinicId, setClinic } = useClinic();
  const [isClinicMenuOpen, setIsClinicMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: appointments = [] } = useAppointments(clinicId);
  const { data: messages = [] } = useOutboxMessages(clinicId);

  const pendingAppointmentsCount = appointments.filter(
    (a) => a.status === 'pending_confirmation'
  ).length;
  const failedMessagesCount = messages.filter((m) => m.status === 'failed').length;
  const totalNotifications = pendingAppointmentsCount + failedMessagesCount;

  const availableClinics = session?.availableClinics || [clinic];
  const hasMultipleClinics = availableClinics.length > 1;

  const handleSubmitSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/appointments?search=${encodeURIComponent(q)}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmitSearch();
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Right side (in RTL): Mobile Hamburger + Workspace Switcher */}
      <div className="flex items-center gap-3">
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 lg:hidden"
            aria-label="باز کردن منو"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Workspace Switcher or Static Title */}
        {hasMultipleClinics ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsClinicMenuOpen(!isClinicMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs sm:text-sm font-semibold text-neutral-900 transition-colors"
              aria-expanded={isClinicMenuOpen}
            >
              <Building2 className="w-4 h-4 text-[#0f766e]" />
              <span>{clinic.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {isClinicMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-60 bg-white rounded-lg border border-neutral-200 shadow-lg py-1.5 z-50 animate-in fade-in"
                onClick={() => setIsClinicMenuOpen(false)}
              >
                <div className="px-3 py-1 text-[11px] font-semibold text-neutral-400">
                  فضاهای کاری در دسترس
                </div>
                {availableClinics.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setClinic(c)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-right text-neutral-700 hover:bg-neutral-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0f766e]" />
                      <span className="font-medium">{c.name}</span>
                    </div>
                    {c.id === clinic.id && <Check className="w-3.5 h-3.5 text-[#0f766e]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-neutral-900">
            <Building2 className="w-4 h-4 text-[#0f766e]" />
            <span>{clinic.name}</span>
          </div>
        )}
      </div>

      {/* Left side (in RTL): Search, Notification Bell, User Profile, Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <button
            type="button"
            onClick={handleSubmitSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700 transition-colors"
            aria-label="جستجو"
          >
            <Search className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="جستجوی مراجع، نوبت..."
            className="w-full pr-9 pl-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0f766e]"
          />
        </div>

        {/* Notification Bell with Dynamic Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            title="اعلان‌ها"
            aria-label="اعلان‌ها"
          >
            <Bell className="w-4 h-4" />
            {totalNotifications > 0 && (
              <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {toPersianDigits(totalNotifications)}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div
              className="absolute left-0 mt-2 w-64 bg-white rounded-lg border border-neutral-200 shadow-lg py-2 z-50 text-right animate-in fade-in"
              onClick={() => setIsNotifOpen(false)}
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 border-b border-neutral-100">
                اعلان‌های سیستم
              </div>
              {totalNotifications === 0 ? (
                <div className="px-3 py-3 text-xs text-neutral-500 text-center">
                  اعلان جدیدی وجود ندارد
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {pendingAppointmentsCount > 0 && (
                    <Link
                      to="/appointments?status=pending_confirmation"
                      className="flex items-center justify-between px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50"
                    >
                      <span>نوبت‌های در انتظار تأیید</span>
                      <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[11px]">
                        {toPersianDigits(pendingAppointmentsCount)}
                      </span>
                    </Link>
                  )}
                  {failedMessagesCount > 0 && (
                    <Link
                      to="/messages"
                      className="flex items-center justify-between px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50"
                    >
                      <span>پیام‌های ناموفق در ارسال</span>
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[11px]">
                        {toPersianDigits(failedMessagesCount)}
                      </span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Avatar + Profile */}
        <div className="flex items-center gap-2.5 pl-1 border-r border-neutral-200 pr-3">
          <div className="w-8 h-8 rounded-full bg-teal-100 text-[#0f766e] font-bold text-xs flex items-center justify-center">
            {user?.avatarInitials || 'ک'}
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold text-neutral-900">
              {user?.name || 'کاربر سیستم'}
            </div>
            <div className="text-[10px] text-neutral-500">
              {user?.roleTitle || (user?.role ? ROLE_LABELS[user.role] : '')}
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            className="p-1.5 mr-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="خروج از حساب کاربری"
            aria-label="خروج از حساب کاربری"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
