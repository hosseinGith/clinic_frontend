import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Phone,
  KeyRound,
  AlertCircle,
  Info,
  ArrowRight,
  RotateCw,
} from 'lucide-react';
import { usePlatformAuth } from './context/PlatformAuthContext';
import { toPersianDigits } from '../../lib/format';

export const PlatformLoginView: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(120);
  const [canResend, setCanResend] = useState<boolean>(false);

  const { sendOtp, verifyOtp, isAuthenticated } = usePlatformAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in as super_admin, navigate immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/platform', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (step !== 'otp' || timer <= 0) {
      if (timer <= 0) setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [step, timer]);

  const validatePhone = (value: string): boolean => {
    const clean = value.trim();
    return /^09\d{9}$/.test(clean);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim();
    if (!validatePhone(cleanPhone)) {
      setError('شماره موبایل وارد شده معتبر نمی‌باشد (فرمت صحیح: 09xxxxxxxxx).');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(cleanPhone);
      if (res.success) {
        setStep('otp');
        setTimer(120);
        setCanResend(false);
        setInfoMessage('در صورت صحت شماره موبایل مدیر پلتفرم، کد یک‌بارمصرف ارسال گردید.');
      }
    } catch (err: any) {
      if (err?.status === 429) {
        setError(err.message || 'حساب کاربری موقتاً به دلیل تلاش‌های مکرر قفل شده است. لطفاً 15 دقیقه دیگر تلاش فرمایید.');
      } else {
        setError(err?.message || 'خطا در برقراری ارتباط با سامانه پلتفرم.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim();
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setError('کد تأیید باید دقیقاً 6 رقم عدد باشد.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(phone.trim(), cleanCode);
      if (res?.token) {
        const from = (location.state as any)?.from?.pathname || '/platform';
        navigate(from, { replace: true });
      } else {
        setError('کد تأیید نامعتبر است یا منقضی شده است.');
      }
    } catch (err: any) {
      if (err?.status === 429) {
        setError(err.message || 'حساب کاربری موقتاً به دلیل تلاش‌های ناموفق قفل گردیده است.');
      } else if (err?.status === 401) {
        setError('کد وارد شده نامعتبر است یا منقضی شده است.');
      } else {
        setError(err?.message || 'ورود ناموفق بود. لطفاً مجدداً تلاش فرمایید.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden" dir="rtl">
      {/* Background glow decoration */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/70 border border-slate-800/80 rounded-3xl p-8 shadow-2xl shadow-black/50 backdrop-blur-xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4 shadow-lg shadow-teal-500/10">
            <ShieldCheck className="w-7 h-7" strokeWidth={1.75} />
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">ورود به پنل سوپرادمین MedFlow</h1>
          <p className="text-xs text-slate-400 mt-1.5">سامانه اختصاصی مدیریت کلان پلتفرم و مستأجران</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" strokeWidth={1.75} />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <Info className="w-4 h-4 text-teal-400 shrink-0" strokeWidth={1.75} />
            <span className="leading-relaxed">{infoMessage}</span>
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="super-admin-phone" className="block text-xs font-medium text-slate-300 mb-1.5">
                شماره موبایل مدیر ارشد
              </label>
              <div className="relative">
                <input
                  id="super-admin-phone"
                  type="tel"
                  placeholder="09120000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all pl-10"
                  dir="ltr"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" strokeWidth={1.75} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !phone}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-50 shadow-lg shadow-teal-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>در حال ارسال کد...</span>
                </>
              ) : (
                <>
                  <span>ارسال کد یک‌بارمصرف (OTP)</span>
                  <ArrowRight className="w-4 h-4 rotate-180" strokeWidth={1.75} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="super-admin-code" className="block text-xs font-medium text-slate-300 mb-1.5">
                کد 6 رقمی تأیید
              </label>
              <div className="relative">
                <input
                  id="super-admin-code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-base text-slate-100 text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-50 shadow-lg shadow-teal-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>در حال اعتبارسنجی...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" strokeWidth={1.75} />
                  <span>ورود به پنل پلتفرم</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setError(null);
                }}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>ویرایش شماره</span>
              </button>

              {canResend ? (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={loading}
                  className="flex items-center gap-1 text-teal-400 hover:text-teal-300 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>ارسال مجدد کد</span>
                </button>
              ) : (
                <span className="text-slate-500 font-mono text-[11px]">
                  ارسال مجدد تا {toPersianDigits(timer)} ثانیه دیگر
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

