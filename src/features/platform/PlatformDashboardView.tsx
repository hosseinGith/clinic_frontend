import React from 'react';
import { Link } from 'react-router-dom';
import { useClinicsSummary } from './hooks/usePlatformClinics';
import { toPersianDigits } from '../../lib/format';
import { formatIsoToJalali } from '../../lib/jalali';
import {
  Building2,
  CheckCircle2,
  PauseCircle,
  Trash2,
  CalendarPlus,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
  RotateCw,
} from 'lucide-react';

export const PlatformDashboardView: React.FC = () => {
  const { data: summary, isLoading, isError, refetch } = useClinicsSummary();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>فعال</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>معلق</span>
          </span>
        );
      case 'deleted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>حذف‌شده</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-9 h-9 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">در حال دریافت شاخص‌های عملکردی پلتفرم...</p>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between shadow-lg">
        <div className="text-sm font-medium">خطا در بارگذاری خلاصه اطلاعات پلتفرم.</div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-medium transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>تلاش مجدد</span>
        </button>
      </div>
    );
  }

  const kpis = [
    {
      label: 'کل کلینیک‌ها',
      count: summary.total,
      color: 'text-slate-100',
      iconBox: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
      icon: Building2,
    },
    {
      label: 'کلینیک‌های فعال',
      count: summary.active,
      color: 'text-emerald-400',
      iconBox: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      icon: CheckCircle2,
    },
    {
      label: 'کلینیک‌های معلق',
      count: summary.suspended,
      color: 'text-amber-400',
      iconBox: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      icon: PauseCircle,
    },
    {
      label: 'کلینیک‌های حذف‌شده',
      count: summary.deleted,
      color: 'text-rose-400',
      iconBox: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
      icon: Trash2,
    },
    {
      label: 'ثبت در 30 روز اخیر',
      count: summary.createdLast30Days,
      color: 'text-teal-400',
      iconBox: 'bg-teal-500/10 text-teal-400 border-teal-500/25',
      icon: CalendarPlus,
    },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">داشبورد مرکزی سوپرادمین</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">نمای شاخص‌های کلیدی و 5 کلینیک اخیر ثبت‌شده در پلتفرم MedFlow</p>
        </div>

        <Link
          to="/platform/clinics"
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition-all duration-150 shadow-lg shadow-teal-900/30 hover:shadow-teal-900/50 flex items-center gap-2 group"
        >
          <span>مشاهده و مدیریت کلینیک‌ها</span>
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/70 shadow-xl shadow-black/20 backdrop-blur-xl flex flex-col justify-between hover:border-slate-700/80 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-medium">{kpi.label}</span>
                <span className={`p-2 rounded-xl border ${kpi.iconBox} shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                </span>
              </div>
              <div className={`text-2xl font-bold font-mono tracking-tight ${kpi.color}`}>
                {toPersianDigits(kpi.count)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Latest Clinics List */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Sparkles className="w-4 h-4" strokeWidth={1.75} />
            </span>
            <h2 className="text-sm font-bold text-slate-100">5 کلینیک اخیر ایجاد شده در سامانه</h2>
          </div>
          <Link
            to="/platform/clinics"
            className="text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1 group"
          >
            <span>مشاهده همه</span>
            <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          </Link>
        </div>

        {summary.latest.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            هنوز کلینیکی ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800/80 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">شناسه انگلیسی (slug)</th>
                  <th className="py-3 px-4 font-semibold">نام کلینیک</th>
                  <th className="py-3 px-4 font-semibold">تاریخ ایجاد</th>
                  <th className="py-3 px-4 font-semibold">وضعیت</th>
                  <th className="py-3 px-4 font-semibold text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {summary.latest.map((clinic) => (
                  <tr key={clinic.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-800/80 text-teal-300 border border-slate-700/60">
                        {clinic.slug}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-100">
                      {clinic.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatIsoToJalali(clinic.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(clinic.status)}
                    </td>
                    <td className="py-3.5 px-4 text-left">
                      <Link
                        to={`/platform/clinics/${clinic.id}`}
                        className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 text-xs font-medium hover:underline"
                      >
                        <span>جزئیات</span>
                        <ChevronLeft className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

