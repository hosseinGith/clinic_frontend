import React, { useState } from 'react';
import { z } from 'zod';
import { isValidIranianMobile } from '../../../lib/phone';
import { formatCurrency, toPersianDigits } from '../../../lib/format';
import type { Service } from '../../../domain/service';
import type { Doctor } from '../../../domain/doctor';
import {
  User,
  Phone,
  FileText,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Check,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Captcha } from '../../../components/ui/Captcha';
import { services } from '../../../services';
import { useAuth } from '../../../app/contexts';
import { env } from '../../../config/env';

const bookingFormSchema = z.object({
  clientName: z.string().min(3, 'نام و نام خانوادگی باید حداقل 3 حرف باشد.'),
  clientPhone: z.string().refine((val) => isValidIranianMobile(val), {
    message: 'شماره تلفن همراه معتبر نمی‌باشد (فرمت 09123456789).',
  }),
  medicalNotes: z.string().optional(),
  notes: z.string().optional(),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;

export interface StepDetailsProps {
  service?: Service;
  doctor?: Doctor;
  time: string;
  verifiedPhone?: string | null;
  verificationToken?: string | null;
  onTokenVerified?: (phone: string, token: string) => void;
  onSubmit: (data: BookingFormData & { verificationToken: string; captchaToken: string }) => Promise<void>;
  isSubmitting?: boolean;
  submissionError?: string | null;
}

export const StepDetails: React.FC<StepDetailsProps> = ({
  service,
  doctor,
  time,
  verifiedPhone,
  verificationToken: initialToken,
  onTokenVerified,
  onSubmit,
  isSubmitting = false,
  submissionError,
}) => {
  const { user } = useAuth();

  const [clientName, setClientName] = useState(user?.name || '');
  const [clientPhone, setClientPhone] = useState(user?.phone || '');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);

  // OTP verification state (short-lived phone ownership verification)
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<BookingFormData | null>(null);
  const [internalToken, setInternalToken] = useState<string | null>(initialToken || null);

  // Captcha state
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  // Determine active verification token for current clientPhone
  const activeVerificationToken =
    verifiedPhone && verifiedPhone === clientPhone.trim() ? initialToken : internalToken;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isLocalSubmitting) return; // Prevent double submission
    setErrors({});

    const result = bookingFormSchema.safeParse({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      medicalNotes: medicalNotes.trim() || undefined,
      notes: undefined,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!isCaptchaVerified || !captchaToken) {
      setErrors({ captcha: 'لطفاً آزمون امنیتی (کپچا) را علامت بزنید.' });
      return;
    }

    // If phone has not yet been verified with a token, request OTP
    if (!activeVerificationToken) {
      setPendingFormData(result.data);
      setIsOtpLoading(true);
      setOtpError(null);
      try {
        await services.authRepo.requestOtp(result.data.clientPhone);
        setIsOtpModalOpen(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'خطا در ارسال کد تأیید.';
        setErrors({ clientPhone: msg });
      } finally {
        setIsOtpLoading(false);
      }
      return;
    }

    try {
      setIsLocalSubmitting(true);
      await onSubmit({ ...result.data, verificationToken: activeVerificationToken, captchaToken });
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  const handleVerifyOtpAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFormData || isSubmitting || isLocalSubmitting || isOtpLoading) return;
    setIsOtpLoading(true);
    setOtpError(null);

    try {
      const res = await services.authRepo.verifyPhoneOwnership(
        pendingFormData.clientPhone,
        otpCode.trim()
      );
      if (!res.success || !res.verificationToken) {
        setOtpError(res.error || 'کد تأیید اشتباه است.');
        return;
      }

      const token = res.verificationToken;
      setInternalToken(token);
      onTokenVerified?.(pendingFormData.clientPhone, token);
      setIsOtpModalOpen(false);
      setIsLocalSubmitting(true);
      await onSubmit({ ...pendingFormData, verificationToken: token, captchaToken });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در اعتبارسنجی کد تأیید.';
      setOtpError(msg);
    } finally {
      setIsOtpLoading(false);
      setIsLocalSubmitting(false);
    }
  };

  return (
    <>
      <form id="booking-details-form" onSubmit={handleSubmit} className="space-y-6">
        {submissionError && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{submissionError}</span>
          </div>
        )}

        {/* Booking Summary Box */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#0f766e]" />
            <span>خلاصه نوبت انتخابی</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-neutral-500 block">خدمت:</span>
              <span className="font-semibold text-neutral-900">{service?.name || '—'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">پزشک:</span>
              <span className="font-semibold text-neutral-900">{doctor?.name || '—'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">ساعت:</span>
              <span className="font-semibold text-neutral-900">{time || '—'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">مبلغ:</span>
              <span className="font-bold text-[#0f766e]">
                {service ? formatCurrency(service.price) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="clientName" className="block text-xs font-semibold text-neutral-800 mb-1.5">
              نام و نام خانوادگی مراجع <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute inset-y-0 right-3 my-auto pointer-events-none text-neutral-400" />
              <input
                id="clientName"
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="مثال: سارا محمدی"
                className={`w-full pr-9 pl-3 py-2 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0f766e] bg-white ${
                  errors.clientName ? 'border-rose-400' : 'border-neutral-300 focus:border-[#0f766e]'
                }`}
              />
            </div>
            {errors.clientName && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.clientName}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="clientPhone" className="block text-xs font-semibold text-neutral-800">
                شماره تلفن همراه <span className="text-rose-500">*</span>
              </label>
              {activeVerificationToken && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" />
                  شماره تأیید شده
                </span>
              )}
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 absolute inset-y-0 right-3 my-auto pointer-events-none text-neutral-400" />
              <input
                id="clientPhone"
                type="tel"
                required
                dir="ltr"
                value={clientPhone}
                onChange={(e) => {
                  setClientPhone(e.target.value);
                  setInternalToken(null);
                }}
                placeholder="09123456789"
                className={`w-full pr-9 pl-3 py-2 text-xs sm:text-sm text-right border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0f766e] bg-white ${
                  errors.clientPhone ? 'border-rose-400' : 'border-neutral-300 focus:border-[#0f766e]'
                }`}
              />
            </div>
            {errors.clientPhone ? (
              <p className="text-[11px] text-rose-600 mt-1">{errors.clientPhone}</p>
            ) : (
              <p className="text-[10px] text-neutral-400 mt-1">
                جهت جلوگیری از ثبت نوبت با شماره دیگران، کد تأیید پیامکی برای این شماره ارسال خواهد شد.
              </p>
            )}
          </div>

          {/* Sensitive Medical Notes (Optional) */}
          {/* TODO: Implement server-side at-rest encryption for medical notes in backend */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="medicalNotes" className="text-xs font-semibold text-neutral-800">
                سوابق و حساسیت‌های پزشکی (اختیاری)
              </label>
              <span className="text-[10px] text-neutral-500 flex items-center gap-1 bg-teal-50/70 text-[#0f766e] px-2 py-0.5 rounded border border-teal-200/50">
                <ShieldCheck className="w-3.5 h-3.5" />
                محرمانه — فقط پزشک معالج و مدیران مجاز کلینیک
              </span>
            </div>
            <div className="relative">
              <FileText className="w-4 h-4 absolute top-2.5 right-3 pointer-events-none text-neutral-400" />
              <textarea
                id="medicalNotes"
                rows={2}
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                placeholder="در صورت داشتن حساسیت دارویی، سابقه تزریق قبلی یا بیماری زمینه‌ای بنویسید..."
                className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e] bg-white"
              />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              اطلاعات و سوابق پزشکی شما محرمانه بوده و تنها برای پزشک معالج و مدیران مجاز کلینیک نمایش داده می‌شود (پرسنل پذیرش به این اطلاعات دسترسی ندارند).
            </p>
          </div>

          {/* Captcha Security Verification */}
          <Captcha
            verified={isCaptchaVerified}
            onVerify={(token: string) => {
              setCaptchaToken(token);
              setIsCaptchaVerified(true);
              setErrors((prev) => {
                const next = { ...prev };
                delete next.captcha;
                return next;
              });
            }}
            error={errors.captcha}
          />
        </div>
      </form>

      {/* OTP Verification Modal */}
      <Modal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        title="تأیید شماره تلفن همراه با کد یکبارمصرف"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleVerifyOtpAndProceed} className="space-y-4">
          <p className="text-xs text-neutral-600 leading-relaxed">
            کد تأیید 6 رقمی به شماره{' '}
            <strong className="font-mono text-neutral-900" dir="ltr">
              {toPersianDigits(pendingFormData?.clientPhone || clientPhone)}
            </strong>{' '}
            ارسال شد. لطفاً کد را وارد فرمایید:
          </p>

          {Boolean(import.meta.env.DEV && env.dataSource === 'mock') && (
            <div className="p-2 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs font-mono text-center">
              کد آزمایشی (Dev Mock): 123456
            </div>
          )}

          {otpError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          <div>
            <label htmlFor="otpCodeBooking" className="block text-xs font-semibold text-neutral-800 mb-1">
              کد تأیید 6 رقمی <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute inset-y-0 right-3 my-auto pointer-events-none text-neutral-400" />
              <input
                id="otpCodeBooking"
                type="text"
                dir="ltr"
                required
                autoFocus
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full pr-9 pl-3 py-2 text-center tracking-[0.25em] font-mono text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#0f766e]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsOtpModalOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isOtpLoading || otpCode.length < 6}
            >
              {isOtpLoading ? 'در حال بررسی...' : 'تأیید و ثبت نوبت'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
