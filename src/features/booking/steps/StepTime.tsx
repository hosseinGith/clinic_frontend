import React, { useMemo } from 'react';
import { getUpcomingWorkingDays } from '../../../lib/jalali';
import { useAvailableSlots } from '../hooks/useBooking';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ErrorState } from '../../../components/common/ErrorState';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

export interface StepTimeProps {
  clinicId: string;
  doctorId: string;
  serviceId: string;
  selectedDate: string;
  selectedTime: string;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  conflictError?: string | null;
}

export const StepTime: React.FC<StepTimeProps> = ({
  clinicId,
  doctorId,
  serviceId,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  conflictError,
}) => {
  const workingDays = useMemo(() => getUpcomingWorkingDays(14), []);

  const {
    data: slots = [],
    isLoading,
    isError,
    refetch,
  } = useAvailableSlots({
    clinicId,
    doctorId,
    serviceId,
    date: selectedDate,
  });

  return (
    <div className="space-y-6">
      {conflictError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{conflictError}</span>
        </div>
      )}

      {/* 1. Date Selection (14 Working Days) */}
      <div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-900 mb-2.5">
          <Calendar className="w-4 h-4 text-[#0f766e]" />
          <h3>انتخاب روز مراجعه (تقویم کاری کلینیک)</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {workingDays.map((day) => {
            const isSelected = selectedDate === day.dateString;
            return (
              <button
                key={day.dateString}
                type="button"
                onClick={() => {
                  onSelectDate(day.dateString);
                  onSelectTime('');
                }}
                aria-pressed={isSelected}
                className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${
                  isSelected
                    ? 'border-[#0f766e] bg-teal-50/70 text-[#0f766e] font-bold ring-1 ring-[#0f766e]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <span className="text-[11px] text-neutral-500 font-medium">
                  {day.dayName}
                </span>
                <span className="text-sm font-bold my-0.5">
                  {day.dayNumber}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {day.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Available Time Slots */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-900">
            <Clock className="w-4 h-4 text-[#0f766e]" />
            <h3>انتخاب ساعت مراجعه</h3>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-neutral-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full border border-[#0f766e] bg-teal-50" />
              قابل رزرو
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-neutral-200" />
              تکمیل
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <ErrorState onRetry={() => refetch()} />
          </div>
        ) : slots.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200">
            هیچ ساعت خالی برای این تاریخ یافت نشد. لطفاً روز دیگری را انتخاب فرمایید.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((slot) => {
              const isSelected = selectedTime === slot.rawTime || selectedTime === slot.time;

              if (!slot.available) {
                return (
                  <div
                    key={slot.id}
                    className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-100/70 text-neutral-400 text-center flex flex-col items-center justify-center cursor-not-allowed select-none"
                  >
                    <span className="text-xs font-medium line-through">
                      {slot.time}
                    </span>
                    <span className="text-[10px] text-neutral-400 mt-0.5">
                      رزرو شده
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => onSelectTime(slot.rawTime)}
                  aria-pressed={isSelected}
                  className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? 'border-[#0f766e] bg-[#0f766e] text-white font-bold ring-2 ring-teal-100'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-800 font-medium'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-semibold">
                    {slot.time}
                  </span>
                  <span
                    className={`text-[10px] mt-0.5 ${
                      isSelected ? 'text-teal-100' : 'text-[#0f766e]'
                    }`}
                  >
                    خالی
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
