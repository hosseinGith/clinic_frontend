import React, { useState } from 'react';
import { useCreateClinic } from '../../hooks/usePlatformClinics';
import type { PlatformClinicItem, PlatformClinicOwner } from '../../../../services/repositories/IPlatformClinicRepository';
import {
  Building2,
  X,
  AlertCircle,
  User,
  Phone,
  Clock,
  MapPin,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface CreateClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (clinic: PlatformClinicItem, owner: PlatformClinicOwner) => void;
}

const RESERVED_SLUGS = [
  'api',
  'platform',
  'admin',
  'auth',
  'public',
  'login',
  'register',
  'health',
  'docs',
  'booking',
];

export const CreateClinicModal: React.FC<CreateClinicModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const createMutation = useCreateClinic();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanSlug = slug.trim().toLowerCase();
    const cleanPhone = ownerPhone.trim();

    // Slug format validation
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      setFormError('شناسه انگلیسی (slug) باید فقط شامل حروف کوچک انگلیسی، اعداد و خط تیره (-) باشد.');
      return;
    }

    if (RESERVED_SLUGS.includes(cleanSlug)) {
      setFormError(`شناسه «${cleanSlug}» جزو کلمات رزروشده سامانه است و مجاز نمی‌باشد.`);
      return;
    }

    // Iranian mobile validation
    if (!/^09\d{9}$/.test(cleanPhone)) {
      setFormError('شماره موبایل مدیر کلینیک نامعتبر است (فرمت مجاز: 09xxxxxxxxx).');
      return;
    }

    try {
      const res = await createMutation.mutateAsync({
        slug: cleanSlug,
        name: name.trim(),
        tagline: tagline.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        workingHours: workingHours.trim() || undefined,
        ownerName: ownerName.trim(),
        ownerPhone: cleanPhone,
      });

      onSuccess(res.clinic, res.owner);
    } catch (err: any) {
      setFormError(err?.message || 'خطا در ثبت کلینیک در پلتفرم.');
    }
  };

  return (
    <div
      className="fixed !m-0 inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-create-title"
    >
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl w-full max-w-lg p-6 shadow-2xl shadow-black/60 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Building2 className="w-4 h-4" strokeWidth={1.75} />
            </span>
            <div>
              <h2 id="modal-create-title" className="text-sm font-bold text-slate-100">
                ثبت و راه‌اندازی کلینیک جدید
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">افزودن مستأجر سازمانی به همراه اشتراک آزمایشی 14 روزه</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">شناسه انگلیسی (slug) *</label>
              <input
                type="text"
                required
                placeholder="shafa-clinic"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 font-mono text-left focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all placeholder-slate-600"
                dir="ltr"
              />
              <p className="text-[10px] text-slate-500 mt-1">شناسه یکتا در آدرس اینترنتی (غیرقابل تغییر)</p>
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-medium">نام کلینیک *</label>
              <input
                type="text"
                required
                placeholder="کلینیک تخصصی شفا"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all placeholder-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">شعار یا تگ‌لاین کلینیک</label>
            <input
              type="text"
              placeholder="پیشرو در ارائه خدمات پوست و زیبایی"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all placeholder-slate-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>تلفن کلینیک</span>
              </label>
              <input
                type="text"
                placeholder="02188884321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>ساعات کاری</span>
              </label>
              <input
                type="text"
                placeholder="شنبه تا پنجشنبه 9 تا 20"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all placeholder-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>آدرس کلینیک</span>
            </label>
            <textarea
              rows={2}
              placeholder="تهران، خیابان ولیعصر..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none placeholder-slate-600"
            />
          </div>

          <div className="border-t border-slate-800 pt-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span>مشخصات مدیر کلینیک (Clinic Owner)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">نام و نام خانوادگی *</label>
                <input
                  type="text"
                  required
                  placeholder="دکتر مسعود رضایی"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">شماره موبایل مدیر (ورود) *</label>
                <input
                  type="tel"
                  required
                  placeholder="09121110001"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 text-left font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all placeholder-slate-600"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-xl transition-colors border border-slate-700/50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium transition-all duration-150 disabled:opacity-50 shadow-lg shadow-teal-900/30 inline-flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال ثبت...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ثبت و راه‌اندازی کلینیک</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

