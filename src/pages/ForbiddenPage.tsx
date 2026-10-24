import React from 'react';
import { ShieldAlert, ArrowRight, Home } from 'lucide-react';
import { ButtonLink } from '../components/ui/ButtonLink';
import { useAuth } from '../app/contexts';

export const ForbiddenPage: React.FC = () => {
  const { role, user } = useAuth();

  const getHomeRoute = () => {
    if (role === 'doctor') return '/doctor';
    if (role === 'patient') return '/me';
    return '/';
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
            خطای 403 — عدم دسترسی
          </span>
          <h1 className="text-xl font-bold text-neutral-900 mt-2">
            دسترسی به این بخش مجاز نمی‌باشد
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed">
            کاربر گرامی {user?.name || ''}، نقش شما ({user?.roleTitle || role || 'مهمان'}) مجوزهای امنیتی لازم برای مشاهده یا ویرایش این بخش از سامانه مدفلو را ندارد.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <ButtonLink to={getHomeRoute()} variant="primary" size="md" className="w-full sm:w-auto flex items-center justify-center gap-1.5">
            <Home className="w-4 h-4" />
            <span>بازگشت به پنل اصلی</span>
          </ButtonLink>
          <ButtonLink to="/login" variant="outline" size="md" className="w-full sm:w-auto flex items-center justify-center gap-1.5">
            <span>ورود با حساب دیگر</span>
            <ArrowRight className="w-4 h-4" />
          </ButtonLink>
        </div>
      </div>
    </div>
  );
};
