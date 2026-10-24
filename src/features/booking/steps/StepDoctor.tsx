import React from 'react';
import { useDoctors } from '../../catalog/hooks/useCatalog';
import { User, Check } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ErrorState } from '../../../components/common/ErrorState';

export interface StepDoctorProps {
  clinicId: string;
  selectedDoctorId: string;
  onSelectDoctor: (id: string) => void;
}

export const StepDoctor: React.FC<StepDoctorProps> = ({
  clinicId,
  selectedDoctorId,
  onSelectDoctor,
}) => {
  const { data: doctors = [], isLoading, isError, refetch } = useDoctors(clinicId);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-neutral-900">
          انتخاب پزشک متخصص
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          پزشک مورد نظر خود را برای انجام مشاوره و درمان مشخص نمایید.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {doctors.map((doctor) => {
            const isSelected = selectedDoctorId === doctor.id;
            return (
              <button
                key={doctor.id}
                type="button"
                onClick={() => onSelectDoctor(doctor.id)}
                aria-pressed={isSelected}
                className={`p-4 rounded-lg border text-right transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-[#0f766e] bg-teal-50/40 ring-1 ring-[#0f766e]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900 text-sm">
                      {doctor.name}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {doctor.specialty}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-[#0f766e] text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
