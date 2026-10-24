import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Building2,
  Lightbulb,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import { services } from '../../services';
import { platformQueryKeys } from '../../services/queryKeys';
import { formatRialToToman, formatPercent } from '../../utils/currency';
import { toPersianDigits } from '../../utils/toPersianDigits';

export const PlatformRevenueView: React.FC = () => {
  const [timeseriesInterval, setTimeseriesInterval] = useState<'day' | 'month'>('month');

  // Revenue Summary Query
  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useQuery({
    queryKey: platformQueryKeys.revenueSummary(),
    queryFn: () => services.platformBillingRepo.getRevenueSummary(),
  });

  // Timeseries Query
  const { data: timeseries = [], isLoading: isTimeseriesLoading } = useQuery({
    queryKey: platformQueryKeys.revenueTimeseries({ interval: timeseriesInterval }),
    queryFn: () => services.platformBillingRepo.getRevenueTimeseries({ interval: timeseriesInterval }),
  });

  // Revenue by Plan Query
  const { data: plansBreakdown, isLoading: isPlansLoading } = useQuery({
    queryKey: platformQueryKeys.revenueByPlan(),
    queryFn: () => services.platformBillingRepo.getRevenueByPlan(),
  });

  // Revenue by Clinic Query
  const { data: clinicsRevenue, isLoading: isClinicsLoading } = useQuery({
    queryKey: platformQueryKeys.revenueByClinic(),
    queryFn: () => services.platformBillingRepo.getRevenueByClinic(),
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <TrendingUp className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <h1 className="text-xl font-bold text-slate-100">داشبورد درآمد و امور مالی پلتفرم</h1>
        </div>
        <p className="text-xs text-slate-400">
          رصد شاخص‌های کلیدی درآمد دوره‌ای، رشد ماهانه، توزیع پلن‌ها و درآمد به تفکیک کلینیک‌ها
        </p>
      </div>

      {/* KPI Cards Grid */}
      {isSummaryLoading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">در حال دریافت شاخص‌های مالی...</p>
        </div>
      ) : summaryError ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" strokeWidth={1.75} />
          <span>خطا در دریافت خلاصه مالی: {(summaryError as Error).message}</span>
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* MRR */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl shadow-black/20 backdrop-blur-xl relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 font-medium">درآمد مکرر ماهانه (MRR)</span>
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <TrendingUp className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
              {formatRialToToman(summary.mrr)} <span className="text-xs font-normal text-slate-400">تومان/ماه</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span>درآمد تخمینی کلینیک‌ها:</span>
              <span className="font-semibold text-slate-300 font-mono">{formatRialToToman(summary.estimatedClinicRevenue)}</span>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl shadow-black/20 backdrop-blur-xl relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 font-medium">کل درآمد وصول‌شده</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CreditCard className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
              {formatRialToToman(summary.totalRevenue)} <span className="text-xs font-normal text-slate-400">تومان</span>
            </div>
            <div className="text-[11px] mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">رشد نسبت به دوره قبل:</span>
              <span
                className={`font-bold font-mono inline-flex items-center gap-1 ${
                  summary.growthRate >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {summary.growthRate >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" strokeWidth={2} />
                )}
                {formatPercent(summary.growthRate)}
              </span>
            </div>
          </div>

          {/* Overdue Invoices */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl shadow-black/20 backdrop-blur-xl relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 font-medium">مطالبات معوق (فاکتورهای باز)</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-300 font-mono tracking-tight">
              {formatRialToToman(summary.overdueInvoices.totalAmount)} <span className="text-xs font-normal text-slate-400">تومان</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span>تعداد فاکتورهای سررسیدشده:</span>
              <span className="font-semibold text-slate-200 font-mono">{toPersianDigits(summary.overdueInvoices.count)}</span>
            </div>
          </div>

          {/* Subscriptions Status */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl shadow-black/20 backdrop-blur-xl relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 font-medium">اشتراک‌های فعال و انقضا</span>
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Building2 className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
              {toPersianDigits(summary.subscriptionsCount.active)} <span className="text-xs font-normal text-slate-400">کلینیک فعال</span>
            </div>
            <div className="text-[11px] text-amber-400 mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              <span>{toPersianDigits(summary.expiringIn14DaysCount)} کلینیک در مرز انقضا (14 روز آینده)</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Charts Section: Timeseries & Plan Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Timeseries Chart */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/20 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-400" strokeWidth={1.75} />
                روند درآمد ماهانه
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">درآمد حاصل از واریزها بر حسب تومان</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setTimeseriesInterval('month')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  timeseriesInterval === 'month'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ماهانه
              </button>
              <button
                onClick={() => setTimeseriesInterval('day')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  timeseriesInterval === 'day'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                روزانه
              </button>
            </div>
          </div>

          {isTimeseriesLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              در حال رسم نمودار...
            </div>
          ) : timeseries.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              داده‌ای برای بازه انتخابی وجود ندارد.
            </div>
          ) : (
            <div className="pt-4">
              <RevenueSvgChart points={timeseries} />
            </div>
          )}
        </div>

        {/* Plan Breakdown */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/20 backdrop-blur-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" strokeWidth={1.75} />
              سهم درآمد بر اساس پلن‌ها
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">تفکیک درآمد پرداختی بر اساس پلن</p>

            {isPlansLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                در حال بارگذاری...
              </div>
            ) : !plansBreakdown || plansBreakdown.items.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">اطلاعاتی ثبت نشده است.</div>
            ) : (
              <div className="mt-5 space-y-4">
                {plansBreakdown.items.map((planItem, idx) => {
                  const colors = [
                    'from-teal-500 to-teal-400',
                    'from-indigo-500 to-indigo-400',
                    'from-emerald-500 to-emerald-400',
                    'from-amber-500 to-amber-400',
                  ];
                  const barGradient = colors[idx % colors.length];
                  const totalSum = plansBreakdown.items.reduce((acc, p) => acc + p.totalPaid, 0) || 1;
                  const pct = Math.round((planItem.totalPaid / totalSum) * 100);

                  return (
                    <div key={planItem.planId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-200">{planItem.planName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-[11px]">
                            {formatRialToToman(planItem.totalPaid)} تومان
                          </span>
                          <span className="font-bold text-slate-100 font-mono">
                            {toPersianDigits(pct)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full bg-gradient-to-r ${barGradient} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500">
                        تعداد واریزی‌ها: {toPersianDigits(planItem.paymentCount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" strokeWidth={1.75} />
            <span>برای بهینه‌سازی جریان نقدینگی، تشویق کلینیک‌ها به خرید اشتراک سالانه با اعمال تخفیف پیشنهاد می‌شود.</span>
          </div>
        </div>
      </div>

      {/* Revenue by Clinic Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl shadow-black/20 backdrop-blur-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-400" strokeWidth={1.75} />
              درآمد حاصل از کلینیک‌ها
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">لیست کلینیک‌ها با بیشترین درآمد پرداختی به پلتفرم</p>
          </div>
          <span className="text-xs text-slate-400">
            مجموع کلینیک‌های دارای تراکنش:{' '}
            <span className="font-bold text-slate-100 font-mono">{toPersianDigits(clinicsRevenue?.total || 0)}</span>
          </span>
        </div>

        {isClinicsLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            در حال بارگذاری جدول...
          </div>
        ) : !clinicsRevenue || clinicsRevenue.items.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">داده‌ای یافت نشد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">کلینیک</th>
                  <th className="py-3 px-4">شناسه (slug)</th>
                  <th className="py-3 px-4">مجموع پرداختی</th>
                  <th className="py-3 px-4">تعداد تراکنش</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {clinicsRevenue.items.map((item) => (
                  <tr key={item.clinicId} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-100">{item.clinicName}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700/60" dir="ltr">
                        {item.clinicSlug}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100 font-mono">
                      {formatRialToToman(item.totalPaid)} <span className="text-[11px] font-normal text-slate-400">تومان</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">{toPersianDigits(item.paymentCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// High-aesthetic native SVG chart component without heavy bundle libraries
interface SvgChartProps {
  points: { date: string; amount: number; count: number }[];
}

const RevenueSvgChart: React.FC<SvgChartProps> = ({ points }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 640;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 60 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const revenues = points.map((p) => p.amount);
  const maxRevenue = Math.max(...revenues, 1);
  const minRevenue = 0;

  const getX = (idx: number) => {
    if (points.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (idx / (points.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const ratio = (val - minRevenue) / (maxRevenue - minRevenue);
    return padding.top + (1 - ratio) * chartHeight;
  };

  // Generate smooth SVG path
  const linePath = points.reduce((path, p, idx) => {
    const x = getX(idx);
    const y = getY(p.amount);
    return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
  }, '');

  // Fill area under curve
  const areaPath = points.length > 0
    ? `${linePath} L ${getX(points.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`
    : '';

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-72 overflow-visible"
      >
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = padding.top + pct * chartHeight;
          const val = maxRevenue * (1 - pct);
          return (
            <g key={pct}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#1e293b"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                fill="#64748b"
                fontSize="9"
                textAnchor="end"
                fontFamily="sans-serif"
              >
                {formatRialToToman(val)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#revenueGradient)" />

        {/* Trend line */}
        <path
          d={linePath}
          fill="none"
          stroke="#14b8a6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points & X Labels */}
        {points.map((p, idx) => {
          const x = getX(idx);
          const y = getY(p.amount);
          const isHovered = hoveredIdx === idx;

          return (
            <g key={p.date} className="cursor-pointer">
              {/* Vertical guideline on hover */}
              {isHovered && (
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + chartHeight}
                  stroke="#2dd4bf"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}

              {/* Point circle */}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 6 : 3.5}
                fill="#020617"
                stroke="#2dd4bf"
                strokeWidth={isHovered ? 2.5 : 2}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />

              {/* X Axis Date label */}
              <text
                x={x}
                y={height - 10}
                fill="#64748b"
                fontSize="10"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {p.date.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip for active point */}
      {hoveredIdx !== null && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-900/95 border border-slate-700/80 rounded-xl px-3.5 py-2.5 shadow-2xl backdrop-blur-md text-xs space-y-1 transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(getX(hoveredIdx) / width) * 100}%`,
            top: `${(getY(points[hoveredIdx].amount) / height) * 100}%`,
          }}
        >
          <div className="font-bold text-slate-200">{points[hoveredIdx].date}</div>
          <div className="text-teal-400 font-bold font-mono">
            درآمد: {formatRialToToman(points[hoveredIdx].amount)} تومان
          </div>
          <div className="text-slate-400 text-[10px]">
            تعداد واریزی‌ها: {toPersianDigits(points[hoveredIdx].count)}
          </div>
        </div>
      )}
    </div>
  );
};

