import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { z } from 'zod';
import { Phone, KeyRound, ArrowLeft, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../app/contexts';
import { isValidIranianMobile, normalizePhoneNumber } from '../../lib/phone';
import { toPersianDigits } from '../../lib/format';
import { SEED_USERS } from '../../mocks/seed';

import { can } from '../../domain/permissions';
import type { Role } from '../../domain/session';
import { env } from '../../config/env';

const phoneSchema = z.string().refine((val) => isValidIranianMobile(val), {
  message: 'شماره تلفن همراه معتبر نمی‌باشد (فرمت 0912...).',
});

const otpSchema = z.string().regex(/^\d{6}$/, {
  message: 'کد تأیید باید یک عدد 6 رقمی باشد.',
});

function isRouteAllowedForRole(pathname: string, userRole: Role): boolean {
  if (pathname === '/me') return userRole === 'patient';
  if (pathname === '/doctor') return userRole === 'doctor';
  if (pathname === '/settings/audit-logs') return can(userRole, 'audit:read');
  if (pathname === '/settings/users') return can(userRole, 'users:manage');
  if (pathname.startsWith('/settings')) return can(userRole, 'settings:manage');
  if (pathname.startsWith('/reports')) return can(userRole, 'reports:read');
  if (pathname.startsWith('/marketing')) return can(userRole, 'marketing:manage');
  if (pathname.startsWith('/messages')) return can(userRole, 'messages:read');
  if (pathname.startsWith('/leads')) return can(userRole, 'leads:read');
  if (pathname.startsWith('/clients')) return can(userRole, 'clients:read');
  if (pathname.startsWith('/appointments') || pathname === '/') {
    return can(userRole, 'appointments:read');
  }
  return true;
}

function getDefaultLandingForRole(userRole: Role): string {
  if (userRole === 'doctor') return '/doctor';
  if (userRole === 'patient') return '/me';
  return '/';
}

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestOtp, verifyOtp, isAuthenticated, role } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(120);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && role) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      const targetPath =
        from && from !== '/login' && isRouteAllowedForRole(from, role)
          ? from
          : getDefaultLandingForRole(role);
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, role, navigate, location.state]);

  // Timer countdown
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parseResult = phoneSchema.safeParse(phone);
    if (!parseResult.success) {
      setError(parseResult.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestOtp(phone);
      if (res.success) {
        setStep('otp');
        setCountdown(res.expiresInSeconds || 120);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ارسال کد تأیید.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parseResult = otpSchema.safeParse(otpCode.trim());
    if (!parseResult.success) {
      setError(parseResult.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyOtp(phone, otpCode.trim());
      if (!res.success) {
        setError(res.error || 'کد تأیید اشتباه است.');
      } else if (res.session?.user) {
        const userRole = res.session.user.role;
        const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
        const targetPath =
          from && from !== '/login' && isRouteAllowedForRole(from, userRole)
            ? from
            : getDefaultLandingForRole(userRole);
        navigate(targetPath, { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در اعتبارسنجی کد.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await requestOtp(phone);
      if (res.success) {
        setCountdown(res.expiresInSeconds || 120);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ارسال مجدد کد.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillSampleUser = (samplePhone: string) => {
    setPhone(samplePhone);
    setError(null);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${toPersianDigits(mins)}:${toPersianDigits(String(secs).padStart(2, '0'))}`;
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#0f766e] text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md shadow-teal-900/10 mb-3">
          M
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
          ورود به سامانه‌ی مدفلو
        </h2>
        <p className="mt-1.5 text-xs text-neutral-500">
          سیستم رشد و مدیریت عملیات کلینیک زیبایی آریانا
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="p-6 sm:p-8 space-y-6 shadow-sm border-neutral-200">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="phoneInput"
                  className="block text-xs font-semibold text-neutral-800 mb-1.5"
                >
                  شماره تلفن همراه <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute inset-y-0 right-3 my-auto pointer-events-none text-neutral-400" />
                  <input
                    id="phoneInput"
                    type="tel"
                    dir="ltr"
                    required
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full pr-9 pl-3 py-2.5 text-xs sm:text-sm text-right border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e] bg-white transition-colors"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5">
                  کد تأیید 6 رقمی یکبار مصرف به این شماره پیامک خواهد شد.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <span>در حال ارسال کد...</span>
                ) : (
                  <>
                    <span>دریافت کد ورود</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">
                  ارسال شده به: <strong className="text-neutral-800 font-mono" dir="ltr">{toPersianDigits(normalizePhoneNumber(phone))}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setError(null);
                  }}
                  className="text-[#0f766e] hover:underline font-medium text-[11px]"
                >
                  ویرایش شماره
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="otpInput"
                    className="block text-xs font-semibold text-neutral-800"
                  >
                    کد تأیید 6 رقمی <span className="text-rose-500">*</span>
                  </label>
                  {Boolean(import.meta.env.DEV && env.dataSource === 'mock') && (
                    <span className="text-[10px] bg-teal-50 text-[#0f766e] font-mono px-2 py-0.5 rounded border border-teal-200">
                      کد تستی: 123456
                    </span>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute inset-y-0 right-3 my-auto pointer-events-none text-neutral-400" />
                  <input
                    id="otpInput"
                    type="text"
                    dir="ltr"
                    required
                    autoFocus
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full pr-9 pl-3 py-2.5 text-center tracking-[0.3em] font-mono text-sm sm:text-base border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e] bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                {countdown > 0 ? (
                  <span className="text-neutral-500">
                    امکان ارسال مجدد تا {formatCountdown(countdown)} دیگر
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-[#0f766e] font-medium flex items-center gap-1 hover:underline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>ارسال مجدد کد تأیید</span>
                  </button>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <span>در حال اعتبارسنجی...</span>
                ) : (
                  <>
                    <span>ورود به سامانه</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Quick Account Switcher for Demo / Dev */}
          {Boolean(import.meta.env.DEV && env.dataSource === 'mock') && (
            <div className="pt-4 border-t border-neutral-200 space-y-2.5">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-600">
                <Sparkles className="w-3.5 h-3.5 text-[#0f766e]" />
                <span>انتخاب سریع حساب‌های تستی (شبیه‌ساز نقش‌ها):</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {SEED_USERS.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => fillSampleUser(u.phone)}
                    className="text-right p-2 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-teal-300 transition-colors"
                  >
                    <span className="font-semibold text-neutral-800 block truncate">
                      {u.name}
                    </span>
                    <span className="text-[10px] text-neutral-500 block truncate">
                      {u.roleTitle} ({toPersianDigits(u.phone)})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Public Booking Link */}
        <div className="mt-4 text-center">
          <Link
            to="/book/ariana"
            className="text-xs text-neutral-600 hover:text-[#0f766e] inline-flex items-center gap-1 font-medium transition-colors"
          >
            <span>صفحه عمومی ثبت نوبت آنلاین مراجعان</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
