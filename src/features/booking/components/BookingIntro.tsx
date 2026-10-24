import React from 'react';
import type { ClinicWorkspace } from '../../../domain/session';
import {
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  CalendarCheck,
  Zap,
} from 'lucide-react';

export interface BookingIntroProps {
  clinic: ClinicWorkspace;
}

export const BookingIntro: React.FC<BookingIntroProps> = ({ clinic }) => {
  return (
    <div className="space-y-6 lg:sticky lg:top-8">
      {/* Clinic Name & Badges */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-[#0f766e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0f766e]" />
            پذیرش آنلاین
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0f766e]" />
            ثبت مستقیم در پنل پذیرش
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
          {clinic.name}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-medium">
          ثبت آنلاین درخواست نوبت
        </p>
      </div>

      {/* Main Pitch */}
      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-bold text-neutral-900 leading-snug">
          درخواست نوبتت را در کمتر از یک دقیقه ثبت کن.
        </h2>
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
          خدمت، پزشک و زمان مناسب را انتخاب کن؛ پذیرش آریانا درخواست را بررسی و
          تأیید می‌کند.
        </p>
      </div>

      {/* 3 Core Benefits */}
      <div className="space-y-3 pt-2">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#0f766e] flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
              بدون تماس تلفنی و انتظار
            </h3>
            <p className="text-xs text-neutral-500">
              رزرو در هر ساعت از شبانه‌روز در کمتر از چند کلیک ساده
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#0f766e] flex items-center justify-center shrink-0 mt-0.5">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
              مشاهده مستقیم درخواست توسط پذیرش
            </h3>
            <p className="text-xs text-neutral-500">
              ارسال آنی مشخصات به صف بررسی منشی کلینیک
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#0f766e] flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
              جلوگیری از ثبت همزمان یک نوبت
            </h3>
            <p className="text-xs text-neutral-500">
              محاسبه هوشمند ساعت‌های خالی بدون تداخل و کنسلی
            </p>
          </div>
        </div>
      </div>

      {/* Clinic Working Info */}
      <div className="pt-4 border-t border-neutral-200 text-xs text-neutral-600 space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#0f766e] shrink-0" />
          <span>{clinic.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#0f766e] shrink-0" />
          <span>ساعات کاری: {clinic.workingHours}</span>
        </div>
      </div>
    </div>
  );
};
