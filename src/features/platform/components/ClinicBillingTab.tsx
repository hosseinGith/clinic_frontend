import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Calendar,
  Clock,
  Stethoscope,
  CalendarDays,
  MessageSquare,
  AlertTriangle,
  X,
  Ban,
  FileText,
  RotateCw,
  ShieldCheck,
} from 'lucide-react';
import { services } from '../../../services';
import { platformQueryKeys } from '../../../services/queryKeys';
import type { Plan, BillingCycle } from '../../../types/platform/billing';
import { formatRialToToman } from '../../../utils/currency';
import { toPersianDigits } from '../../../utils/toPersianDigits';

interface ClinicBillingTabProps {
  clinicId: string;
}

export const ClinicBillingTab: React.FC<ClinicBillingTabProps> = ({ clinicId }) => {
  const queryClient = useQueryClient();

  // Modals state
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [isExtendTrialOpen, setIsExtendTrialOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Queries
  const { data: usageData, isLoading: isUsageLoading, error: usageError } = useQuery({
    queryKey: platformQueryKeys.clinicSubscription(clinicId),
    queryFn: () => services.platformBillingRepo.getClinicSubscription(clinicId),
  });

  const { data: plans = [] } = useQuery({
    queryKey: platformQueryKeys.plans(),
    queryFn: () => services.platformBillingRepo.getPlans(false),
  });

  const { data: invoicesData, isLoading: isInvoicesLoading } = useQuery({
    queryKey: platformQueryKeys.invoices({ clinicId }),
    queryFn: () => services.platformBillingRepo.getInvoices({ clinicId }),
  });

  // Mutations
  const changePlanMutation = useMutation({
    mutationFn: (dto: { planId: string; billingCycle: BillingCycle }) =>
      services.platformBillingRepo.changeClinicPlan(clinicId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.clinicSubscription(clinicId) });
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.invoices({ clinicId }) });
      setIsChangePlanOpen(false);
    },
  });

  const extendMutation = useMutation({
    mutationFn: (days: number) =>
      services.platformBillingRepo.extendClinicSubscription(clinicId, { days }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.clinicSubscription(clinicId) });
      setIsExtendOpen(false);
    },
  });

  const extendTrialMutation = useMutation({
    mutationFn: (days: number) =>
      services.platformBillingRepo.extendClinicTrial(clinicId, { days }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.clinicSubscription(clinicId) });
      setIsExtendTrialOpen(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => services.platformBillingRepo.cancelClinicSubscription(clinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.clinicSubscription(clinicId) });
      setIsCancelConfirmOpen(false);
    },
  });

  if (isUsageLoading) {
    return (
      <div className="py-16 text-center">
        <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">در حال بارگذاری وضعیت اشتراک...</p>
      </div>
    );
  }

  if (usageError || !usageData) {
    return (
      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" strokeWidth={1.75} />
        <span>خطا در دریافت وضعیت اشتراک کلینیک: {(usageError as Error)?.message || 'اطلاعات در دسترس نیست'}</span>
      </div>
    );
  }

  const subscription = (usageData as any).subscription || (usageData as any).current || null;
  const plan = (usageData as any).plan || subscription?.plan || null;
  const daysRemaining = (usageData as any).daysRemaining ?? subscription?.daysRemaining ?? 0;

  const rawUsage = (usageData as any).usage;
  const usage = {
    doctorsCount: rawUsage?.doctorsCount ?? 0,
    maxDoctors: rawUsage?.maxDoctors ?? plan?.maxDoctors ?? 0,
    doctorsPercentage: rawUsage?.doctorsPercentage ?? 0,
    monthlyAppointmentsCount: rawUsage?.monthlyAppointmentsCount ?? 0,
    maxMonthlyAppointments: rawUsage?.maxMonthlyAppointments ?? plan?.maxMonthlyAppointments ?? 0,
    appointmentsPercentage: rawUsage?.appointmentsPercentage ?? 0,
    monthlySmsCount: rawUsage?.monthlySmsCount ?? 0,
    monthlySmsQuota: rawUsage?.monthlySmsQuota ?? plan?.monthlySmsQuota ?? 0,
    smsPercentage: rawUsage?.smsPercentage ?? 0,
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'from-rose-500 to-rose-400';
    if (percentage >= 75) return 'from-amber-500 to-amber-400';
    return 'from-teal-500 to-emerald-400';
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Card */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/20 backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Sparkles className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <span className="text-xs text-slate-400 font-medium">پلن فعلی:</span>
              <span className="text-lg font-bold text-slate-100">{plan ? plan.name : 'بدون پلن فعال'}</span>
              {subscription && (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border ${
                    subscription.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : subscription.status === 'trial'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      subscription.status === 'active'
                        ? 'bg-emerald-400 animate-pulse'
                        : subscription.status === 'trial'
                        ? 'bg-indigo-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  {subscription.status === 'active' ? 'فعال' : subscription.status === 'trial' ? 'آزمایشی' : subscription.status}
                </span>
              )}
            </div>

            {subscription && (
              <div className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                  دوره: <strong className="text-slate-200">{subscription.billingCycle === 'yearly' ? 'سالانه' : 'ماهانه'}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                  پایان دوره: <strong className="text-slate-200 font-mono">{subscription.currentPeriodEnd ? subscription.currentPeriodEnd.slice(0, 10) : '—'}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                  باقیمانده: <strong className="text-teal-400 font-mono">{toPersianDigits(daysRemaining)} روز</strong>
                </span>
                {!subscription.autoRenew && (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-medium px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-3 h-3" strokeWidth={1.75} />
                    لغو شده در پایان دوره
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsChangePlanOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-medium transition-all shadow-lg shadow-teal-600/20 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
              تغییر پلن
            </button>
            <button
              onClick={() => setIsExtendOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors border border-slate-700/80"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              تمدید دوره
            </button>
            <button
              onClick={() => setIsExtendTrialOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-xl text-xs font-medium transition-colors border border-indigo-500/30"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" strokeWidth={1.75} />
              تمدید Trial
            </button>
            {subscription && subscription.autoRenew && (
              <button
                onClick={() => setIsCancelConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-medium transition-colors border border-rose-500/30"
              >
                <Ban className="w-3.5 h-3.5 text-rose-400" strokeWidth={1.75} />
                لغو اشتراک
              </button>
            )}
          </div>
        </div>

        {/* Usage vs Limits Progress Bars */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" strokeWidth={1.75} />
              مصرف منابع نسبت به سقف پلن
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Doctors */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-400" strokeWidth={1.75} />
                  پزشکان فعال:
                </span>
                <span className="font-mono font-bold text-slate-200">
                  {toPersianDigits(usage.doctorsCount)} / {usage.maxDoctors === 0 ? 'نامحدود' : toPersianDigits(usage.maxDoctors)}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getProgressBarColor(usage.doctorsPercentage)} transition-all duration-500`}
                  style={{ width: `${Math.min(100, usage.doctorsPercentage)}%` }}
                />
              </div>
            </div>

            {/* Appointments */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-teal-400" strokeWidth={1.75} />
                  ویزیت‌های ماه جاری:
                </span>
                <span className="font-mono font-bold text-slate-200">
                  {toPersianDigits(usage.monthlyAppointmentsCount)} / {usage.maxMonthlyAppointments === 0 ? 'نامحدود' : toPersianDigits(usage.maxMonthlyAppointments)}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getProgressBarColor(usage.appointmentsPercentage)} transition-all duration-500`}
                  style={{ width: `${Math.min(100, usage.appointmentsPercentage)}%` }}
                />
              </div>
            </div>

            {/* SMS */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-teal-400" strokeWidth={1.75} />
                  پیامک‌های ارسالی:
                </span>
                <span className="font-mono font-bold text-slate-200">
                  {toPersianDigits(usage.monthlySmsCount)} / {toPersianDigits(usage.monthlySmsQuota)}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getProgressBarColor(usage.smsPercentage)} transition-all duration-500`}
                  style={{ width: `${Math.min(100, usage.smsPercentage)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table for this Clinic */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl shadow-black/20 backdrop-blur-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <FileText className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-200">فاکتورها و سوابق مالی این کلینیک</h3>
          </div>
          <span className="text-xs text-slate-400">
            تعداد: <span className="font-mono font-bold text-slate-200">{toPersianDigits(invoicesData?.total || 0)}</span>
          </span>
        </div>

        {isInvoicesLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            در حال بارگذاری فاکتورها...
          </div>
        ) : !invoicesData || invoicesData.items.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" strokeWidth={1.5} />
            فاکتوری برای این کلینیک ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">شماره فاکتور</th>
                  <th className="py-3 px-4">مبلغ</th>
                  <th className="py-3 px-4">دوره</th>
                  <th className="py-3 px-4">وضعیت</th>
                  <th className="py-3 px-4">تاریخ پرداخت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {invoicesData.items.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-teal-400">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700/60">
                        {inv.number}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono">
                      {formatRialToToman(inv.amount)} <span className="text-slate-400 text-[11px] font-normal">تومان</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      {inv.periodStart.slice(0, 10)} تا {inv.periodEnd.slice(0, 10)}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.status === 'paid' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          پرداخت‌شده
                        </span>
                      )}
                      {inv.status === 'open' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          باز (پرداخت‌نشده)
                        </span>
                      )}
                      {inv.status === 'void' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          باطل‌شده
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {inv.paidAt ? inv.paidAt.slice(0, 10) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Plan Modal */}
      <AnimatePresence>
        {/* Change Plan Modal */}
        {isChangePlanOpen && subscription && (
          <ChangePlanModal
            currentPlanId={subscription.planId}
            currentCycle={subscription.billingCycle}
            plans={plans}
            onClose={() => setIsChangePlanOpen(false)}
            onSubmit={async (planId, billingCycle) => {
              await changePlanMutation.mutateAsync({ planId, billingCycle });
            }}
            isSubmitting={changePlanMutation.isPending}
          />
        )}

        {/* Extend Modal */}
        {isExtendOpen && (
          <ExtendDaysModal
            title="تمدید دوره اشتراک"
            description="تعداد روزهای اضافه شده به پایان دوره فعلی این کلینیک را وارد کنید:"
            defaultDays={30}
            onClose={() => setIsExtendOpen(false)}
            onSubmit={async (days) => {
              await extendMutation.mutateAsync(days);
            }}
            isSubmitting={extendMutation.isPending}
          />
        )}

        {/* Extend Trial Modal */}
        {isExtendTrialOpen && (
          <ExtendDaysModal
            title="تمدید دوره آزمایشی (Trial)"
            description="تعداد روزهای تمدید مهلت تست رایگان برای این کلینیک:"
            defaultDays={14}
            onClose={() => setIsExtendTrialOpen(false)}
            onSubmit={async (days) => {
              await extendTrialMutation.mutateAsync(days);
            }}
            isSubmitting={extendTrialMutation.isPending}
          />
        )}

        {/* Cancel Confirm Modal */}
        {isCancelConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', duration: 0.4 } }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 text-xs shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <h4 className="text-sm font-bold text-slate-100">لغو اشتراک در پایان دوره</h4>
              </div>
              <p className="text-slate-300 leading-relaxed">
                با تایید این عملیات، تمدید خودکار اشتراک لغو شده و در انتهای دوره منقضی می‌شود.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCancelConfirmOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors font-medium"
                >
                  انصراف
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold disabled:opacity-50 transition-colors shadow-lg shadow-rose-600/20"
                >
                  {cancelMutation.isPending ? 'در حال ثبت...' : 'تایید لغو اشتراک'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-modal for changing plan
interface ChangePlanModalProps {
  currentPlanId: string;
  currentCycle: BillingCycle;
  plans: Plan[];
  onClose: () => void;
  onSubmit: (planId: string, cycle: BillingCycle) => Promise<void>;
  isSubmitting: boolean;
}

const ChangePlanModal: React.FC<ChangePlanModalProps> = ({
  currentPlanId,
  currentCycle,
  plans,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(currentCycle);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', duration: 0.4 } }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Sparkles className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-100">تغییر پلن و دوره صورت‌حساب</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-slate-300 mb-1.5 font-medium">انتخاب پلن جدید</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatRialToToman(billingCycle === 'yearly' ? p.priceYearly : p.priceMonthly)} تومان)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1.5 font-medium">دوره پرداخت</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`p-2.5 rounded-xl border font-medium text-xs transition-all ${
                  billingCycle === 'monthly'
                    ? 'border-teal-500 bg-teal-500/15 text-teal-300 shadow-sm'
                    : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200'
                }`}
              >
                ماهانه
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`p-2.5 rounded-xl border font-medium text-xs transition-all ${
                  billingCycle === 'yearly'
                    ? 'border-teal-500 bg-teal-500/15 text-teal-300 shadow-sm'
                    : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200'
                }`}
              >
                سالانه
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors font-medium"
          >
            انصراف
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            disabled={isSubmitting}
            onClick={() => onSubmit(selectedPlanId, billingCycle)}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold disabled:opacity-50 transition-colors shadow-lg shadow-teal-600/20"
          >
            {isSubmitting ? 'در حال اعمال...' : 'اعمال تغییر پلن'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Sub-modal for extending days
interface ExtendDaysModalProps {
  title: string;
  description: string;
  defaultDays: number;
  onClose: () => void;
  onSubmit: (days: number) => Promise<void>;
  isSubmitting: boolean;
}

const ExtendDaysModal: React.FC<ExtendDaysModalProps> = ({
  title,
  description,
  defaultDays,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [days, setDays] = useState(defaultDays);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', duration: 0.4 } }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <p className="text-slate-300 leading-relaxed">{description}</p>

        <div>
          <label className="block text-slate-300 mb-1.5 font-medium">تعداد روز</label>
          <input
            type="number"
            min="1"
            max="365"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors font-medium"
          >
            انصراف
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            disabled={isSubmitting || days <= 0}
            onClick={() => onSubmit(days)}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold disabled:opacity-50 transition-colors shadow-lg shadow-teal-600/20"
          >
            {isSubmitting ? 'در حال ثبت...' : 'تایید تمدید'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

