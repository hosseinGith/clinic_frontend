import React from 'react';
import { useClinic } from '../../app/contexts';
import { useLeads } from './hooks/useLeads';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { toPersianDigits, formatPhoneNumber } from '../../lib/format';
import type { LeadStatus } from '../../domain/lead';
import { Flame } from 'lucide-react';

const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  hot: { label: 'سرنخ داغ', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  new: { label: 'سرنخ جدید', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  contacted: { label: 'تماس گرفته‌شده', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  converted: { label: 'تبدیل‌شده', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  dropped: { label: 'انصراف', bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-200' },
};

export const LeadsView: React.FC = () => {
  const { clinicId } = useClinic();
  const { data: leads = [], isLoading, isError, refetch } = useLeads(clinicId);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
          سرنخ‌های فروش و متقاضیان
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          پیگیری مشتریان بالقوه ورودی از کمپین‌ها، اینستاگرام و سایت
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/60 text-neutral-500 text-xs font-medium">
                  <th scope="col" className="h-11 px-4 text-right">نام متقاضی</th>
                  <th scope="col" className="h-11 px-4 text-right">شماره تماس</th>
                  <th scope="col" className="h-11 px-4 text-right">خدمت مورد علاقه</th>
                  <th scope="col" className="h-11 px-4 text-right">منبع جذب</th>
                  <th scope="col" className="h-11 px-4 text-right">امتیاز تبدیل</th>
                  <th scope="col" className="h-11 px-4 text-right">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-sm text-neutral-900">
                {leads.map((lead) => {
                  const statusConfig = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.new;

                  return (
                    <tr key={lead.id} className="h-14 hover:bg-neutral-50/60 transition-colors">
                      <td className="px-4 font-semibold text-xs sm:text-sm text-neutral-900 whitespace-nowrap">
                        {lead.name}
                      </td>
                      <td className="px-4 text-xs font-mono text-neutral-500 whitespace-nowrap">
                        {formatPhoneNumber(lead.phone)}
                      </td>
                      <td className="px-4 text-xs sm:text-sm text-neutral-700 whitespace-nowrap">
                        {lead.interestedService}
                      </td>
                      <td className="px-4 text-xs text-neutral-500 whitespace-nowrap">
                        {lead.source}
                      </td>
                      <td className="px-4 whitespace-nowrap">
                        <span className="font-bold text-xs text-[#0f766e]">
                          {toPersianDigits(lead.score)}٪
                        </span>
                      </td>
                      <td className="px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            {lead.status === 'hot' && <Flame className="w-3 h-3 text-rose-500" />}
                            {statusConfig.label}
                          </span>
                          {lead.isDecisionReady && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800">
                              آماده تصمیم‌گیری
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
