import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'خطا در بارگذاری اطلاعات',
  message = 'مشکلی در برقراری ارتباط رخ داده است. لطفاً دوباره تلاش نمایید.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-8 text-center flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
        <p className="text-xs text-neutral-500 max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5 text-xs mt-2">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>تلاش مجدد</span>
        </Button>
      )}
    </div>
  );
};
