import React from 'react';
import { StatCard } from '../../../components/ui/StatCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { DashboardMetric } from '../../../domain/dashboard';

export interface DashboardMetricsBarProps {
  metrics?: DashboardMetric[];
  isLoading?: boolean;
}

export const DashboardMetricsBar: React.FC<DashboardMetricsBarProps> = React.memo(({
  metrics,
  isLoading,
}) => {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section aria-label="شاخص‌های کلیدی عملیات" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <StatCard key={metric.id} metric={metric} />
        ))}
      </div>
    </section>
  );
});
DashboardMetricsBar.displayName = 'DashboardMetricsBar';
