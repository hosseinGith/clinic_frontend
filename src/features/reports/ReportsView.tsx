import React from 'react';
import { Card } from '../../components/ui/Card';
import { BarChart3, TrendingUp } from 'lucide-react';

export const ReportsView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
          گزارش‌های عملکرد و تحلیل مالی
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          تحلیل روند درآمد، نرخ اشغال اتاق‌های درمان و بازدهی هر پزشک
        </p>
      </div>

      <Card className="p-12 text-center space-y-4">
        <div className="w-14 h-14 bg-teal-50 text-[#0f766e] rounded-full mx-auto flex items-center justify-center">
          <BarChart3 className="w-7 h-7" />
        </div>

        <div className="max-w-md mx-auto space-y-1.5">
          <h2 className="text-base font-bold text-neutral-900">
            گزارش‌های جامع مالی و عملیاتی
          </h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            نمودارهای فروش دوره‌ای، بررسی نرخ کنسلی نوبت‌ها و سهم هر خدمت از درآمد کلینیک در این بخش ارائه خواهند شد.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
          <TrendingUp className="w-3.5 h-3.5 text-[#0f766e]" />
          <span>داده‌های تحلیلی ماهانه در پایان دوره محاسبه می‌گردد</span>
        </div>
      </Card>
    </div>
  );
};
