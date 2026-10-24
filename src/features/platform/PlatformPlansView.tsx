import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  Plus,
  Edit3,
  PowerOff,
  AlertCircle,
  Sparkles,
  Stethoscope,
  Calendar,
  MessageSquare,
  X,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { services } from '../../services';
import { platformQueryKeys } from '../../services/queryKeys';
import type { Plan } from '../../types/platform/billing';
import type { CreatePlanDto, UpdatePlanDto } from '../../services/repositories/IPlatformBillingRepository';
import { formatRialToToman } from '../../utils/currency';
import { toPersianDigits } from '../../utils/toPersianDigits';

export const PlatformPlansView: React.FC = () => {
  const queryClient = useQueryClient();
  const [includeInactive, setIncludeInactive] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deactivatingPlanId, setDeactivatingPlanId] = useState<string | null>(null);

  const { data: plans = [], isLoading, error } = useQuery({
    queryKey: platformQueryKeys.plans(includeInactive),
    queryFn: () => services.platformBillingRepo.getPlans(includeInactive),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreatePlanDto) => services.platformBillingRepo.createPlan(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'plans'] });
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePlanDto }) =>
      services.platformBillingRepo.updatePlan(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'plans'] });
      setEditingPlan(null);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => services.platformBillingRepo.deactivatePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'plans'] });
      setDeactivatingPlanId(null);
    },
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Layers className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h1 className="text-xl font-bold text-slate-100">پلن‌های اشتراک پلتفرم</h1>
          </div>
          <p className="text-xs text-slate-400">
            تعریف قیمت‌ها، سقف تعداد پزشک، ویزیت ماهانه و سهمیه پیامک برای هر سطح اشتراک
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800/60 transition-colors">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-teal-500 focus:ring-0 focus:ring-offset-0"
            />
            <span>نمایش پلن‌های غیرفعال</span>
          </label>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-teal-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>تعریف پلن جدید</span>
          </button>
        </div>
      </div>

      {/* Plans List / Grid */}
      {isLoading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">در حال دریافت لیست پلن‌ها...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" strokeWidth={1.75} />
          <span>خطا در بارگذاری پلن‌ها: {(error as Error).message}</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" strokeWidth={1.5} />
          هیچ پلنی یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between bg-slate-900/70 border rounded-2xl p-6 transition-all duration-300 backdrop-blur-xl shadow-xl shadow-black/20 hover:border-slate-700 ${plan.isActive
                  ? 'border-slate-800/90'
                  : 'border-slate-800/40 opacity-60 bg-slate-950/40'
                }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700/60">
                      {plan.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-2.5 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-400" strokeWidth={1.75} />
                      {plan.name}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border ${plan.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${plan.isActive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                    {plan.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 min-h-[36px] line-clamp-2 mb-4 leading-relaxed">
                  {plan.description || 'بدون توضیح'}
                </p>

                {/* Pricing in Toman */}
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">قیمت ماهانه:</span>
                    <span className="font-bold text-slate-100 font-mono">
                      {formatRialToToman(plan.priceMonthly)} <span className="text-[11px] font-normal text-slate-400">تومان</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800/60">
                    <span className="text-slate-400">قیمت سالانه:</span>
                    <span className="font-bold text-slate-100 font-mono">
                      {formatRialToToman(plan.priceYearly)} <span className="text-[11px] font-normal text-slate-400">تومان</span>
                    </span>
                  </div>
                </div>

                {/* Limits */}
                <div className="space-y-2.5 text-xs border-t border-slate-800 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-400" strokeWidth={1.75} />
                      سقف پزشک فعال:
                    </span>
                    <span className="font-semibold text-slate-200 font-mono">
                      {plan.maxDoctors === 0 ? 'نامحدود' : toPersianDigits(plan.maxDoctors)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-400" strokeWidth={1.75} />
                      سقف ویزیت ماهانه:
                    </span>
                    <span className="font-semibold text-slate-200 font-mono">
                      {plan.maxMonthlyAppointments === 0 ? 'نامحدود' : toPersianDigits(plan.maxMonthlyAppointments)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-teal-400" strokeWidth={1.75} />
                      سهمیه پیامک ماهانه:
                    </span>
                    <span className="font-semibold text-slate-200 font-mono">
                      {toPersianDigits(plan.monthlySmsQuota)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 mt-5 border-t border-slate-800">
                <button
                  onClick={() => setEditingPlan(plan)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors border border-slate-700/60"
                >
                  <Edit3 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  ویرایش
                </button>
                {plan.isActive && (
                  <button
                    onClick={() => setDeactivatingPlanId(plan.id)}
                    className="flex items-center gap-1.5 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-medium transition-colors"
                  >
                    <PowerOff className="w-3.5 h-3.5" strokeWidth={1.75} />
                    غیرفعال‌سازی
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      {(isCreateModalOpen || editingPlan) && (
        <PlanFormModal
          plan={editingPlan}
          isOpen={isCreateModalOpen || !!editingPlan}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingPlan(null);
          }}
          onSubmit={async (values) => {
            if (editingPlan) {
              await updateMutation.mutateAsync({ id: editingPlan.id, dto: values });
            } else {
              await createMutation.mutateAsync(values as CreatePlanDto);
            }
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Deactivate Confirm Modal */}
      {deactivatingPlanId && (
        <div className="fixed  !m-0 inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h4 className="text-sm font-bold text-slate-100">تایید غیرفعال‌سازی پلن</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              با غیرفعال کردن این پلن، کلینیک‌های جدید نمی‌توانند آن را انتخاب کنند، اما اشتراک‌های فعال فعلی بدون اختلال ادامه می‌یابند.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeactivatingPlanId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => deactivateMutation.mutate(deactivatingPlanId)}
                disabled={deactivateMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors shadow-lg shadow-rose-600/20"
              >
                {deactivateMutation.isPending ? 'در حال اعمال...' : 'بله، غیرفعال شود'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal Component for Plan Create/Edit
interface PlanFormModalProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CreatePlanDto | UpdatePlanDto) => Promise<void>;
  isSubmitting: boolean;
}

const PlanFormModal: React.FC<PlanFormModalProps> = ({
  plan,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [code, setCode] = useState(plan?.code || '');
  const [name, setName] = useState(plan?.name || '');
  const [description, setDescription] = useState(plan?.description || '');
  const [priceMonthlyToman, setPriceMonthlyToman] = useState<number>(
    plan ? Math.round(plan.priceMonthly / 10) : 1000000
  );
  const [priceYearlyToman, setPriceYearlyToman] = useState<number>(
    plan ? Math.round(plan.priceYearly / 10) : 10000000
  );
  const [maxDoctors, setMaxDoctors] = useState<number>(plan?.maxDoctors ?? 3);
  const [maxMonthlyAppointments, setMaxMonthlyAppointments] = useState<number>(
    plan?.maxMonthlyAppointments ?? 200
  );
  const [monthlySmsQuota, setMonthlySmsQuota] = useState<number>(
    plan?.monthlySmsQuota ?? 500
  );
  const [sortOrder, setSortOrder] = useState<number>(plan?.sortOrder ?? 1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('نام پلن الزامی است');
      return;
    }
    if (!plan && !code.trim()) {
      setErrorMsg('شناسه یکتا (کد) پلن الزامی است');
      return;
    }

    try {
      const payload: CreatePlanDto | UpdatePlanDto = {
        name,
        description,
        priceMonthly: priceMonthlyToman * 10, // store in Rials
        priceYearly: priceYearlyToman * 10,
        maxDoctors: Number(maxDoctors),
        maxMonthlyAppointments: Number(maxMonthlyAppointments),
        monthlySmsQuota: Number(monthlySmsQuota),
        sortOrder: Number(sortOrder),
      };

      if (!plan) {
        (payload as CreatePlanDto).code = code.trim().toLowerCase();
      }

      await onSubmit(payload);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'خطا در ثبت پلن');
    }
  };

  return (
    <div className="fixed  !m-0 inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Layers className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              {plan ? `ویرایش پلن «${plan.name}»` : 'تعریف پلن جدید اشتراک'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" strokeWidth={1.75} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">نام پلن *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: حرفه‌ای"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                کد یکتای لاتین {plan ? '(غیرقابل تغییر)' : '*'}
              </label>
              <input
                type="text"
                required={!plan}
                disabled={!!plan}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: pro"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 disabled:opacity-50 font-mono transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">توضیحات</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیح کوتاه برای نمایش در فاکتور و کارت پلن"
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            />
          </div>

          {/* Pricing in Toman */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-teal-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
              قیمت‌گذاری (به تومان)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-1">قیمت ماهانه (تومان)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  required
                  value={priceMonthlyToman}
                  onChange={(e) => setPriceMonthlyToman(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">قیمت سالانه (تومان)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  required
                  value={priceYearlyToman}
                  onChange={(e) => setPriceYearlyToman(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-teal-400">سقف‌های مصرف</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">حداکثر پزشک</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={maxDoctors}
                  onChange={(e) => setMaxDoctors(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">0 به معنی نامحدود</span>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">ویزیت در ماه</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={maxMonthlyAppointments}
                  onChange={(e) => setMaxMonthlyAppointments(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">0 به معنی نامحدود</span>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">سهمیه پیامک</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={monthlySmsQuota}
                  onChange={(e) => setMonthlySmsQuota(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">ترتیب نمایش</label>
            <input
              type="number"
              min="1"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-32 bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-700 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-lg shadow-teal-600/20 active:scale-95"
            >
              {isSubmitting ? 'در حال ثبت...' : plan ? 'ذخیره تغییرات' : 'ثبت پلن'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

