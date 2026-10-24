import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatformClinicsList } from './hooks/usePlatformClinics';
import { useDebounce } from '../../lib/useDebounce';
import { formatIsoToJalali } from '../../lib/jalali';
import { toPersianDigits } from '../../lib/format';
import { CreateClinicModal } from './components/modals/CreateClinicModal';
import { StatusTransitionModal, HardDeleteClinicModal } from './components/modals/StatusModals';
import type { ClinicStatus, PlatformClinicItem } from '../../services/repositories/IPlatformClinicRepository';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  PauseCircle,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Building2,
  RotateCcw,
} from 'lucide-react';

export const PlatformClinicsView: React.FC = () => {
  const navigate = useNavigate();

  // Query parameters state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<ClinicStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'slug' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusModalTarget, setStatusModalTarget] = useState<{
    clinic: PlatformClinicItem;
    targetStatus: 'active' | 'suspended' | 'deleted';
  } | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<PlatformClinicItem | null>(null);

  // Toast / feedback message state
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // React Query fetching
  const { data, isLoading, isError, error, refetch } = usePlatformClinicsList({
    page,
    limit,
    search: debouncedSearch.trim() || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    sort: sortBy,
    order: sortOrder === 'asc' ? 'ASC' : 'DESC',
  });

  const clinics = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleSort = (field: 'createdAt' | 'name' | 'slug' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const renderSortIcon = (field: 'createdAt' | 'name' | 'slug' | 'status') => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-teal-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-teal-400" />
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between border shadow-lg animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">مدیریت کلینیک‌ها</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            مشاهده، جستجو، فیلتر، تغییر وضعیت چرخه حیات و ثبت کلینیک جدید در پلتفرم
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition-all duration-150 flex items-center gap-2 shadow-lg shadow-teal-900/30 hover:shadow-teal-900/50"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>ثبت کلینیک جدید</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-slate-900/70 border border-slate-800/80 rounded-2xl space-y-3.5 shadow-xl shadow-black/20 backdrop-blur-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-2">
            <label htmlFor="clinic-search" className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-teal-400" />
              <span>جستجو در نام، شناسه (اسلاگ) یا شماره تماس</span>
            </label>
            <div className="relative">
              <input
                id="clinic-search"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="مثال: شفا، shafa، 021..."
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-teal-400" />
              <span>وضعیت کلینیک</span>
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ClinicStatus | 'all');
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all cursor-pointer"
            >
              <option value="all">همه (فعال و معلق)</option>
              <option value="active">فعال</option>
              <option value="suspended">معلق</option>
              <option value="deleted">حذف شده</option>
            </select>
          </div>
        </div>

        {/* Limit and Sorting info */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span>تعداد در صفحه:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 cursor-pointer focus:border-teal-500 focus:outline-none"
            >
              <option value={5}>5 مورد</option>
              <option value={10}>10 مورد</option>
              <option value={20}>20 مورد</option>
              <option value={50}>50 مورد</option>
            </select>
          </div>

          <div className="text-slate-400">
            مجموع نتایج:{' '}
            <span className="text-slate-100 font-bold font-mono">
              {toPersianDigits(total)}
            </span>{' '}
            کلینیک
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-24 text-center bg-slate-900/70 border border-slate-800/80 rounded-2xl">
          <div className="w-9 h-9 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">در حال دریافت لیست کلینیک‌ها...</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span className="text-xs">
              خطا در بارگذاری لیست کلینیک‌ها: {(error as Error)?.message || 'اطلاعات در دسترس نیست'}
            </span>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تلاش مجدد</span>
          </button>
        </div>
      )}

      {/* Table & Content */}
      {!isLoading && !isError && clinics.length === 0 && (
        <div className="py-20 text-center bg-slate-900/70 border border-slate-800/80 rounded-2xl shadow-xl">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-slate-300">کلینیکی با این مشخصات یافت نشد.</p>
          <p className="text-xs text-slate-500 mt-1">
            عبارت جستجو را تغییر دهید یا کلینیک جدید ثبت کنید.
          </p>
        </div>
      )}

      {!isLoading && !isError && clinics.length > 0 && (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-slate-900/70 border border-slate-800/80 rounded-2xl shadow-xl shadow-black/20 overflow-hidden backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800/80 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th
                      onClick={() => handleSort('slug')}
                      className="py-3.5 px-4 font-semibold cursor-pointer hover:text-slate-200 select-none transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>شناسه (slug)</span>
                        {renderSortIcon('slug')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('name')}
                      className="py-3.5 px-4 font-semibold cursor-pointer hover:text-slate-200 select-none transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>نام کلینیک</span>
                        {renderSortIcon('name')}
                      </div>
                    </th>
                    <th className="py-3.5 px-4 font-semibold">مالک / مدیر</th>
                    <th
                      onClick={() => handleSort('status')}
                      className="py-3.5 px-4 font-semibold cursor-pointer hover:text-slate-200 select-none transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>وضعیت</span>
                        {renderSortIcon('status')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('createdAt')}
                      className="py-3.5 px-4 font-semibold cursor-pointer hover:text-slate-200 select-none transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>تاریخ ساخت</span>
                        {renderSortIcon('createdAt')}
                      </div>
                    </th>
                    <th className="py-3.5 px-4 font-semibold text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {clinics.map((clinic) => (
                    <tr key={clinic.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-800/80 text-teal-300 border border-slate-700/60 font-semibold">
                          {clinic.slug}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-100">{clinic.name}</div>
                        {clinic.phone && (
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono" dir="ltr">{clinic.phone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {clinic.owner ? (
                          <div>
                            <div className="text-slate-200 font-medium">{clinic.owner.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono" dir="ltr">
                              {clinic.owner.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {clinic.status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>فعال</span>
                          </span>
                        )}
                        {clinic.status === 'suspended' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>معلق</span>
                          </span>
                        )}
                        {clinic.status === 'deleted' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>حذف شده</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {formatIsoToJalali(clinic.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/platform/clinics/${clinic.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors shadow-sm"
                            title="مشاهده جزئیات کامل و اشتراک"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-400" />
                            <span>جزئیات</span>
                          </button>
                          <button
                            onClick={() =>
                              setStatusModalTarget({
                                clinic,
                                targetStatus: clinic.status === 'active' ? 'suspended' : 'active',
                              })
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shadow-sm ${
                              clinic.status === 'active'
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {clinic.status === 'active' ? (
                              <>
                                <PauseCircle className="w-3.5 h-3.5" />
                                <span>تعلیق</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>فعال‌سازی</span>
                              </>
                            )}
                          </button>
                          {clinic.status === 'deleted' && (
                            <button
                              onClick={() => setHardDeleteTarget(clinic)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors shadow-sm"
                              title="حذف قطعی و دائمی از دیتابیس"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>حذف دائم</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {clinics.map((clinic) => (
              <div
                key={clinic.id}
                className="p-4 bg-slate-900/70 border border-slate-800/80 rounded-2xl space-y-3 text-xs shadow-xl shadow-black/20 backdrop-blur-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-100">{clinic.name}</h3>
                    <div className="font-mono text-teal-300 text-[11px] mt-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 inline-block">{clinic.slug}</div>
                  </div>
                  <div>
                    {clinic.status === 'active' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>فعال</span>
                      </span>
                    )}
                    {clinic.status === 'suspended' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>معلق</span>
                      </span>
                    )}
                    {clinic.status === 'deleted' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>حذف شده</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-400 pt-2 border-t border-slate-800">
                  <div>
                    <span className="block text-[10px] text-slate-500">مالک کلینیک</span>
                    <span className="text-slate-300 font-medium">{clinic.owner?.name || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">تاریخ ثبت</span>
                    <span className="text-slate-300 font-mono text-[11px]">{formatIsoToJalali(clinic.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => navigate(`/platform/clinics/${clinic.id}`)}
                    className="flex-1 py-1.5 rounded-xl text-center font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors inline-flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                    <span>جزئیات</span>
                  </button>
                  <button
                    onClick={() =>
                      setStatusModalTarget({
                        clinic,
                        targetStatus: clinic.status === 'active' ? 'suspended' : 'active',
                      })
                    }
                    className={`flex-1 py-1.5 rounded-xl text-center font-medium border transition-colors inline-flex items-center justify-center gap-1 ${
                      clinic.status === 'active'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    <span>{clinic.status === 'active' ? 'تعلیق' : 'فعال‌سازی'}</span>
                  </button>
                  {clinic.status === 'deleted' && (
                    <button
                      onClick={() => setHardDeleteTarget(clinic)}
                      className="py-1.5 px-3 rounded-xl font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 pt-2">
            <div>
              صفحه{' '}
              <span className="text-slate-100 font-bold font-mono">
                {toPersianDigits(page)}
              </span>{' '}
              از{' '}
              <span className="text-slate-100 font-bold font-mono">
                {toPersianDigits(totalPages)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>قبلی</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const hasGap = prev && p - prev > 1;
                    return (
                      <React.Fragment key={p}>
                        {hasGap && <span className="px-1 text-slate-600">...</span>}
                        <button
                          onClick={() => setPage(p)}
                          className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                            p === page
                              ? 'bg-teal-600 text-white shadow-sm shadow-teal-900/40'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {toPersianDigits(p)}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1"
              >
                <span>بعدی</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Clinic Modal */}
      <CreateClinicModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(_created) => {
          showToast('کلینیک جدید و حساب مالک با موفقیت ساخته شد.');
        }}
      />

      {/* Status Transition Modal */}
      <StatusTransitionModal
        clinic={statusModalTarget?.clinic || null}
        targetStatus={statusModalTarget?.targetStatus || null}
        onClose={() => setStatusModalTarget(null)}
        onSuccess={(_message) => {
          showToast('وضعیت کلینیک با موفقیت به‌روزرسانی شد.');
        }}
      />

      {/* Hard Delete Modal */}
      <HardDeleteClinicModal
        clinic={hardDeleteTarget}
        onClose={() => setHardDeleteTarget(null)}
        onSuccess={(_message) => {
          showToast('کلینیک به صورت دائمی از پایگاه داده حذف گردید.');
        }}
      />
    </div>
  );
};
