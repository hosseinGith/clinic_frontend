import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Calendar,
  CalendarOff,
  CheckCircle2,
  AlertCircle,
  Building2,
  Stethoscope,
  Filter,
  Lock,
  Unlock,
  Info,
  CalendarDays,
} from 'lucide-react';
import {
  useClinicHolidays,
  useClinicDoctors,
  useCreateClinicHoliday,
  useDeleteClinicHoliday,
} from '../hooks/usePlatformClinics';
import { formatIsoToJalali, formatIsoToJalaliFull } from '../../../lib/jalali';
import { toPersianDigits } from '../../../lib/format';

interface ClinicHolidaysTabProps {
  clinicId: string;
  clinicName: string;
}

// Stagger animation container
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2 },
  },
};

export const ClinicHolidaysTab: React.FC<ClinicHolidaysTabProps> = ({ clinicId, clinicName }) => {
  const [filterDoctorId, setFilterDoctorId] = useState<string>('');
  const { data: holidays = [], isLoading, isError, refetch } = useClinicHolidays(
    clinicId,
    filterDoctorId || undefined,
  );
  const { data: doctors = [] } = useClinicDoctors(clinicId);

  const createMutation = useCreateClinicHoliday();
  const deleteMutation = useDeleteClinicHoliday();

  // Form state
  const todayIso = new Date().toISOString().split('T')[0];
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all'); // 'all' or doctorId
  const [date, setDate] = useState<string>(todayIso);
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setFormError('لطفاً تاریخ مورد نظر را انتخاب فرمایید.');
      triggerShake();
      return;
    }
    setFormError(null);

    try {
      await createMutation.mutateAsync({
        clinicId,
        payload: {
          doctorId: selectedDoctorId === 'all' ? null : selectedDoctorId,
          date,
          reason: reason.trim() || (selectedDoctorId === 'all' ? 'تعطیل عمومی کلینیک' : 'مرخصی پزشک'),
        },
      });

      showToast('روز مسدود / تعطیل با موفقیت در تقویم ثبت گردید.');
      setReason('');
      refetch();
    } catch (err: any) {
      setFormError(err?.message || 'خطا در ثبت روز مسدود/تعطیل');
      triggerShake();
    }
  };

  const handleUnblock = async (holidayId: string, label: string) => {
    if (!window.confirm(`آیا از رفع مسدودی تاریخ «${label}» اطمینان دارید؟`)) return;
    try {
      await deleteMutation.mutateAsync({ clinicId, holidayId });
      showToast('روز مورد نظر با موفقیت رفع مسدودی گردید و نوبت‌دهی مجدداً فعال شد.');
      refetch();
    } catch (err: any) {
      alert(err?.message || 'خطا در رفع مسدودی');
    }
  };

  const getDoctorName = (docId?: string | null) => {
    if (!docId) return null;
    const doc = doctors.find((d) => d.id === docId);
    return doc ? doc.name : 'پزشک';
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs shadow-lg shadow-emerald-500/5 backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Create Blocked Day Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-0 left-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800/80 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-sm">
              <CalendarOff className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                ثبت تعطیلی کلینیک یا مرخصی پزشک (روزهای مسدود)
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                  {clinicName}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                در این تاریخ‌ها درگاه نوبت‌دهی عمومی و اسلات‌های ویزیت برای مراجعین مسدود می‌شود.
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {formError && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Target Select */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                مشمول تعطیلی / مرخصی
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/70 transition-all text-xs"
              >
                <option value="all">🏢 کل کلینیک (تعطیلی عمومی و فراگیر)</option>
                {doctors.length > 0 && (
                  <optgroup label="مرخصی مختص پزشک خاص">
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        👨‍⚕️ {doc.name} — {doc.specialty}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Date Input with Live Shamsi Badge */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-teal-400" />
                تاریخ مسدودی
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/70 transition-all text-xs"
              />
              {date && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400">معادل شمسی:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono text-[11px] font-medium">
                    {formatIsoToJalaliFull(date)}
                  </span>
                </div>
              )}
            </div>

            {/* Reason Input */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-teal-400" />
                علت مسدودی / توضیحات
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="مثال: تعطیل رسمی، تعمیرات بالینی، همایش پزشک..."
                className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/70 transition-all text-xs"
              />
            </div>
          </div>

          {/* Action Row with Spring Gesture & Shake on Error */}
          <div className="pt-2 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              animate={isShaking ? { x: [-4, 4, -4, 4, 0] } : undefined}
              transition={{ duration: 0.35 }}
              type="submit"
              disabled={createMutation.isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-sm transition-colors hover:border-rose-500/60 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              {createMutation.isPending ? 'در حال ثبت...' : 'مسدود کردن این روز'}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Blocked Days List Section */}
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200">
                لیست روزهای مسدود و تعطیلات تقویم
              </h3>
              <span className="text-[11px] text-slate-400">
                مجموع: {toPersianDigits(holidays.length)} روز ثبت‌شده
              </span>
            </div>
          </div>

          {/* Filter by Doctor */}
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">فیلتر:</span>
            <select
              value={filterDoctorId}
              onChange={(e) => setFilterDoctorId(e.target.value)}
              className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500 text-xs"
            >
              <option value="">همه موارد (کلینیک و تمام پزشکان)</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  مرخصی‌های {doc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="p-12 text-center rounded-2xl border border-slate-800/80 bg-slate-900/40">
            <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">در حال دریافت لیست روزهای مسدود...</p>
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-xs text-rose-300 bg-rose-500/10 rounded-2xl border border-rose-500/25">
            خطا در دریافت لیست روزهای مسدود کلینیک. لطفاً اتصال را بررسی نمایید.
          </div>
        ) : holidays.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 text-center rounded-2xl border border-dashed border-slate-800/90 bg-slate-900/30 backdrop-blur-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Calendar className="w-6 h-6 text-slate-500" strokeWidth={1.5} />
            </div>
            <h4 className="text-xs font-bold text-slate-300 mb-1">هیچ روز مسدود یا تعطیلی ثبت نشده است</h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              تمامی روزهای کاری طبق شیفت پزشکان برای رزرو مراجعین باز و در دسترس می‌باشد.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Desktop Table View with Stagger Animation */}
            <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl shadow-xl shadow-black/20">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800/80">
                  <tr>
                    <th className="py-3 px-4 font-semibold">تاریخ شمسی</th>
                    <th className="py-3 px-4 font-semibold">تاریخ میلادی</th>
                    <th className="py-3 px-4 font-semibold">مشمول مسدودی</th>
                    <th className="py-3 px-4 font-semibold">علت / شرح</th>
                    <th className="py-3 px-4 font-semibold text-left">عملیات</th>
                  </tr>
                </thead>
                <motion.tbody
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-slate-800/60 text-slate-200"
                >
                  <AnimatePresence>
                    {holidays.map((hol) => {
                      const docName = getDoctorName(hol.doctorId);
                      const isClinicWide = !hol.doctorId;
                      return (
                        <motion.tr
                          key={hol.id}
                          variants={rowVariants}
                          exit="exit"
                          layout
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-100 font-mono">
                            {formatIsoToJalaliFull(hol.date)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                            {hol.date}
                          </td>
                          <td className="py-3.5 px-4">
                            {isClinicWide ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                                <Building2 className="w-3 h-3 text-rose-400" />
                                کل کلینیک (تعطیل عمومی)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                <Stethoscope className="w-3 h-3 text-amber-400" />
                                مرخصی: {docName || 'پزشک'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {hol.reason || (isClinicWide ? 'تعطیل عمومی' : 'مرخصی')}
                          </td>
                          <td className="py-3.5 px-4 text-left">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                handleUnblock(
                                  hol.id,
                                  `${formatIsoToJalali(hol.date)} (${isClinicWide ? 'کلینیک' : docName})`,
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 text-slate-300 rounded-lg text-xs transition-colors border border-slate-700/60"
                              title="رفع مسدودی و بازگشایی نوبت‌دهی"
                            >
                              <Unlock className="w-3 h-3" />
                              رفع مسدودی
                            </motion.button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </motion.tbody>
              </table>
            </div>

            {/* Mobile Card-View with Staggered Motion */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="sm:hidden space-y-2.5"
            >
              <AnimatePresence>
                {holidays.map((hol) => {
                  const docName = getDoctorName(hol.doctorId);
                  const isClinicWide = !hol.doctorId;
                  return (
                    <motion.div
                      key={hol.id}
                      variants={rowVariants}
                      exit="exit"
                      layout
                      className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-2.5 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100 font-mono">
                          {formatIsoToJalaliFull(hol.date)}
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">{hol.date}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        {isClinicWide ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                            <Building2 className="w-3 h-3" />
                            کل کلینیک
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            <Stethoscope className="w-3 h-3" />
                            {docName || 'پزشک'}
                          </span>
                        )}
                        <span className="text-slate-400 truncate max-w-[55%]">
                          {hol.reason || (isClinicWide ? 'تعطیل عمومی' : 'مرخصی')}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex justify-end">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            handleUnblock(
                              hol.id,
                              `${formatIsoToJalali(hol.date)} (${isClinicWide ? 'کلینیک' : docName})`,
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 rounded-lg text-xs transition-colors border border-slate-700/60"
                        >
                          <Unlock className="w-3 h-3" />
                          رفع مسدودی
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};
