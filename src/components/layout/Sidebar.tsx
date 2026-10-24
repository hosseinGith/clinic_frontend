import React from 'react';
import { NavLink } from 'react-router-dom';
import { MAIN_NAVIGATION } from '../../config/navigation';
import { SidebarServiceStatusCard } from './SidebarServiceStatusCard';
import { toPersianDigits } from '../../lib/format';
import { usePermissions } from '../../app/usePermissions';
import { useClinic } from '../../app/contexts';
import { useHotLeads } from '../../features/leads/hooks/useLeads';
import { X, Stethoscope, User } from 'lucide-react';

export interface SidebarProps {
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  const { can, role } = usePermissions();
  const { clinicId } = useClinic();
  const { data: hotLeads = [] } = useHotLeads(clinicId);

  const visibleNavItems = MAIN_NAVIGATION.filter((item) => {
    if (!item.permission) return true;
    return can(item.permission);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenOnMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 right-0 z-40 h-screen w-64 bg-white border-l border-neutral-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenOnMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Logo & Brand */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0f766e] text-white flex items-center justify-center font-bold text-base shadow-sm">
              M
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-900 tracking-tight leading-tight">
                مدفلو
              </h1>
              <p className="text-[11px] text-neutral-500 font-medium">
                سیستم رشد و عملیات کلینیک
              </p>
            </div>
          </div>

          {/* Mobile close button */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 lg:hidden"
              aria-label="بستن منو"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Center: Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Doctor Panel Direct Nav Link */}
          {role === 'doctor' && (
            <NavLink
              to="/doctor"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors mb-2 ${
                  isActive
                    ? 'bg-teal-50 text-[#0f766e] font-semibold ring-1 ring-[#0f766e]'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Stethoscope className="w-4 h-4 text-[#0f766e]" />
                <span>نوبت‌های تخصصی من</span>
              </div>
            </NavLink>
          )}

          {/* Patient Portal Direct Nav Link */}
          {role === 'patient' && (
            <NavLink
              to="/me"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors mb-2 ${
                  isActive
                    ? 'bg-teal-50 text-[#0f766e] font-semibold ring-1 ring-[#0f766e]'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-[#0f766e]" />
                <span>نوبت‌های من</span>
              </div>
            </NavLink>
          )}

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isLeadsItem = item.id === 'leads';
            const badgeCount = isLeadsItem ? hotLeads.length : item.badge;
            const showBadge = badgeCount !== undefined && Number(badgeCount) > 0 && can(item.permission || 'appointments:read');

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-[#0f766e] font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </div>

                {showBadge && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                    {toPersianDigits(badgeCount!)}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom: Service Status Card */}
        <div className="p-4 border-t border-neutral-200">
          <SidebarServiceStatusCard />
        </div>
      </aside>
    </>
  );
};
