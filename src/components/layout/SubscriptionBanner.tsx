import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../app/contexts';
import { services } from '../../services';
import { subscriptionQueryKeys } from '../../services/queryKeys';
import { toPersianDigits } from '../../utils/toPersianDigits';
import { AlertTriangle, Clock, AlertCircle } from 'lucide-react';

export const SubscriptionBanner: React.FC = () => {
  const { role, isAuthenticated } = useAuth();

  // Banner only visible for clinic owners & admins
  const canSeeBanner = isAuthenticated && (role === 'owner' || role === 'admin');

  const { data: usageData } = useQuery({
    queryKey: subscriptionQueryKeys.me(),
    queryFn: () => services.subscriptionRepo.getMySubscription(),
    enabled: canSeeBanner,
    staleTime: 60_000,
  });

  if (!canSeeBanner || !usageData || !usageData.subscription) {
    return null;
  }

  const { subscription } = usageData;
  const status = subscription.status;

  // Calculate days remaining in period
  const endTimestamp = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).getTime()
    : null;
  const now = Date.now();
  const diffDays = endTimestamp ? Math.ceil((endTimestamp - now) / 86400000) : 999;

  // Conditions
  const isExpired = status === 'expired' || (diffDays <= 0 && status !== 'active');
  const isPastDue = status === 'past_due';
  const isExpiringSoon = status === 'active' && diffDays > 0 && diffDays <= 7;

  if (!isExpired && !isPastDue && !isExpiringSoon) {
    return null;
  }

  let bgClass = 'bg-amber-500 text-amber-950 border-amber-600';
  let icon = <Clock className="w-4 h-4 shrink-0 text-amber-950" />;
  let message = '';

  if (isExpired) {
    bgClass = 'bg-rose-600 text-white border-rose-700';
    icon = <AlertCircle className="w-4 h-4 shrink-0 text-white" />;
    message = 'مهلت اشتراک کلینیک شما به پایان رسیده است. دسترسی به امکانات ثبت نوبت و پزشکان محدود گردیده است.';
  } else if (isPastDue) {
    bgClass = 'bg-amber-600 text-white border-amber-700';
    icon = <AlertTriangle className="w-4 h-4 shrink-0 text-white" />;
    message = 'اشتراک کلینیک به وضعیت معوقه (past_due) تغییر کرده است. لطفاً نسبت به تسویه فاکتور اقدام نمایید.';
  } else if (isExpiringSoon) {
    bgClass = 'bg-amber-50 text-amber-800 border-amber-300';
    icon = <Clock className="w-4 h-4 shrink-0 text-amber-600" />;
    message = `تنها ${toPersianDigits(diffDays)} روز تا پایان دوره اشتراک کلینیک باقی مانده است.`;
  }

  return (
    <div
      role="alert"
      id="clinic-subscription-banner"
      className={`border-b px-4 py-2.5 text-xs font-medium flex items-center justify-between gap-3 ${bgClass}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{message}</span>
      </div>

      <Link
        to="/settings/subscription"
        className="px-3 py-1 rounded bg-black/10 hover:bg-black/20 text-inherit font-bold text-[11px] whitespace-nowrap transition-colors"
      >
        مشاهده اشتراک و فاکتورها ←
      </Link>
    </div>
  );
};
