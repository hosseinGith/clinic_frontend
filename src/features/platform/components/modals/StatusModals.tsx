import React, { useState } from 'react';
import { useUpdateClinicStatus, useDeleteClinic } from '../../hooks/usePlatformClinics';
import type { PlatformClinicItem } from '../../../../services/repositories/IPlatformClinicRepository';
import {
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  RotateCcw,
  Trash2,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface StatusModalProps {
  clinic: PlatformClinicItem | null;
  targetStatus: 'active' | 'suspended' | 'deleted' | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const StatusTransitionModal: React.FC<StatusModalProps> = ({
  clinic,
  targetStatus,
  onClose,
  onSuccess,
}) => {
  const updateStatusMutation = useUpdateClinicStatus();
  const [error, setError] = useState<string | null>(null);

  if (!clinic || !targetStatus) return null;

  const isSuspend = targetStatus === 'suspended';
  const isRestore = targetStatus === 'active' && clinic.status === 'deleted';
  const isActivate = targetStatus === 'active' && clinic.status === 'suspended';
  const isSoftDelete = targetStatus === 'deleted';

  let title = 'تغییر وضعیت کلینیک';
  let confirmLabel = 'تأیید';
  let btnClass = 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-900/30';
  let Icon = CheckCircle2;
  let iconClass = 'text-teal-400 bg-teal-500/10 border-teal-500/20';

  if (isSuspend) {
    title = 'تعلیق کلینیک';
    confirmLabel = 'تأیید تعلیق کلینیک';
    btnClass = 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30';
    Icon = PauseCircle;
    iconClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  } else if (isActivate) {
    title = 'فعال‌سازی مجدد کلینیک';
    confirmLabel = 'فعال‌سازی کلینیک';
    btnClass = 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30';
    Icon = CheckCircle2;
    iconClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  } else if (isRestore) {
    title = 'بازیابی کلینیک حذف‌شده';
    confirmLabel = 'بازیابی و فعال‌سازی';
    btnClass = 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-900/30';
    Icon = RotateCcw;
    iconClass = 'text-teal-400 bg-teal-500/10 border-teal-500/20';
  } else if (isSoftDelete) {
    title = 'انتقال به سطل زباله (حذف نرم)';
    confirmLabel = 'انتقال به وضعیت حذف‌شده';
    btnClass = 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30';
    Icon = Trash2;
    iconClass = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  }

  const handleConfirm = async () => {
    setError(null);
    try {
      await updateStatusMutation.mutateAsync({ id: clinic.id, status: targetStatus });
      let msg = `وضعیت کلینیک «${clinic.name}» با موفقیت تغییر یافت.`;
      if (isSuspend) msg = `کلینیک «${clinic.name}» به حالت تعلیق درآمد و توکن‌های کاربران آن باطل شدند.`;
      if (isActivate) msg = `کلینیک «${clinic.name}» با موفقیت فعال گردید.`;
      if (isRestore) msg = `کلینیک «${clinic.name}» بازیابی و مجدداً فعال شد.`;
      if (isSoftDelete) msg = `کلینیک «${clinic.name}» به وضعیت حذف‌شده منتقل گردید.`;
      onSuccess(msg);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'خطا در تغییر وضعیت کلینیک.');
    }
  };

  return (
    <div
      className="fixed  !m-0 inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl w-full max-w-md p-6 shadow-2xl shadow-black/60 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <span className={`p-2.5 rounded-xl border ${iconClass}`}>
            <Icon className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <h3 className="text-base font-bold text-slate-100">
            {title}
          </h3>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="text-xs text-slate-300 space-y-3 mb-6 leading-relaxed">
          <p>
            آیا از تغییر وضعیت کلینیک <strong className="text-teal-400 font-semibold">{clinic.name}</strong> به حالت{' '}
            <strong className="text-slate-100 px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[11px]">{targetStatus}</strong> اطمینان دارید؟
          </p>
          {isSuspend && (
            <div className="text-amber-300 text-[11px] bg-amber-500/10 p-3 rounded-xl border border-amber-500/25 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>با تعلیق، نوبت‌دهی عمومی و ورود کلیه کاربران این کلینیک بلافاصله مسدود شده و توکن‌های فعال منقضی خواهند شد.</span>
            </div>
          )}
          {isSoftDelete && (
            <div className="text-rose-300 text-[11px] bg-rose-500/10 p-3 rounded-xl border border-rose-500/25 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>کلینیک از لیست پیش‌فرض مخفی خواهد شد اما اطلاعات آن برای امکان بازیابی حفظ می‌گردد.</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={updateStatusMutation.isPending}
            className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-xl text-xs transition-colors border border-slate-700/50"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={updateStatusMutation.isPending}
            className={`px-4 py-2 ${btnClass} rounded-xl text-xs font-semibold transition-all duration-150 disabled:opacity-50 shadow-lg inline-flex items-center gap-1.5`}
          >
            {updateStatusMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>در حال اعمال...</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface HardDeleteModalProps {
  clinic: PlatformClinicItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const HardDeleteClinicModal: React.FC<HardDeleteModalProps> = ({
  clinic,
  onClose,
  onSuccess,
}) => {
  const [typedSlug, setTypedSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const deleteMutation = useDeleteClinic();

  if (!clinic) return null;

  const isSlugMatched = typedSlug.trim() === clinic.slug;

  const handleHardDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSlugMatched) return;

    setError(null);
    try {
      await deleteMutation.mutateAsync({ id: clinic.id, confirmSlug: typedSlug.trim() });
      onSuccess(`کلینیک «${clinic.name}» و کلیه داده‌های آن با موفقیت به طور دائمی حذف گردیدند.`);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'خطا در حذف دائم کلینیک.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl shadow-rose-950/40 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 text-rose-400 mb-3">
          <span className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <ShieldAlert className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="font-bold text-base text-slate-100">تأیید حذف دائمی و قطعی کلینیک</h3>
            <span className="text-[11px] text-rose-400/80 font-medium">هشدار امنیتی: غیرقابل بازگشت</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          این عملیات کلینیک <strong className="text-rose-400 font-semibold">{clinic.name}</strong> و تمام نوبت‌ها،
          پزشکان، پرونده‌ها و سوابق آن را برای همیشه از پایگاه‌داده پاک می‌کند. این عمل <strong>غیرقابل بازگشت</strong> است.
        </p>

        <form onSubmit={handleHardDelete} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1.5 leading-relaxed">
              جهت فعال شدن دکمه حذف دائم، عبارت <span className="text-teal-400 font-mono font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{clinic.slug}</span> را عیناً تایپ کنید:
            </label>
            <input
              type="text"
              required
              placeholder={clinic.slug}
              value={typedSlug}
              onChange={(e) => setTypedSlug(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-rose-500/40 rounded-xl text-slate-100 font-mono text-left focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all placeholder-slate-600"
              dir="ltr"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-xl transition-colors border border-slate-700/50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={deleteMutation.isPending || !isSlugMatched}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-950/50 inline-flex items-center gap-1.5"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال حذف دائمی...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تأیید و حذف دائم</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

