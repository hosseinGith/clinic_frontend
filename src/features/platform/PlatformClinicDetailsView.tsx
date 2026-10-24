import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Stethoscope,
  Layers,
  Users,
  CalendarCheck,
  UserCheck,
  Phone,
  Clock,
  MapPin,
  Lock,
  Save,
  CheckCircle2,
  X,
  CreditCard,
  FileEdit,
  LayoutDashboard,
  AlertCircle,
  RotateCw,
  CalendarOff,
  type LucideIcon,
} from 'lucide-react';
import { usePlatformClinicDetails, useUpdateClinic } from './hooks/usePlatformClinics';
import { ClinicBillingTab } from './components/ClinicBillingTab';
import { ClinicDoctorsTab } from './components/ClinicDoctorsTab';
import { ClinicServicesTab } from './components/ClinicServicesTab';
import { ClinicHolidaysTab } from './components/ClinicHolidaysTab';
import { toPersianDigits } from '../../lib/format';
import { formatIsoToJalali } from '../../lib/jalali';

type TabType = 'summary' | 'doctors' | 'services' | 'holidays' | 'billing' | 'edit';

interface TabItem {
  id: TabType;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

const tabContentVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -24 : 24,
    y: 4,
  }),
  center: {
    opacity: 1,
    x: 0,
    y: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 24 : -24,
    y: -4,
  }),
};

export const PlatformClinicDetailsView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: clinic, isLoading, isError, refetch } = usePlatformClinicDetails(id);
  const updateMutation = useUpdateClinic();

  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [direction, setDirection] = useState<number>(1); // 1 = forward (left-to-right), -1 = backward
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Edit form state
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Synchronize edit fields when clinic data loads
  if (clinic && !isFormInitialized) {
    setName(clinic.name || '');
    setTagline(clinic.tagline || '');
    setPhone(clinic.phone || '');
    setAddress(clinic.address || '');
    setWorkingHours(clinic.workingHours || '');
    setIsFormInitialized(true);
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic) return;
    setEditError(null);

    try {
      await updateMutation.mutateAsync({
        id: clinic.id,
        payload: {
          name: name.trim(),
          tagline: tagline.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          workingHours: workingHours.trim() || undefined,
        },
      });

      setSuccessToast('اطلاعات کلینیک با موفقیت به‌روزرسانی شد.');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setEditError(err?.message || 'خطا در ویرایش اطلاعات کلینیک.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm shadow-emerald-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            فعال
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            معلق
          </span>
        );
      case 'deleted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/25 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            حذف‌شده
          </span>
        );
      default:
        return null;
    }
  };

  const tabs: TabItem[] = [
    { id: 'summary', label: 'خلاصه و آمار', icon: LayoutDashboard },
    { id: 'doctors', label: 'پزشکان و شیفت‌ها', icon: Stethoscope, badge: clinic?.counts?.doctors },
    { id: 'services', label: 'خدمات', icon: Layers, badge: clinic?.counts?.services },
    { id: 'holidays', label: 'تقویم و روزهای تعطیل', icon: CalendarOff },
    { id: 'billing', label: 'اشتراک و مالی', icon: CreditCard },
    { id: 'edit', label: 'ویرایش مشخصات', icon: FileEdit },
  ];

  const switchTab = (targetId: TabType) => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    const targetIndex = tabs.findIndex((t) => t.id === targetId);
    if (currentIndex !== targetIndex) {
      setDirection(targetIndex > currentIndex ? 1 : -1);
      setActiveTab(targetId);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">در حال بارگذاری اطلاعات کلینیک...</p>
      </div>
    );
  }

  if (isError || !clinic) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" strokeWidth={1.75} />
          <span className="text-sm">کلینیک مورد نظر یافت نشد یا خطایی در دریافت اطلاعات رخ داده است.</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-xs text-rose-200 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" strokeWidth={1.75} />
            تلاش مجدد
          </button>
          <Link
            to="/platform/clinics"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            بازگشت به لیست
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification with AnimatePresence */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center justify-between shadow-xl shadow-teal-500/5 backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" strokeWidth={1.75} />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header with Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/20"
      >
        <div className="absolute top-0 right-0 w-80 h-40 bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link to="/platform/clinics" className="hover:text-teal-400 transition-colors flex items-center gap-1">
                <span>کلینیک‌ها</span>
              </Link>
              <span className="text-slate-600">/</span>
              <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-slate-800/90 text-teal-300 border border-slate-700/60 shadow-inner">
                {clinic.slug}
              </span>
            </div>

            {/* Title & Badge */}
            <div className="flex items-center flex-wrap gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/25 shadow-sm shadow-teal-500/10">
                <Building2 className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
                    {clinic.name}
                  </h1>
                  {getStatusBadge(clinic.status)}
                </div>
                {clinic.tagline && (
                  <p className="text-xs text-slate-400 mt-0.5 max-w-xl">{clinic.tagline}</p>
                )}
              </div>
            </div>
          </div>

          {/* Back Action Button with Spring Gesture */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/platform/clinics"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-700/70 rounded-xl text-xs font-medium transition-all shadow-sm hover:border-slate-600 shrink-0"
            >
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              بازگشت به لیست کلینیک‌ها
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Navigation Tabs - Shared Layout Animation with Fluid Active Pill */}
      <div className="relative border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-1 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 relative ${
                  isActive ? 'text-teal-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Fluid Pill Behind Active Tab */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 rounded-xl bg-teal-500/15 border border-teal-500/35 shadow-sm shadow-teal-500/10"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <span className="relative z-10 flex items-center gap-2">
                  <Icon
                    className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`}
                    strokeWidth={1.75}
                  />
                  <span>{tab.label}</span>
                  {typeof tab.badge === 'number' && (
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? 'bg-teal-400/25 text-teal-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {toPersianDigits(tab.badge)}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Tab Content with Directional Bi-Directional Slide & Fade */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={activeTab}
          custom={direction}
          variants={tabContentVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {/* Tab: Summary */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-xl shadow-black/20 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-slate-400 font-medium">پزشکان</span>
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      <Stethoscope className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                  </div>
                  <span className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                    {toPersianDigits(clinic.counts.doctors)}
                  </span>
                </div>

                <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-xl shadow-black/20 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-slate-400 font-medium">خدمات تعریف‌شده</span>
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      <Layers className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                  </div>
                  <span className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                    {toPersianDigits(clinic.counts.services)}
                  </span>
                </div>

                <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-xl shadow-black/20 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-slate-400 font-medium">مراجعان ثبت‌شده</span>
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      <Users className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                  </div>
                  <span className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                    {toPersianDigits(clinic.counts.clients)}
                  </span>
                </div>

                <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-xl shadow-black/20 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-slate-400 font-medium">کل نوبت‌ها</span>
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      <CalendarCheck className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                  </div>
                  <span className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                    {toPersianDigits(clinic.counts.appointments)}
                  </span>
                </div>

                <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-xl shadow-black/20 backdrop-blur-xl col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-slate-400 font-medium">کاربران پرسنل</span>
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      <UserCheck className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                  </div>
                  <span className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                    {toPersianDigits(clinic.counts.users)}
                  </span>
                </div>
              </div>

              {/* Details Card */}
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs backdrop-blur-xl shadow-xl shadow-black/20">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-800/80 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-400" strokeWidth={1.75} />
                    مشخصات عمومی کلینیک
                  </h3>
                  <dl className="space-y-3.5 text-slate-300">
                    <div className="flex justify-between items-center py-1">
                      <dt className="text-slate-400">شناسه انگلیسی (slug):</dt>
                      <dd className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700/60">
                        {clinic.slug}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-slate-800/60">
                      <dt className="text-slate-400">عنوان فرعی:</dt>
                      <dd className="font-medium text-slate-200">{clinic.tagline || '-'}</dd>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-slate-800/60">
                      <dt className="text-slate-400">شماره تماس:</dt>
                      <dd className="font-mono text-slate-200 flex items-center gap-1.5" dir="ltr">
                        <Phone className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                        {clinic.phone || '-'}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-slate-800/60">
                      <dt className="text-slate-400">ساعات کاری:</dt>
                      <dd className="text-slate-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                        {clinic.workingHours || '-'}
                      </dd>
                    </div>
                    <div className="flex justify-between items-start py-1 border-t border-slate-800/60">
                      <dt className="text-slate-400 shrink-0">آدرس:</dt>
                      <dd className="text-slate-200 max-w-[65%] text-left flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" strokeWidth={1.75} />
                        <span>{clinic.address || '-'}</span>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-800/80 flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-400" strokeWidth={1.75} />
                    مدیر کلینیک و رویدادها
                  </h3>
                  <dl className="space-y-3.5 text-slate-300">
                    <div className="flex justify-between items-center py-1">
                      <dt className="text-slate-400">مالک کلینیک (Owner):</dt>
                      <dd className="font-medium text-slate-100">{clinic.owner?.name || '-'}</dd>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-slate-800/60">
                      <dt className="text-slate-400">موبایل مالک:</dt>
                      <dd className="font-mono text-slate-200" dir="ltr">{clinic.owner?.phone || '-'}</dd>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-slate-800/60">
                      <dt className="text-slate-400">تاریخ ساخت کلینیک:</dt>
                      <dd className="text-slate-200 font-mono">{formatIsoToJalali(clinic.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-slate-800/60">
                      <dt className="text-slate-400">آخرین نوبت ثبت‌شده:</dt>
                      <dd className="text-slate-200">
                        {clinic.lastAppointmentAt ? (
                          <span className="font-mono">{formatIsoToJalali(clinic.lastAppointmentAt)}</span>
                        ) : (
                          <span className="text-slate-500">هنوز نوبتی ثبت نشده</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Edit Form */}
          {activeTab === 'edit' && (
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 max-w-2xl backdrop-blur-xl shadow-xl shadow-black/20">
              <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-teal-400" strokeWidth={1.75} />
                ویرایش مشخصات کلینیک
              </h2>

              {editError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" strokeWidth={1.75} />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1.5 font-medium">شناسه انگلیسی (slug)</label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value={clinic.slug}
                      className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-500 font-mono cursor-not-allowed text-xs"
                      dir="ltr"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3" strokeWidth={1.75} />
                  </div>
                  <p className="text-[11px] text-amber-400/80 mt-1.5 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-amber-400" strokeWidth={1.75} />
                    شناسه انگلیسی (اسلاگ) برای جلوگیری از شکستن لینک‌های عمومی رزرو کلینیک تغییرناپذیر است.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1.5 font-medium">نام کلینیک *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1.5 font-medium">شعار / عنوان فرعی</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-300 mb-1.5 font-medium">شماره تماس</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      dir="ltr"
                      className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1.5 font-medium">ساعات کاری</label>
                    <input
                      type="text"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1.5 font-medium">آدرس کلینیک</label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all text-xs resize-none"
                  />
                </div>

                <div className="pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 shadow-lg shadow-teal-600/20"
                  >
                    <Save className="w-4 h-4" strokeWidth={1.75} />
                    {updateMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                  </motion.button>
                </div>
              </form>
            </div>
          )}

          {/* Tab: Doctors & Shifts */}
          {activeTab === 'doctors' && clinic && (
            <ClinicDoctorsTab clinicId={clinic.id} clinicName={clinic.name} />
          )}

          {/* Tab: Services */}
          {activeTab === 'services' && clinic && (
            <ClinicServicesTab clinicId={clinic.id} clinicName={clinic.name} />
          )}

          {/* Tab: Holidays & Blocked Days */}
          {activeTab === 'holidays' && clinic && (
            <ClinicHolidaysTab clinicId={clinic.id} clinicName={clinic.name} />
          )}

          {/* Tab: Billing & Subscription */}
          {activeTab === 'billing' && clinic && (
            <ClinicBillingTab clinicId={clinic.id} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
