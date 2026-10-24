import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { services } from '../../services';
import { queryKeys } from '../../services/queryKeys';
import { BookingIntro } from './components/BookingIntro';
import { BookingWizard } from './BookingWizard';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { DemoBanner } from '../../components/layout/DemoBanner';

export const BookingView: React.FC = () => {
  const { clinicSlug = 'ariana' } = useParams<{ clinicSlug: string }>();

  const { data: clinic, isLoading } = useQuery({
    queryKey: queryKeys.catalog.clinicBySlug(clinicSlug),
    queryFn: () => services.catalogRepo.getClinicBySlug(clinicSlug),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-8 h-8 border-[3px] border-[#0f766e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-neutral-900 mb-2">کلینیک یافت نشد</h1>
        <p className="text-sm text-neutral-500 mb-6 max-w-sm">
          آدرس اینترنتی کلینیک مورد نظر اشتباه است یا این کلینیک در سامانه غیرفعال می‌باشد.
        </p>
        <Link
          to="/"
          className="px-4 py-2 bg-[#0f766e] text-white rounded-lg text-sm font-semibold hover:bg-teal-800 transition-colors"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717] flex flex-col">
      <DemoBanner />
      {/* Top Simple Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#0f766e] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              M
            </span>
            <div>
              <span className="text-sm font-bold text-neutral-900 block">
                {clinic.name}
              </span>
              <span className="text-[10px] text-neutral-400 block">
                ثبت آنلاین درخواست نوبت
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/me"
              className="text-xs font-semibold text-[#0f766e] hover:text-teal-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors border border-teal-200"
            >
              <span>پیگیری نوبت من</span>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-[#0f766e]" />
              <span>نوبت‌دهی رسمی کلینیک</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Two-Column Content (Intro + Wizard) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Column 1: Introduction & Clinic Value Props (5 cols) */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <BookingIntro clinic={clinic} />
          </div>

          {/* Column 2: 4-Step Booking Wizard (7 cols) */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <BookingWizard clinicId={clinic.id} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-neutral-400">
          {clinic.name} • سامانه هوشمند رزرو نوبت مدفلو • تلفن کلینیک: {clinic.phone}
        </div>
      </footer>
    </div>
  );
};
