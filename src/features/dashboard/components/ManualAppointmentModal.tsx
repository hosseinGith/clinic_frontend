import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useServices, useDoctors } from '../../catalog/hooks/useCatalog';
import { useCreateAppointment } from '../../appointments/hooks/useAppointments';
import { useAvailableSlots } from '../../booking/hooks/useBooking';
import { getUpcomingWorkingDays } from '../../../lib/jalali';
import { toPersianDigits, formatTimeFa } from '../../../lib/format';
import { isValidIranianMobile } from '../../../lib/phone';

export interface ManualAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicId: string;
}

export const ManualAppointmentModal: React.FC<ManualAppointmentModalProps> = ({
  isOpen,
  onClose,
  clinicId,
}) => {
  const { data: servicesList = [] } = useServices(clinicId);
  const { data: doctors = [] } = useDoctors(clinicId);
  const createMutation = useCreateAppointment(clinicId);

  const upcomingDays = React.useMemo(() => getUpcomingWorkingDays(14), []);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(upcomingDays[0]?.dateString || '');
  const [time, setTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: availableSlots = [], isLoading: isLoadingSlots } = useAvailableSlots({
    clinicId,
    doctorId,
    serviceId,
    date,
  });

  const [isSuccessPulsing, setIsSuccessPulsing] = useState(false);
  const pulseTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientName.trim() || !clientPhone.trim() || !serviceId || !doctorId || !date || !time) {
      setError('لطفاً تمامی فیلدهای الزامی از جمله تاریخ و ساعت را تکمیل فرمایید.');
      return;
    }

    if (!isValidIranianMobile(clientPhone)) {
      setError('شماره موبایل وارد شده معتبر نمی‌باشد (فرمت 0912...).');
      return;
    }

    try {
      await createMutation.mutateAsync({
        clinicId,
        date,
        time,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        serviceId,
        doctorId,
        source: 'reception_manual',
      });
      setIsSuccessPulsing(true);
      pulseTimerRef.current = setTimeout(() => {
        setIsSuccessPulsing(false);
        onClose();
        // Reset form
        setClientName('');
        setClientPhone('');
        setServiceId('');
        setDoctorId('');
        setTime('');
      }, 450);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'خطا در ثبت نوبت.';
      setError(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ثبت نوبت دستی مراجع (پذیرش)"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            نام مراجع <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="مثال: سارا محمدی"
            className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#0f766e]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            شماره تماس <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            required
            dir="ltr"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="09123456789"
            className="w-full px-3 py-2 text-xs sm:text-sm text-right border border-neutral-300 rounded-lg focus:outline-none focus:border-[#0f766e]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            نوع خدمت <span className="text-rose-500">*</span>
          </label>
          <select
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setTime('');
            }}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#0f766e] bg-white"
          >
            <option value="">انتخاب نوع خدمت...</option>
            {servicesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({toPersianDigits(s.duration)} دقیقه)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            پزشک معالج <span className="text-rose-500">*</span>
          </label>
          <select
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value);
              setTime('');
            }}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#0f766e] bg-white"
          >
            <option value="">انتخاب پزشک معالج...</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialty})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            تاریخ نوبت <span className="text-rose-500">*</span>
          </label>
          <select
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTime('');
            }}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#0f766e] bg-white"
          >
            {upcomingDays.map((d) => (
              <option key={d.dateString} value={d.dateString}>
                {d.formatted}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            ساعت مراجعه <span className="text-rose-500">*</span>
          </label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={!doctorId || !serviceId || isLoadingSlots}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#0f766e] bg-white disabled:bg-neutral-100 disabled:text-neutral-400"
          >
            <option value="">
              {!doctorId || !serviceId
                ? 'ابتدا خدمت و پزشک را انتخاب کنید...'
                : isLoadingSlots
                ? 'در حال دریافت ساعت‌های خالی...'
                : availableSlots.length === 0
                ? 'هیچ ساعت خالی یافت نشد'
                : 'انتخاب ساعت مراجعه...'}
            </option>
            {availableSlots.map((s) => (
              <option key={s.time} value={s.time}>
                ساعت {formatTimeFa(s.time)}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            انصراف
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={createMutation.isPending || !time}
            className={isSuccessPulsing ? 'mf-confirm-pulse' : ''}
          >
            {createMutation.isPending ? 'در حال ثبت...' : 'ثبت نوبت'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
