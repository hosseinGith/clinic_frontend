import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  Plus,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Calendar,
  Save,
} from 'lucide-react';
import {
  useClinicDoctors,
  useCreateClinicDoctor,
  useUpdateClinicDoctor,
  useDeleteClinicDoctor,
} from '../hooks/usePlatformClinics';
import type { Doctor, WorkDaySchedule } from '../../../domain/doctor';
import { toPersianDigits } from '../../../lib/format';

interface ClinicDoctorsTabProps {
  clinicId: string;
  clinicName: string;
}

const DAYS_OF_WEEK = [
  { dayOfWeek: 6, label: 'شنبه' },
  { dayOfWeek: 0, label: 'یکشنبه' },
  { dayOfWeek: 1, label: 'دوشنبه' },
  { dayOfWeek: 2, label: 'سه‌شنبه' },
  { dayOfWeek: 3, label: 'چهارشنبه' },
  { dayOfWeek: 4, label: 'پنج‌شنبه' },
  { dayOfWeek: 5, label: 'جمعه' },
];

const DEFAULT_SCHEDULE: WorkDaySchedule[] = [
  { dayOfWeek: 6, isActive: true, startHour: 9, endHour: 18, breakStartHour: 13, breakEndHour: 14 },
  { dayOfWeek: 0, isActive: true, startHour: 9, endHour: 18, breakStartHour: 13, breakEndHour: 14 },
  { dayOfWeek: 1, isActive: true, startHour: 9, endHour: 18, breakStartHour: 13, breakEndHour: 14 },
  { dayOfWeek: 2, isActive: true, startHour: 9, endHour: 18, breakStartHour: 13, breakEndHour: 14 },
  { dayOfWeek: 3, isActive: true, startHour: 9, endHour: 18, breakStartHour: 13, breakEndHour: 14 },
  { dayOfWeek: 4, isActive: true, startHour: 9, endHour: 14, breakStartHour: null, breakEndHour: null },
  { dayOfWeek: 5, isActive: false, startHour: 9, endHour: 14, breakStartHour: null, breakEndHour: null },
];

export const ClinicDoctorsTab: React.FC<ClinicDoctorsTabProps> = ({ clinicId }) => {
  const { data: doctors = [], isLoading, isError, refetch } = useClinicDoctors(clinicId);
  const createMutation = useCreateClinicDoctor();
  const updateMutation = useUpdateClinicDoctor();
  const deleteMutation = useDeleteClinicDoctor();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [slotInterval, setSlotInterval] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [schedule, setSchedule] = useState<WorkDaySchedule[]>(DEFAULT_SCHEDULE);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openCreateModal = () => {
    setEditingDoctor(null);
    setName('');
    setSpecialty('');
    setSlotInterval(30);
    setIsActive(true);
    setSchedule(JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)));
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    setName(doc.name);
    setSpecialty(doc.specialty);
    setSlotInterval(doc.slotIntervalMinutes || 30);
    setIsActive(doc.isActive);

    if (doc.weeklySchedule && doc.weeklySchedule.length > 0) {
      // Ensure all 7 days are represented
      const full = DAYS_OF_WEEK.map((d) => {
        const found = doc.weeklySchedule?.find((s) => s.dayOfWeek === d.dayOfWeek);
        if (found) return found;
        return {
          dayOfWeek: d.dayOfWeek,
          isActive: false,
          startHour: 9,
          endHour: 18,
          breakStartHour: null,
          breakEndHour: null,
        };
      });
      setSchedule(full);
    } else {
      setSchedule(JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)));
    }

    setFormError(null);
    setModalOpen(true);
  };

  const handleDayChange = (dayOfWeek: number, field: keyof WorkDaySchedule, value: any) => {
    setSchedule((prev) =>
      prev.map((item) => (item.dayOfWeek === dayOfWeek ? { ...item, [field]: value } : item)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('نام پزشک را وارد نمایید.');
      return;
    }
    setFormError(null);

    try {
      const payload: Partial<Doctor> = {
        name: name.trim(),
        specialty: specialty.trim() || 'پزشک عمومی',
        slotIntervalMinutes: Number(slotInterval) || 30,
        isActive,
        weeklySchedule: schedule,
      };

      if (editingDoctor) {
        await updateMutation.mutateAsync({
          clinicId,
          doctorId: editingDoctor.id,
          payload,
        });
        showToast('اطلاعات و شیفت‌های پزشک با موفقیت به‌روزرسانی شد.');
      } else {
        await createMutation.mutateAsync({
          clinicId,
          payload,
        });
        showToast('پزشک جدید با موفقیت به کلینیک افزوده شد.');
      }

      setModalOpen(false);
      refetch();
    } catch (err: any) {
      setFormError(err?.message || 'خطا در ثبت اطلاعات پزشک');
    }
  };

  const handleDelete = async (doc: Doctor) => {
    if (!window.confirm(`آیا از حذف پزشک «${doc.name}» اطمینان دارید؟`)) return;
    try {
      await deleteMutation.mutateAsync({ clinicId, doctorId: doc.id });
      showToast(`پزشک ${doc.name} با موفقیت حذف گردید.`);
      refetch();
    } catch (err: any) {
      alert(err?.message || 'خطا در حذف پزشک');
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-400" />
            لیست پزشکان و برنامه شیفت‌های کاری هفتگی
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تعریف پزشکان، ساعات کاری روزانه و شیفت‌های فعال کلینیک برای نوبت‌دهی آنلاین
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-lg shadow-teal-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          افزودن پزشک جدید
        </button>
      </div>

      {/* Doctors List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">در حال دریافت لیست پزشکان...</div>
      ) : isError ? (
        <div className="p-6 text-center text-xs text-rose-400 bg-rose-500/10 rounded-2xl border border-rose-500/20">
          خطا در دریافت لیست پزشکان.
        </div>
      ) : doctors.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <Stethoscope className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">هنوز هیچ پزشکی برای این کلینیک تعریف نشده است.</p>
          <button
            onClick={openCreateModal}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg text-xs"
          >
            <Plus className="w-3 h-3" />
            افزودن اولین پزشک
          </button>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <AnimatePresence>
            {doctors.map((doc) => {
              return (
                <motion.div
                  key={doc.id}
                  layout
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
                  }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold text-sm">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-100">{doc.name}</h3>
                          <p className="text-xs text-teal-400 font-medium">{doc.specialty}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          doc.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {doc.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>

                    {/* Shift Days Badge Preview */}
                    <div className="space-y-2 mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          طول هر نوبت:
                        </span>
                        <span className="font-mono text-slate-200">
                          {toPersianDigits(doc.slotIntervalMinutes || 30)} دقیقه
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60">
                        <div className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          روزهای کاری شیفت:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {DAYS_OF_WEEK.map((d) => {
                            const sched = doc.weeklySchedule?.find((s) => s.dayOfWeek === d.dayOfWeek);
                            const isDayActive = sched?.isActive;
                            return (
                              <span
                                key={d.dayOfWeek}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                                  isDayActive
                                    ? 'bg-teal-500/10 text-teal-300 border-teal-500/20'
                                    : 'bg-slate-900 text-slate-600 border-slate-800/60'
                                }`}
                              >
                                {d.label}
                                {isDayActive && sched && (
                                  <span className="mr-1 text-[9px] text-slate-400 font-mono">
                                    ({toPersianDigits(sched.startHour)}-{toPersianDigits(sched.endHour)})
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/50">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => openEditModal(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-teal-400" />
                      ویرایش شیفت و اطلاعات
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(doc)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs transition-colors"
                      title="حذف پزشک"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Doctor Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', duration: 0.4 } }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-200 my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-400" />
                  {editingDoctor ? `ویرایش پزشک: ${editingDoctor.name}` : 'افزودن پزشک جدید'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">نام پزشک</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: دکتر مهدی حسینی"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">تخصص</label>
                  <input
                    type="text"
                    required
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="مثال: متخصص پوست و زیبایی"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    مدت زمان هر نوبت (دقیقه)
                  </label>
                  <select
                    value={slotInterval}
                    onChange={(e) => setSlotInterval(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value={15}>15 دقیقه</option>
                    <option value={20}>20 دقیقه</option>
                    <option value={30}>30 دقیقه</option>
                    <option value={45}>45 دقیقه</option>
                    <option value={60}>60 دقیقه (1 ساعت)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                  </label>
                  <span className="text-xs text-slate-300">پزشک فعال و آماده نوبت‌دهی</span>
                </div>
              </div>

              {/* Weekly Shifts Schedule */}
              <div className="pt-4 border-t border-slate-800">
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-slate-200">برنامه شیفت کاری هفتگی</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    روزهای کاری هفته و ساعت شروع، پایان و استراحت را تنظیم فرمایید.
                  </p>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {DAYS_OF_WEEK.map((d) => {
                    const sched =
                      schedule.find((s) => s.dayOfWeek === d.dayOfWeek) || {
                        dayOfWeek: d.dayOfWeek,
                        isActive: false,
                        startHour: 9,
                        endHour: 18,
                        breakStartHour: null,
                        breakEndHour: null,
                      };

                    return (
                      <div
                        key={d.dayOfWeek}
                        className={`p-3 rounded-xl border transition-all text-xs flex flex-wrap items-center justify-between gap-3 ${
                          sched.isActive
                            ? 'bg-slate-950/80 border-slate-800'
                            : 'bg-slate-950/30 border-slate-900 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 w-28">
                          <input
                            type="checkbox"
                            id={`day-${d.dayOfWeek}`}
                            checked={sched.isActive}
                            onChange={(e) =>
                              handleDayChange(d.dayOfWeek, 'isActive', e.target.checked)
                            }
                            className="rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-0"
                          />
                          <label
                            htmlFor={`day-${d.dayOfWeek}`}
                            className="font-bold text-slate-200 cursor-pointer"
                          >
                            {d.label}
                          </label>
                        </div>

                        {sched.isActive ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 text-[11px]">ساعت کاری:</span>
                              <input
                                type="number"
                                min={6}
                                max={23}
                                value={sched.startHour}
                                onChange={(e) =>
                                  handleDayChange(d.dayOfWeek, 'startHour', Number(e.target.value))
                                }
                                className="w-14 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-center text-xs text-slate-100 font-mono"
                              />
                              <span className="text-slate-500">تا</span>
                              <input
                                type="number"
                                min={6}
                                max={24}
                                value={sched.endHour}
                                onChange={(e) =>
                                  handleDayChange(d.dayOfWeek, 'endHour', Number(e.target.value))
                                }
                                className="w-14 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-center text-xs text-slate-100 font-mono"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 text-[11px]">استراحت:</span>
                              <input
                                type="number"
                                min={6}
                                max={23}
                                placeholder="شروع"
                                value={sched.breakStartHour ?? ''}
                                onChange={(e) =>
                                  handleDayChange(
                                    d.dayOfWeek,
                                    'breakStartHour',
                                    e.target.value ? Number(e.target.value) : null,
                                  )
                                }
                                className="w-14 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-center text-xs text-slate-100 font-mono placeholder:text-slate-600"
                              />
                              <span className="text-slate-500">تا</span>
                              <input
                                type="number"
                                min={6}
                                max={24}
                                placeholder="پایان"
                                value={sched.breakEndHour ?? ''}
                                onChange={(e) =>
                                  handleDayChange(
                                    d.dayOfWeek,
                                    'breakEndHour',
                                    e.target.value ? Number(e.target.value) : null,
                                  )
                                }
                                className="w-14 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-center text-xs text-slate-100 font-mono placeholder:text-slate-600"
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">تعطیل / بدون شیفت</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                >
                  انصراف
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {createMutation.isPending || updateMutation.isPending ? 'در حال ذخیره...' : 'ذخیره پزشک'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
  );
};
