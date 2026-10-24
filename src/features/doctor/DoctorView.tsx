import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Stethoscope,
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Edit3,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useAuth, useClinic } from '../../app/contexts';
import { services } from '../../services';
import { queryKeys } from '../../services/queryKeys';
import type { Appointment } from '../../domain/appointment';
import type { AppointmentStatus } from '../../domain/appointmentStatus';
import { STATUS_META, canTransitionByRole } from '../../domain/appointmentStatus';
import { getTodayDateString } from '../../lib/jalali';
import { toPersianDigits, formatTimeFa, formatTrackingCodeFa, formatPhoneNumber } from '../../lib/format';
import { Can } from '../../components/auth/Can';

export const DoctorView: React.FC = () => {
  const { user, actor, role } = useAuth();
  const { clinicId } = useClinic();
  const queryClient = useQueryClient();

  const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today');
  const [selectedAptForNotes, setSelectedAptForNotes] = useState<Appointment | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isNoteSubmitting, setIsNoteSubmitting] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const today = getTodayDateString();

  // Query appointments for doctor
  const {
    data: appointments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.appointments.list(clinicId, {
      doctorId: actor?.doctorId,
      date: dateFilter === 'today' ? today : undefined,
    }),
    queryFn: () =>
      services.appointmentRepo.getAppointments(
        clinicId,
        {
          doctorId: actor?.doctorId,
          date: dateFilter === 'today' ? today : undefined,
        },
        actor || undefined
      ),
    enabled: !!actor,
  });

  // Mutation for status update
  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: AppointmentStatus }) =>
      services.appointmentRepo.updateStatus(clinicId, id, newStatus, actor || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all(clinicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary(clinicId) });
    },
  });

  const handleOpenNoteModal = (apt: Appointment) => {
    setSelectedAptForNotes(apt);
    setNoteContent(apt.medicalNotes || '');
    setNoteError(null);
  };

  const handleSaveMedicalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAptForNotes || !actor) return;
    setIsNoteSubmitting(true);
    setNoteError(null);

    try {
      await services.appointmentRepo.updateMedicalNotes(
        clinicId,
        selectedAptForNotes.id,
        noteContent.trim(),
        actor
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all(clinicId) });
      setSelectedAptForNotes(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ثبت یادداشت پزشکی.';
      setNoteError(msg);
    } finally {
      setIsNoteSubmitting(false);
    }
  };

  const todayAppointments = React.useMemo(
    () => appointments.filter((a) => a.date === today),
    [appointments, today]
  );
  const inClinicAppointments = React.useMemo(
    () => appointments.filter((a) => a.status === 'in_clinic'),
    [appointments]
  );
  const completedAppointments = React.useMemo(
    () => appointments.filter((a) => a.status === 'completed'),
    [appointments]
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-teal-800 to-[#0f766e] text-white p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-teal-100 border border-white/20">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{user?.name || 'پزشک محترم'}</h1>
                <Badge className="bg-white/15 text-white border border-white/30 text-[10px]">
                  {user?.roleTitle || 'پزشک معالج'}
                </Badge>
              </div>
              <p className="text-xs text-teal-100/90 mt-1">
                پنل تخصصی ویزیت بیماران، سوابق پزشکی و مدیریت نوبت‌ها
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateFilter === 'today'
                  ? 'bg-white text-[#0f766e] shadow-sm font-bold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              نوبت‌های امروز
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateFilter === 'all'
                  ? 'bg-white text-[#0f766e] shadow-sm font-bold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              همه نوبت‌ها
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0f766e] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 block">نوبت‌های امروز</span>
            <span className="text-lg font-bold text-neutral-900">
              {toPersianDigits(todayAppointments.length)} نوبت
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 block">در انتظار ویزیت / در کلینیک</span>
            <span className="text-lg font-bold text-sky-800">
              {toPersianDigits(inClinicAppointments.length)} نفر
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 block">ویزیت تکمیل‌شده</span>
            <span className="text-lg font-bold text-emerald-800">
              {toPersianDigits(completedAppointments.length)} ویزیت
            </span>
          </div>
        </Card>
      </div>

      {/* Appointments List */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">
              {dateFilter === 'today' ? 'صف بیماران و نوبت‌های امروز' : 'فهرست نوبت‌های تخصصی شما'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              مشاهده سوابق و حساسیت‌های دارویی، ثبت نتیجه‌ی ویزیت و تغییر وضعیت حضور بیمار
            </p>
          </div>
          <span className="text-xs text-neutral-500 font-medium">
            تعداد: {toPersianDigits(appointments.length)}
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-[3px] border-[#0f766e] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-400">در حال دریافت لیست بیماران...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            خطا در دریافت لیست نوبت‌ها.
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400 space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-neutral-300" />
            <p>نوبتی برای بازه انتخابی ثبت نشده است.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => {
              const meta = STATUS_META[apt.status];
              const canMoveToInClinic = role && canTransitionByRole(apt.status, 'in_clinic', role);
              const canComplete = role && canTransitionByRole(apt.status, 'completed', role);

              return (
                <div
                  key={apt.id}
                  className="p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-[#0f766e] text-sm shrink-0">
                        {apt.clientName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-neutral-900">
                            {apt.clientName}
                          </span>
                          <span className="text-[11px] font-mono text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200">
                            {formatTrackingCodeFa(apt.trackingCode)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mt-1">
                          <span className="flex items-center gap-1 font-mono" dir="ltr">
                            <Phone className="w-3.5 h-3.5 text-neutral-400" />
                            {formatPhoneNumber(apt.clientPhone)}
                          </span>
                          <span>•</span>
                          <span>{apt.serviceName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                            {formatTimeFa(apt.time)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.bgClass} ${meta.textClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                        {meta.label}
                      </span>

                      {canMoveToInClinic && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({ id: apt.id, newStatus: 'in_clinic' })
                          }
                          className="text-xs"
                        >
                          ورود به اتاق ویزیت
                        </Button>
                      )}

                      {canComplete && (
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({ id: apt.id, newStatus: 'completed' })
                          }
                          className="text-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تکمیل ویزیت</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Medical Notes Banner */}
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#0f766e] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-neutral-800 ml-1.5">
                          یادداشت و پرونده محرمانه پزشکی:
                        </span>
                        <span className="text-neutral-600">
                          {apt.medicalNotes ? apt.medicalNotes : 'هنوز یادداشت یا حساسیت خاصی ثبت نشده است.'}
                        </span>
                      </div>
                    </div>

                    <Can permission="medical_notes:write">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenNoteModal(apt)}
                        className="text-[#0f766e] hover:bg-teal-50 shrink-0 text-xs flex items-center gap-1 self-end sm:self-auto"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{apt.medicalNotes ? 'ویرایش پرونده' : 'ثبت یادداشت پزشک'}</span>
                      </Button>
                    </Can>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Medical Notes Modal */}
      {/* TODO: Implement server-side at-rest encryption for medical notes in backend */}
      <Modal
        isOpen={!!selectedAptForNotes}
        onClose={() => setSelectedAptForNotes(null)}
        title="ثبت / ویرایش پرونده محرمانه پزشکی بیمار"
        maxWidth="max-w-lg"
      >
        {selectedAptForNotes && (
          <form onSubmit={handleSaveMedicalNote} className="space-y-4">
            <div className="p-3 bg-neutral-50 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-neutral-900">
                بیمار: {selectedAptForNotes.clientName} ({formatPhoneNumber(selectedAptForNotes.clientPhone)})
              </div>
              <div className="text-neutral-500">
                خدمت: {selectedAptForNotes.serviceName} | نوبت: {selectedAptForNotes.date} ساعت{' '}
                {formatTimeFa(selectedAptForNotes.time)}
              </div>
            </div>

            {noteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{noteError}</span>
              </div>
            )}

            <div>
              <label htmlFor="medicalNoteText" className="block text-xs font-semibold text-neutral-800 mb-1.5">
                توضیحات و دستورات پزشکی پزشک معالج <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="medicalNoteText"
                rows={4}
                required
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="سوابق بیماری، حساسیت دارویی، نوع مواد مصرفی، توصیه‌های مراقبتی یا خلاصه اقدامات انجام شده..."
                className="w-full p-3 text-xs sm:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e] bg-white leading-relaxed"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                این یادداشت برای پزشک معالج و مدیر مجاز نمایش داده می‌شود و پرسنل پذیرش به آن دسترسی ندارند.
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setSelectedAptForNotes(null)}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isNoteSubmitting}
                className="flex items-center gap-1.5"
              >
                {isNoteSubmitting ? (
                  <span>در حال ذخیره...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ذخیره در پرونده بیمار</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
