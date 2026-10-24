import React from 'react';
import { ButtonLink } from '../components/ui/ButtonLink';
import { Card } from '../components/ui/Card';
import { HelpCircle, ArrowRight } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-8 space-y-5">
        <div className="w-14 h-14 bg-neutral-100 text-neutral-600 rounded-full mx-auto flex items-center justify-center">
          <HelpCircle className="w-7 h-7" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            صفحه مورد نظر یافت نشد
          </h1>
          <p className="text-xs text-neutral-500 mt-2">
            آدرس وارد شده معتبر نمی‌باشد یا این صفحه حذف گردیده است.
          </p>
        </div>

        <div className="pt-2">
          <ButtonLink to="/" variant="primary" className="gap-2 mx-auto">
            <span>بازگشت به داشبورد اصلی</span>
            <ArrowRight className="w-4 h-4" />
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
};
