import React from 'react';
import { Card } from './Card';
import {
  Calendar,
  Flame,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  calendar: Calendar,
  flame: Flame,
  'alert-triangle': AlertTriangle,
  'message-circle': MessageCircle,
};

export interface StatCardProps {
  metric: {
    id: string;
    label: string;
    value: string | number;
    delta?: string;
    hint?: string;
    iconName?: 'calendar' | 'flame' | 'alert-triangle' | 'message-circle';
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ metric, className = '' }) => {
  const IconComponent = (metric.iconName && ICON_MAP[metric.iconName]) || Calendar;

  return (
    <Card className={`flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-medium text-neutral-500">
          {metric.label}
        </span>
        <div className="w-8 h-8 rounded-lg bg-teal-50/70 text-[#0f766e] flex items-center justify-center">
          <IconComponent className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-neutral-900 tracking-tight">
          {metric.value}
        </span>
      </div>

      {(metric.delta || metric.hint) && (
        <div className="mt-2 text-xs">
          {metric.delta && (
            <span className="text-[#0f766e] font-medium">
              {metric.delta}
            </span>
          )}
          {metric.hint && (
            <span className="text-neutral-500">
              {metric.hint}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
