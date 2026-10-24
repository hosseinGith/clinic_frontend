import React from 'react';
import type { DashboardNextAction } from '../../../domain/dashboard';
import { Card } from '../../../components/ui/Card';
import { ButtonLink } from '../../../components/ui/ButtonLink';
import { Sparkles, ArrowLeft } from 'lucide-react';

export interface NextActionsListProps {
  actions?: DashboardNextAction[];
  isLoading?: boolean;
}

const PRIORITY_BADGE = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-800 border-amber-200',
  low: 'bg-neutral-100 text-neutral-700 border-neutral-200',
};

const PRIORITY_LABEL = {
  high: 'اولویت بالا',
  medium: 'اولویت متوسط',
  low: 'اولویت عادی',
};

export const NextActionsList: React.FC<NextActionsListProps> = React.memo(({ actions = [] }) => {
  const getActionHref = (action: DashboardNextAction): string => {
    if (action.actionType === 'call_clients' || action.id === 'a1') {
      return '/clients?status=at_risk';
    }
    if (action.actionType === 'reply_leads' || action.id === 'a2') {
      return '/leads';
    }
    if (action.actionType === 'confirm_tomorrow' || action.id === 'a3') {
      return '/appointments?date=tomorrow&status=pending_confirmation';
    }
    return '/';
  };

  return (
    <Card className="p-0 overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:px-6 border-b border-neutral-200">
        <div className="flex items-center gap-1.5 text-base font-bold text-neutral-900">
          <Sparkles className="w-4 h-4 text-[#0f766e]" />
          <h2>اقدام پیشنهادی بعدی</h2>
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">
          بر اساس احتمال تبدیل و ارزش مالی
        </p>
      </div>

      {/* Action Cards */}
      <div className="divide-y divide-neutral-200">
        {actions.map((action) => {
          const badgeClass = PRIORITY_BADGE[action.priority];
          const badgeLabel = PRIORITY_LABEL[action.priority];
          const href = getActionHref(action);

          return (
            <div
              key={action.id}
              className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeClass}`}
                  >
                    {badgeLabel}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
                    {action.title}
                  </h3>
                </div>

                <p className="text-xs text-neutral-500">
                  {action.description}
                </p>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100 gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-[11px] text-neutral-400 block">
                    {action.valueLabel}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#0f766e]">
                    {action.value}
                  </span>
                </div>

                <ButtonLink
                  to={href}
                  size="sm"
                  variant="outline"
                  className="text-xs px-3 py-1.5 hover:border-[#0f766e] hover:text-[#0f766e]"
                >
                  <span>شروع اقدام</span>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                </ButtonLink>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
});
NextActionsList.displayName = 'NextActionsList';
