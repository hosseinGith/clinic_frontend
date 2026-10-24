import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { services } from '../../services';
import { subscriptionQueryKeys } from '../../services/queryKeys';
import { Card } from '../../components/ui/Card';
import { formatRialToToman } from '../../utils/currency';
import { toPersianDigits } from '../../utils/toPersianDigits';
import { ShieldCheck, CreditCard } from 'lucide-react';

export const MySubscriptionView: React.FC = () => {
  const { data: usageData, isLoading, error } = useQuery({
    queryKey: subscriptionQueryKeys.me(),
    queryFn: () => services.subscriptionRepo.getMySubscription(),
  });

  const { data: invoicesData, isLoading: isInvoicesLoading } = useQuery({
    queryKey: subscriptionQueryKeys.invoices(),
    queryFn: () => services.subscriptionRepo.getMyInvoices(),
  });

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-neutral-400">
        در حال بارگذاری وضعیت اشتراک...
      </div>
    );
  }

  if (error || !usageData) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
        خطا در دریافت وضعیت اشتراک: {(error as Error)?.message || 'اطلاعات در دسترس نیست'}
      </div>
    );
  }

  const { subscription, plan, usage, daysRemaining } = usageData;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
          اشتراک و صورت‌حساب کلینیک
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          مشاهده جزئیات پلن فعال، مصرف نسبت به سقف و فاکتورهای پرداخت‌شده
        </p>
      </div>

      {/* Subscription Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-neutral-900">
                  {plan ? `پلن ${plan.name}` : 'پلن نامشخص'}
                </h2>
                {subscription && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      subscription.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : subscription.status === 'trial'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {subscription.status === 'active' ? 'فعال' : subscription.status === 'trial' ? 'آزمایشی' : subscription.status}
                  </span>
                )}
              </div>
              {subscription && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  دوره صورت‌حساب: <strong className="text-neutral-700">{subscription.billingCycle === 'yearly' ? 'سالانه' : 'ماهانه'}</strong>
                  {' • '}
                  تاریخ پایان دوره: <strong className="text-neutral-700" dir="ltr">{subscription.currentPeriodEnd ? subscription.currentPeriodEnd.slice(0, 10) : '—'}</strong>
                  {' • '}
                  باقیمانده: <strong className="text-neutral-700">{toPersianDigits(daysRemaining)} روز</strong>
                </p>
              )}
            </div>
          </div>

          {plan && subscription && (
            <div className="text-left sm:text-right">
              <span className="text-xs text-neutral-400 block">هزینه دوره:</span>
              <span className="text-lg font-bold text-neutral-900">
                {formatRialToToman(subscription.billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly)}{' '}
                <span className="text-xs text-neutral-500 font-normal">تومان</span>
              </span>
            </div>
          )}
        </div>

        {/* Limits & Usage */}
        <div className="pt-5 space-y-4">
          <h3 className="text-xs font-bold text-neutral-700">میزان مصرف در دوره جاری</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Doctors */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-600 font-medium">پزشکان فعال</span>
                <span className="font-bold text-neutral-900">
                  {toPersianDigits(usage.doctorsCount)} / {usage.maxDoctors === 0 ? 'نامحدود' : toPersianDigits(usage.maxDoctors)}
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    usage.doctorsPercentage >= 90 ? 'bg-rose-500' : usage.doctorsPercentage >= 75 ? 'bg-amber-500' : 'bg-teal-600'
                  }`}
                  style={{ width: `${Math.min(100, usage.doctorsPercentage)}%` }}
                />
              </div>
            </div>

            {/* Appointments */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-600 font-medium">ویزیت‌های ثبت‌شده</span>
                <span className="font-bold text-neutral-900">
                  {toPersianDigits(usage.monthlyAppointmentsCount)} / {usage.maxMonthlyAppointments === 0 ? 'نامحدود' : toPersianDigits(usage.maxMonthlyAppointments)}
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    usage.appointmentsPercentage >= 90 ? 'bg-rose-500' : usage.appointmentsPercentage >= 75 ? 'bg-amber-500' : 'bg-teal-600'
                  }`}
                  style={{ width: `${Math.min(100, usage.appointmentsPercentage)}%` }}
                />
              </div>
            </div>

            {/* SMS */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-600 font-medium">پیامک‌های مصرفی</span>
                <span className="font-bold text-neutral-900">
                  {toPersianDigits(usage.monthlySmsCount)} / {toPersianDigits(usage.monthlySmsQuota)}
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    usage.smsPercentage >= 90 ? 'bg-rose-500' : usage.smsPercentage >= 75 ? 'bg-amber-500' : 'bg-teal-600'
                  }`}
                  style={{ width: `${Math.min(100, usage.smsPercentage)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Invoices List */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#0f766e]" />
            <h2 className="text-sm font-bold text-neutral-900">سوابق فاکتورهای دوره‌ای</h2>
          </div>
          <span className="text-xs text-neutral-400">
            تعداد فاکتورها: {toPersianDigits(invoicesData?.total || 0)}
          </span>
        </div>

        {isInvoicesLoading ? (
          <div className="p-8 text-center text-xs text-neutral-400">در حال دریافت فاکتورها...</div>
        ) : !invoicesData || invoicesData.items.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">فاکتوری برای این کلینیک یافت نشد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">شماره فاکتور</th>
                  <th className="py-3 px-4 font-semibold">مبلغ</th>
                  <th className="py-3 px-4 font-semibold">دوره اشتراک</th>
                  <th className="py-3 px-4 font-semibold">وضعیت</th>
                  <th className="py-3 px-4 font-semibold">تاریخ پرداخت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-800">
                {invoicesData.items.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-teal-700">{inv.number}</td>
                    <td className="py-3 px-4 font-bold">
                      {formatRialToToman(inv.amount)} <span className="text-[10px] text-neutral-400">تومان</span>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      <span dir="ltr">{inv.periodStart.slice(0, 10)}</span> تا <span dir="ltr">{inv.periodEnd.slice(0, 10)}</span>
                    </td>
                    <td className="py-3 px-4">
                      {inv.status === 'paid' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          پرداخت‌شده
                        </span>
                      )}
                      {inv.status === 'open' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-amber-50 text-amber-700 border border-amber-200">
                          در انتظار پرداخت
                        </span>
                      )}
                      {inv.status === 'void' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-neutral-100 text-neutral-500 border border-neutral-200">
                          باطل‌شده
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-500">
                      {inv.paidAt ? inv.paidAt.slice(0, 10) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
