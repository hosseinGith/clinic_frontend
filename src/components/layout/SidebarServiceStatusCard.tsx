import React from 'react';
import { Link } from 'react-router-dom';
import { useSidebarServiceStatus } from '../../integrations/registry';
import { Radio } from 'lucide-react';
import { Can } from '../auth/Can';

export const SidebarServiceStatusCard: React.FC = () => {
  const status = useSidebarServiceStatus();

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs space-y-2">
      <div className="flex items-center justify-between text-neutral-500 font-medium">
        <span className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-[#0f766e]" />
          وضعیت سرویس‌ها
        </span>
        <Can permission="settings:manage">
          <Link
            to="/settings"
            className="text-[#0f766e] hover:underline text-[11px]"
          >
            تنظیمات
          </Link>
        </Can>
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-neutral-700">{status.bookingStatusText}</span>
          <span
            className={`w-2 h-2 rounded-full ${status.bookingActive ? 'bg-emerald-500' : 'bg-rose-500'}`}
            title={status.bookingActive ? 'فعال' : 'غیرفعال'}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-500">{status.smsStatusText}</span>
          <span
            className={`w-2 h-2 rounded-full ${status.smsConnected ? 'bg-emerald-500' : 'bg-amber-400'}`}
            title={status.smsConnected ? 'متصل' : 'غیرفعال'}
          />
        </div>
      </div>
    </div>
  );
};
