import React from 'react';
import { useServices } from '../../catalog/hooks/useCatalog';
import { formatCurrency, formatDuration } from '../../../lib/format';
import { Clock, Check } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ErrorState } from '../../../components/common/ErrorState';

export interface StepServiceProps {
  clinicId: string;
  selectedServiceId: string;
  onSelectService: (id: string) => void;
}

export const StepService: React.FC<StepServiceProps> = ({
  clinicId,
  selectedServiceId,
  onSelectService,
}) => {
  const { data: services = [], isLoading, isError, refetch } = useServices(clinicId);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-neutral-900">
          انتخاب نوع خدمت
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          لطفاً خدمت مورد نظر خود را جهت دریافت نوبت انتخاب فرمایید.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((service) => {
            const isSelected = selectedServiceId === service.id;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => onSelectService(service.id)}
                aria-pressed={isSelected}
                className={`p-4 rounded-lg border text-right transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#0f766e] bg-teal-50/40 ring-1 ring-[#0f766e]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <span className="font-semibold text-neutral-900 text-sm">
                    {service.name}
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[#0f766e] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs w-full pt-2 border-t border-neutral-100">
                  <span className="flex items-center gap-1 text-neutral-500">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(service.duration)}
                  </span>
                  <span className="font-bold text-neutral-900">
                    {formatCurrency(service.price)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
