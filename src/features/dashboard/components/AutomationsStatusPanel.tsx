import React from 'react';
import type { Automation, AutomationStats } from '../../../domain/automation';
import { Card } from '../../../components/ui/Card';
import { toPersianDigits } from '../../../lib/format';
import { Zap, Clock } from 'lucide-react';
import { Can } from '../../../components/auth/Can';

export interface AutomationsStatusPanelProps {
  automations?: Automation[];
  stats?: AutomationStats;
  isLoading?: boolean;
  onToggleEnabled?: (id: string, enabled: boolean) => void;
  isToggling?: boolean;
}

export const AutomationsStatusPanel: React.FC<AutomationsStatusPanelProps> = React.memo(({
  automations = [],
  stats,
  onToggleEnabled,
  isToggling = false,
}) => {
  const isAllHealthy = automations.length > 0 && automations.every((a) => a.healthy);
  const totalActions = stats?.totalActions ?? automations.reduce((sum, a) => sum + (a.totalTriggered || 0), 0);
  const hoursSaved = stats?.hoursSaved ?? Math.round((totalActions * 4) / 60);

  return (
    <Card className="p-0 overflow-hidden flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="p-5 sm:px-6 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              وضعیت اتوماسیونها
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              فعالیتهایی که بدون دخالت منشی انجام میشوند
            </p>
          </div>

          {isAllHealthy ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-[#0f766e]">
              <span className="w-2 h-2 rounded-full bg-[#0f766e]" />
              <span>سالم</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>نیازمند بررسی</span>
            </div>
          )}
        </div>

        {/* Rows */}
        <div className="divide-y divide-neutral-200">
          {automations.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:px-6 flex items-center justify-between hover:bg-neutral-50/50 transition-colors"
            >
              <div>
                <div className="text-xs sm:text-sm font-semibold text-neutral-900">
                  {item.title}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  کانال: {item.channel}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs font-medium">
                  {item.healthy ? (
                    <span className="inline-flex items-center gap-1 text-xs text-[#0f766e] bg-teal-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0f766e]" />
                      <span>سالم</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span>خطا</span>
                    </span>
                  )}
                </div>

                <Can permission="settings:manage">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.enabled}
                    onClick={() => onToggleEnabled?.(item.id, !item.enabled)}
                    disabled={isToggling}
                    title={item.enabled ? 'غیرفعال‌سازی اتوماسیون' : 'فعال‌سازی اتوماسیون'}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                      item.enabled ? 'bg-[#0f766e] justify-start' : 'bg-neutral-300 justify-end'
                    }`}
                  >
                    <span className="h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-all" />
                  </button>
                </Can>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Summary Footer */}
      <div className="p-4 sm:px-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#0f766e]" />
          <span>
            <strong className="font-bold text-neutral-900">
              {toPersianDigits(totalActions)}
            </strong>{' '}
            اقدام خودکار
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#0f766e]" />
          <span>
            <strong className="font-bold text-neutral-900">
              {toPersianDigits(hoursSaved)}
            </strong>{' '}
            ساعت زمان ذخیرهشده
          </span>
        </div>
      </div>
    </Card>
  );
});
AutomationsStatusPanel.displayName = 'AutomationsStatusPanel';

