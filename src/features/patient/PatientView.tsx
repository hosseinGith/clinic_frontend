import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Phone,
  Search,
  Edit2,
  Check,
  Building,
  LogOut,
  AlertTriangle,
  CalendarPlus,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { Modal } from '../../components/ui/Modal';
import { useAuth, useClinic } from '../../app/contexts';
import { services } from '../../services';
import { queryKeys } from '../../services/queryKeys';
import { STATUS_META, type AppointmentStatus } from '../../domain/appointmentStatus';
import type { Appointment } from '../../domain/appointment';
import { toPersianDigits, formatTimeFa, formatTrackingCodeFa, formatPhoneNumber } from '../../lib/format';

export const PatientView: React.FC = () => {
  const { user, actor, logout, updateProfileName } = useAuth();
  const { clinic, clinicId } = useClinic();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [trackingFilter, setTrackingFilter] = useState('');

  // Cancel Appointment state
  const [aptToCancel, setAptToCancel] = useState<Appointment | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Edit Name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [nameSuccess, setNameSuccess] = useState(false);

  // Fetch patient appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: queryKeys.appointments.myAppointments(clinicId, user?.phone || ''),
    queryFn: () => services.appointmentRepo.getAppointments(clinicId, undefined, actor || undefined),
    enabled: !!actor,
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      services.appointmentRepo.updateStatus(clinicId, appointmentId, 'cancelled', actor || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.myAppointments(clinicId, user?.phone || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all(clinicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary(clinicId) });
      setAptToCancel(null);
      setCancelError(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'خطا در لغو نوبت. لطفاً دوباره تلاش کنید.';
      setCancelError(msg);
    },
  });

  const handleConfirmCancel = () => {
    if (!aptToCancel) return;
    setCancelError(null);
    cancelMutation.mutate(aptToCancel.id);
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !user) return;
    try {
      await updateProfileName(nameInput.trim());
      setIsEditingName(false);
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch {
      // ignore
    }
  };

  const filteredAppointments = React.useMemo(() => {
    if (!trackingFilter.trim()) return appointments;
    const q = trackingFilter.trim().toLowerCase();
    return appointments.filter(
      (apt) => apt.trackingCode.toLowerCase().includes(q) || apt.serviceName.toLowerCase().includes(q)
    );
  }, [appointments, trackingFilter]);

  const upcomingAppointments = React.useMemo(
    () =>
      filteredAppointments.filter(
        (apt) =>
          apt.status === 'pending_confirmation' ||
          apt.status === 'confirmed' ||
          apt.status === 'in_clinic' ||
          apt.status === 'pending_payment'
      ),
    [filteredAppointments]
  );

  const historyAppointments = React.useMemo(
    () =>
      filteredAppointments.filter(
        (apt) => apt.status === 'completed' || apt.status === 'cancelled'
      ),
    [filteredAppointments]
  );

  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : historyAppointments;

  const isCancellable = (status: AppointmentStatus) =>
    status === 'pending_confirmation' || status === 'confirmed' || status === 'pending_payment';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Patient Profile Header */}
      <Card className="p-6 bg-gradient-to-l from-teal-900 to-[#0f766e] text-white rounded-2xl border-none shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-xl font-bold text-teal-100">
              {user?.avatarInitials || 'م'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <form onSubmit={handleUpdateName} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="px-2.5 py-1 text-sm bg-white/20 border border-white/40 rounded text-white focus:outline-none focus:bg-white/30"
                    />
                    <button
                      type="submit"
                      className="p-1 rounded bg-white text-[#0f766e] hover:bg-teal-50"
                      title="ذخیره نام"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <>
                    <h1 className="text-xl font-bold">{user?.name}</h1>
                    <button
                      onClick={() => {
                        setNameInput(user?.name || '');
                        setIsEditingName(true);
                      }}
                      className="p-1 text-teal-200 hover:text-white transition-colors"
                      title="ویرایش نام"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-teal-100/90 mt-1 flex items-center gap-1.5 font-mono" dir="ltr">
                <Phone className="w-3.5 h-3.5" />
                <span>{formatPhoneNumber(user?.phone || '')}</span>
              </p>
              {nameSuccess && (
                <span className="text-[11px] text-emerald-200 mt-1 block">نام شما با موفقیت بروزرسانی شد.</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
            {clinic && (
              <ButtonLink
                to={`/book/${clinic.slug || clinicId}`}
                variant="secondary"
                size="sm"
                className="bg-white text-[#0f766e] hover:bg-teal-50 border-none font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <CalendarPlus className="w-4 h-4 text-teal-600" />
                <span>رزرو نوبت جدید</span>
              </ButtonLink>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج از حساب</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Clinic Info Box */}
      <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-[#0f766e] shrink-0" />
          <span className="font-semibold text-neutral-800">{clinic.name}</span>
          <span>•</span>
          <span>{clinic.address}</span>
        </div>
        <div className="text-neutral-500 font-mono">
          ساعت کاری: {clinic.workingHours}
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'upcoming'
                ? 'bg-white text-[#0f766e] shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
              }`}
          >
            نوبت‌های آینده ({toPersianDigits(upcomingAppointments.length)})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'history'
                ? 'bg-white text-[#0f766e] shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
              }`}
          >
            تاریخچه نوبت‌ها ({toPersianDigits(historyAppointments.length)})
          </button>
        </div>

        {/* Tracking Code Filter */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute inset-y-0 right-3 my-auto text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={trackingFilter}
            onChange={(e) => setTrackingFilter(e.target.value)}
            placeholder="رهگیری با کد یا نام خدمت..."
            className="w-full pr-9 pl-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-[#0f766e] bg-white"
          />
        </div>
      </div>

      {/* Interactive Booking Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50/60 to-white border border-teal-100/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-teal-600" />
            <span>نیاز به دریافت خدمت درمانی یا زیبایی جدید دارید؟</span>
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            می‌توانید خدمت، پزشک معالج و ساعت خالی دلخواه خود را به‌صورت برخط و آنی ثبت فرمایید.
          </p>
        </div>
        <ButtonLink
          to={`/book/${clinic.slug}`}
          variant="outline"
          size="sm"
          className="bg-white hover:bg-teal-50/50 text-[#0f766e] border-teal-200 hover:border-teal-300 font-semibold text-xs whitespace-nowrap self-start sm:self-center shadow-xs"
        >
          ثبت درخواست نوبت
        </ButtonLink>
      </div>

      {/* Appointments List */}
      <Card className="p-6 space-y-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-[3px] border-[#0f766e] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-400">در حال دریافت اطلاعات نوبت‌ها...</p>
          </div>
        ) : displayedAppointments.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400 space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-neutral-300" />
            <p>هیچ نوبتی در این بخش یافت نشد.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedAppointments.map((apt) => {
              const meta = STATUS_META[apt.status];
              const canCancel = activeTab === 'upcoming' && isCancellable(apt.status);

              return (
                <div
                  key={apt.id}
                  className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900">
                          {apt.serviceName}
                        </span>
                        <span className="text-[11px] font-mono text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                          کد رهگیری: {formatTrackingCodeFa(apt.trackingCode)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mt-1">
                        <span>پزشک: {apt.doctorName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          {apt.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          ساعت {formatTimeFa(apt.time)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.bgClass} ${meta.textClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                        {meta.label}
                      </span>

                      {canCancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCancelError(null);
                            setAptToCancel(apt);
                          }}
                          className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                        >
                          لغو نوبت
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={Boolean(aptToCancel)}
        onClose={() => {
          if (!cancelMutation.isPending) {
            setAptToCancel(null);
            setCancelError(null);
          }
        }}
        title="تأیید لغو نوبت"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAptToCancel(null);
                setCancelError(null);
              }}
              disabled={cancelMutation.isPending}
            >
              انصراف
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmCancel}
              isLoading={cancelMutation.isPending}
            >
              بله، لغو شود
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">آیا از لغو نوبت خود اطمینان دارید؟</p>
              <p className="mt-1 text-amber-700 leading-relaxed">
                با لغو نوبت، زمان رزرو شده برای سایر بیماران آزاد خواهد شد و برای رزرو مجدد باید مجدداً هماهنگی انجام شود.
              </p>
            </div>
          </div>

          {aptToCancel && (
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">خدمت:</span>
                <span className="font-semibold text-neutral-800">{aptToCancel.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">پزشک معالج:</span>
                <span className="font-semibold text-neutral-800">{aptToCancel.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">تاریخ و ساعت:</span>
                <span className="font-semibold text-neutral-800 font-mono">
                  {aptToCancel.date} - ساعت {formatTimeFa(aptToCancel.time)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">کد رهگیری:</span>
                <span className="font-mono text-neutral-800">
                  {formatTrackingCodeFa(aptToCancel.trackingCode)}
                </span>
              </div>
            </div>
          )}

          {cancelError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {cancelError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
