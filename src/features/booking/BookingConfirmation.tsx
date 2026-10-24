import React from 'react';
import type { Appointment } from '../../domain/appointment';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { formatCurrency, formatTimeFa, formatTrackingCodeFa, formatPhoneNumber } from '../../lib/format';
import { formatIsoToJalali } from '../../lib/jalali';
import { CheckCircle, RotateCcw, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../../app/contexts';

export interface BookingConfirmationProps {
  appointment: Appointment;
  trackingCode: string;
  onBookAnother: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  appointment,
  trackingCode,
  onBookAnother,
}) => {
  const { isAuthenticated } = useAuth();

  return (
    <Card className="text-center p-6 sm:p-8 space-y-6 animate-in fade-in">
      <div className="w-16 h-16 bg-teal-50 text-[#0f766e] rounded-full mx-auto flex items-center justify-center">
        <CheckCircle className="w-8 h-8" />
      </div>

      <div>
        <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
          درخواست نوبت شما با موفقیت ثبت شد
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 mt-2">
          پیامک تأیید و جزئیات نوبت به شماره {formatPhoneNumber(appointment.clientPhone)} ارسال خواهد شد.
        </p>
      </div>

      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-5 text-right space-y-3 text-xs sm:text-sm">
        <div className="flex justify-between items-center py-1.5 border-b border-neutral-200/60">
          <span className="text-neutral-500">کد رهگیری اختصاصی:</span>
          <span className="font-mono font-bold text-[#0f766e] text-base">{formatTrackingCodeFa(trackingCode)}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-neutral-200/60">
          <span className="text-neutral-500">نام مراجع:</span>
          <span className="font-semibold text-neutral-900">{appointment.clientName}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-neutral-200/60">
          <span className="text-neutral-500">خدمت درخواستی:</span>
          <span className="font-semibold text-neutral-900">{appointment.serviceName}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-neutral-200/60">
          <span className="text-neutral-500">پزشک معالج:</span>
          <span className="font-semibold text-neutral-900">{appointment.doctorName}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-neutral-200/60">
          <span className="text-neutral-500">تاریخ مراجعه:</span>
          <span className="font-semibold text-neutral-900">{formatIsoToJalali(appointment.date)}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-neutral-200/60">
          <span className="text-neutral-500">ساعت مراجعه:</span>
          <span className="font-semibold text-neutral-900">{formatTimeFa(appointment.time)}</span>
        </div>
        <div className="flex justify-between items-center py-1.5">
          <span className="text-neutral-500">مبلغ خدمت:</span>
          <span className="font-bold text-[#0f766e]">
            {formatCurrency(appointment.price)}
          </span>
        </div>
      </div>

      {/* Suggested Patient Portal Login */}
      {!isAuthenticated && (
        <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 text-right space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0f766e]">
            <Sparkles className="w-4 h-4" />
            <span>پورتال اختصاصی مراجعان</span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            می‌خواهید وضعیت این نوبت را پیگیری کرده یا تاریخچه مراجعات خود را در پنل مشاهده نمایید؟
          </p>
          <div className="pt-1">
            <ButtonLink to="/login" state={{ from: { pathname: '/me' } }} size="sm" variant="primary" className="text-xs">
              ورود به پورتال مراجعان با شماره {formatPhoneNumber(appointment.clientPhone)}
            </ButtonLink>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Button variant="outline" onClick={onBookAnother} className="gap-1.5 w-full sm:w-auto">
          <RotateCcw className="w-4 h-4" />
          <span>ثبت نوبت جدید</span>
        </Button>
        <ButtonLink to="/me" variant="primary" className="gap-1.5 w-full sm:w-auto">
          <span>پیگیری نوبت من</span>
          <ArrowLeft className="w-4 h-4" />
        </ButtonLink>
      </div>
    </Card>
  );
};
