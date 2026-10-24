import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useClinic } from '../../app/contexts';
import { usePermissions } from '../../app/usePermissions';
import { useAppointments, useUpdateAppointmentStatus } from './hooks/useAppointments';
import type { AppointmentStatus } from '../../domain/appointmentStatus';
import { STATUS_META, getAvailableTransitionsByRole } from '../../domain/appointmentStatus';
import { getInitials, formatTimeFa, formatTrackingCodeFa, formatPhoneNumber, toPersianDigits } from '../../lib/format';
import { formatIsoToJalali, getTodayDateString, getTomorrowDateString } from '../../lib/jalali';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/common/ErrorState';
import { Search, Filter, MoreVertical, ChevronRight, ChevronLeft } from 'lucide-react';

import { useDebounce } from '../../lib/useDebounce';
import { useClickOutside } from '../../lib/useClickOutside';

type DateFilterTab = 'all' | 'today' | 'tomorrow';

export const AppointmentsView: React.FC = () => {
  const { clinicId } = useClinic();
  const { can, role } = usePermissions();
  const canUpdateStatus = can('appointments:update_status');
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | undefined>(
    () => (searchParams.get('status') as AppointmentStatus) || undefined
  );
  const [dateFilter, setDateFilter] = useState<DateFilterTab>(() => {
    const urlDate = searchParams.get('date');
    return urlDate === 'tomorrow' ? 'tomorrow' : urlDate === 'today' ? 'today' : 'all';
  });
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setActiveMenuId(null), activeMenuId !== null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: appointments = [], isLoading, isError, refetch } = useAppointments(clinicId, {
    search: debouncedSearch,
    status: statusFilter,
  });

  const prevStatusesRef = React.useRef<Record<string, string>>({});
  const [highlightedRowIds, setHighlightedRowIds] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (appointments.length === 0) return;
    const newHighlights: string[] = [];
    const prev = prevStatusesRef.current;
    const nextStatuses: Record<string, string> = {};

    appointments.forEach((apt) => {
      nextStatuses[apt.id] = apt.status;
      if (prev[apt.id] && prev[apt.id] !== apt.status) {
        newHighlights.push(apt.id);
      }
    });

    prevStatusesRef.current = nextStatuses;

    if (newHighlights.length > 0) {
      setHighlightedRowIds((current) => {
        const updated = { ...current };
        newHighlights.forEach((id) => {
          updated[id] = true;
        });
        return updated;
      });

      const timer = setTimeout(() => {
        setHighlightedRowIds((current) => {
          const updated = { ...current };
          newHighlights.forEach((id) => {
            delete updated[id];
          });
          return updated;
        });
      }, 900);

      return () => clearTimeout(timer);
    }
  }, [appointments]);

  const updateStatusMutation = useUpdateAppointmentStatus(clinicId);

  const todayDateStr = getTodayDateString();
  const tomorrowDateStr = getTomorrowDateString();

  const filteredAppointments = appointments.filter((apt) => {
    if (dateFilter === 'today' && apt.date !== todayDateStr) return false;
    if (dateFilter === 'tomorrow' && apt.date !== tomorrowDateStr) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredAppointments.length / pageSize) || 1;
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            مدیریت نوبت‌ها
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            مشاهده، فیلتر و مدیریت وضعیت تمامی نوبت‌های ثبت‌شده
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute inset-y-0 right-3 my-auto text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="جستجوی نام یا تلفن مراجع..."
              className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0f766e]"
            />
          </div>

          {/* Date Filter Tabs */}
          <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 text-xs font-medium text-neutral-600 w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={() => {
                setDateFilter('today');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md transition-colors ${dateFilter === 'today'
                ? 'bg-white text-neutral-900 shadow-sm font-semibold'
                : 'hover:text-neutral-900'
                }`}
            >
              امروز
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFilter('tomorrow');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md transition-colors ${dateFilter === 'tomorrow'
                ? 'bg-white text-neutral-900 shadow-sm font-semibold'
                : 'hover:text-neutral-900'
                }`}
            >
              فردا
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md transition-colors ${dateFilter === 'all'
                ? 'bg-white text-neutral-900 shadow-sm font-semibold'
                : 'hover:text-neutral-900'
                }`}
            >
              همه
            </button>
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
          <select
            value={statusFilter || ''}
            onChange={(e) => {
              setStatusFilter((e.target.value as AppointmentStatus) || undefined);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 text-xs sm:text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:border-[#0f766e]"
          >
            <option value="">همه وضعیت‌ها</option>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Appointments Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/60 text-neutral-500 text-xs font-medium">
                  <th scope="col" className="h-11 px-4 text-right">تاریخ و ساعت</th>
                  <th scope="col" className="h-11 px-4 text-right">مراجع</th>
                  <th scope="col" className="h-11 px-4 text-right">خدمت</th>
                  <th scope="col" className="h-11 px-4 text-right">متخصص</th>
                  <th scope="col" className="h-11 px-4 text-right">کد پیگیری</th>
                  <th scope="col" className="h-11 px-4 text-right">وضعیت</th>
                  <th scope="col" className="h-11 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-sm text-neutral-900">
                {paginatedAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-neutral-500">
                      هیچ نوبتی با این مشخصات یافت نشد.
                    </td>
                  </tr>
                ) : (
                  paginatedAppointments.map((apt) => {
                    const meta = STATUS_META[apt.status];
                    const transitions = role ? getAvailableTransitionsByRole(apt.status, role) : [];
                    const isMenuOpen = activeMenuId === apt.id;
                    const isHighlighted = !!highlightedRowIds[apt.id];

                    return (
                      <tr
                        key={apt.id}
                        className={`h-14 hover:bg-neutral-50/60 transition-colors ${isHighlighted ? 'mf-row-highlight' : ''
                          }`}
                      >
                        <td className="px-4 whitespace-nowrap text-xs sm:text-sm">
                          <span className="font-semibold text-neutral-900 block">{formatTimeFa(apt.time)}</span>
                          <span className="text-neutral-500 text-[11px]">{formatIsoToJalali(apt.date)}</span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-teal-50 text-[#0f766e] font-bold text-xs flex items-center justify-center shrink-0">
                              {getInitials(apt.clientName)}
                            </div>
                            <div>
                              <div className="font-semibold text-xs sm:text-sm">{apt.clientName}</div>
                              <div className="text-[11px] text-neutral-400 font-mono">{formatPhoneNumber(apt.clientPhone)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 text-neutral-700 text-xs sm:text-sm whitespace-nowrap">
                          {apt.serviceName}
                        </td>
                        <td className="px-4 text-neutral-700 text-xs sm:text-sm whitespace-nowrap">
                          {apt.doctorName}
                        </td>
                        <td className="px-4 font-mono text-xs text-neutral-500 whitespace-nowrap">
                          {formatTrackingCodeFa(apt.trackingCode)}
                        </td>
                        <td className="px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.bgClass} ${meta.textClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                            <span>{meta.label}</span>
                          </span>
                        </td>
                        <td className="px-4 whitespace-nowrap text-center relative">
                          {canUpdateStatus && apt.status === 'in_clinic' && (role === 'reception' || role === 'owner' || role === 'admin') ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => updateStatusMutation.mutate({ id: apt.id, newStatus: 'completed' })}
                                className="text-xs px-2 py-1 h-7 bg-emerald-600 hover:bg-emerald-700"
                                title="تکمیل و خروج مراجع"
                              >
                                <span>تکمیل و تسویه</span>
                              </Button>
                              {transitions.length > 0 && (
                                <div
                                  ref={isMenuOpen ? menuRef : undefined}
                                  className="relative inline-block text-right"
                                >
                                  <button
                                    type="button"
                                    onClick={() => setActiveMenuId(isMenuOpen ? null : apt.id)}
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                  {isMenuOpen && (
                                    <div
                                      className="absolute left-0 mt-1 w-36 bg-white rounded-lg border border-neutral-200 shadow-lg py-1 z-50 text-xs animate-in fade-in"
                                      onClick={() => setActiveMenuId(null)}
                                    >
                                      {transitions.map((nextStatus) => (
                                        <button
                                          key={nextStatus}
                                          type="button"
                                          onClick={() => updateStatusMutation.mutate({ id: apt.id, newStatus: nextStatus })}
                                          className="w-full text-right px-3 py-1.5 hover:bg-neutral-50 text-neutral-700"
                                        >
                                          تغییر به: {STATUS_META[nextStatus].label}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : canUpdateStatus && transitions.length > 0 ? (
                            <div
                              ref={isMenuOpen ? menuRef : undefined}
                              className="relative inline-block text-right"
                            >
                              <button
                                type="button"
                                onClick={() => setActiveMenuId(isMenuOpen ? null : apt.id)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {isMenuOpen && (
                                <div
                                  className="absolute flex flex-col left-0 mt-1 w-36 bg-white rounded-lg border border-neutral-200 shadow-lg py-1 z-50 text-xs animate-in fade-in"
                                  onClick={() => setActiveMenuId(null)}
                                >
                                  {transitions.map((nextStatus) => (
                                    <button
                                      key={nextStatus}
                                      type="button"
                                      onClick={() => updateStatusMutation.mutate({ id: apt.id, newStatus: nextStatus })}
                                      className="w-full text-right px-3 py-1.5 hover:bg-neutral-50 text-neutral-700"
                                    >
                                      تغییر به: {STATUS_META[nextStatus].label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Client-Side Pagination */}
        {filteredAppointments.length > pageSize && (
          <div className="p-4 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600 bg-neutral-50/50">
            <div>
              نمایش {toPersianDigits((currentPage - 1) * pageSize + 1)} تا{' '}
              {toPersianDigits(Math.min(currentPage * pageSize, filteredAppointments.length))} از{' '}
              {toPersianDigits(filteredAppointments.length)} نوبت
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 text-xs gap-1"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>قبلی</span>
              </Button>
              <span className="font-medium text-neutral-800">
                صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 text-xs gap-1"
              >
                <span>بعدی</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
