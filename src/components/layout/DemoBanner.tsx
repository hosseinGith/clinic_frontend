import React, { useState } from 'react';
import { X } from 'lucide-react';
import { env } from '../../config/env';

const DISMISS_KEY = 'medflow_demo_banner_dismissed';

export const DemoBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  });

  if (env.dataSource !== 'mock' || dismissed) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 px-4 py-1.5 text-center text-xs font-medium tracking-tight flex items-center justify-center gap-3">
      <span>نسخه‌ی نمایشی — داده‌ها فقط در مرورگر شما ذخیره می‌شوند.</span>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, '1');
          setDismissed(true);
        }}
        className="p-0.5 rounded hover:bg-amber-500/20 text-amber-900/70 hover:text-amber-900"
        aria-label="بستن پیام نسخه نمایشی"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
