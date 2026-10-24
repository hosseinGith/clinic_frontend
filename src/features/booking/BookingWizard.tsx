import React, { useState } from 'react';
import { useServices, useDoctors } from '../catalog/hooks/useCatalog';
import { useSubmitBooking } from './hooks/useBooking';
import { StepService } from './steps/StepService';
import { StepDoctor } from './steps/StepDoctor';
import { StepTime } from './steps/StepTime';
import { StepDetails } from './steps/StepDetails';
import type { BookingFormData } from './steps/StepDetails';
import { BookingConfirmation } from './BookingConfirmation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getTodayDateString } from '../../lib/jalali';
import type { Appointment } from '../../domain/appointment';
import { getBillingErrorMessage } from '../../utils/billingErrors';
import { ArrowRight, ArrowLeft, Check, Lock } from 'lucide-react';

export interface BookingWizardProps {
  clinicId: string;
}

const STEPS = [
  { id: 1, title: 'خدمت' },
  { id: 2, title: 'پزشک' },
  { id: 3, title: 'زمان' },
  { id: 4, title: 'مشخصات' },
];

export const BookingWizard: React.FC<BookingWizardProps> = ({ clinicId }) => {
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(() => getTodayDateString());
  const [time, setTime] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const [confirmedData, setConfirmedData] = useState<{
    appointment: Appointment;
    trackingCode: string;
  } | null>(null);

  const [conflictError, setConflictError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const { data: services = [] } = useServices(clinicId);
  const { data: doctors = [] } = useDoctors(clinicId);
  const submitBookingMutation = useSubmitBooking(clinicId);

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  const canProceed = (() => {
    if (step === 1) return Boolean(serviceId);
    if (step === 2) return Boolean(doctorId);
    if (step === 3) return Boolean(date && time);
    return true;
  })();

  const handleNext = () => {
    if (step < 4 && canProceed) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmitForm = async (
    formData: BookingFormData & { verificationToken: string; captchaToken: string }
  ) => {
    setSubmissionError(null);
    setConflictError(null);

    try {
      const res = await submitBookingMutation.mutateAsync({
        clinicId,
        serviceId,
        doctorId,
        date,
        time,
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        notes: formData.notes,
        medicalNotes: formData.medicalNotes,
        verificationToken: formData.verificationToken,
        captchaToken: formData.captchaToken,
      });

      setConfirmedData(res);
    } catch (err: unknown) {
      const errMsg = getBillingErrorMessage(err);
      if (errMsg.includes('رزرو شد') || errMsg.includes('تداخل')) {
        setConflictError(errMsg);
        setStep(3); // Send user back to time selection without resetting token
      } else {
        setSubmissionError(errMsg);
      }
    }
  };

  const handleBookAnother = () => {
    setConfirmedData(null);
    setStep(1);
    setServiceId('');
    setDoctorId('');
    setTime('');
    setDate(getTodayDateString());
    setVerifiedPhone(null);
    setVerificationToken(null);
    setConflictError(null);
    setSubmissionError(null);
  };

  if (confirmedData) {
    return (
      <BookingConfirmation
        appointment={confirmedData.appointment}
        trackingCode={confirmedData.trackingCode}
        onBookAnother={handleBookAnother}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-6">
        {/* Stepper Header */}
        <div className="pb-5 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => {
              const isCompleted = step > s.id;
              const isCurrent = step === s.id;

              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCompleted
                          ? 'bg-[#0f766e] text-white'
                          : isCurrent
                          ? 'bg-[#0f766e] text-white ring-4 ring-teal-50'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.id}
                    </div>
                    <span
                      className={`text-[11px] sm:text-xs mt-1.5 font-medium ${
                        isCurrent
                          ? 'text-neutral-900 font-bold'
                          : isCompleted
                          ? 'text-[#0f766e]'
                          : 'text-neutral-400'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>

                  {idx < STEPS.length - 1 && (
                    <div
                      className={`h-[2px] flex-1 -mt-5 transition-colors duration-300 ease-out ${
                        step > s.id ? 'bg-[#0f766e]' : 'bg-neutral-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Contents */}
        <div className="min-h-[290px]">
          {step === 1 && (
            <StepService
              clinicId={clinicId}
              selectedServiceId={serviceId}
              onSelectService={setServiceId}
            />
          )}

          {step === 2 && (
            <StepDoctor
              clinicId={clinicId}
              selectedDoctorId={doctorId}
              onSelectDoctor={setDoctorId}
            />
          )}

          {step === 3 && (
            <StepTime
              clinicId={clinicId}
              doctorId={doctorId}
              serviceId={serviceId}
              selectedDate={date}
              selectedTime={time}
              onSelectDate={setDate}
              onSelectTime={setTime}
              conflictError={conflictError}
            />
          )}

          {step === 4 && (
            <StepDetails
              service={selectedService}
              doctor={selectedDoctor}
              time={time}
              verifiedPhone={verifiedPhone}
              verificationToken={verificationToken}
              onTokenVerified={(phone, token) => {
                setVerifiedPhone(phone);
                setVerificationToken(token);
              }}
              onSubmit={handleSubmitForm}
              isSubmitting={submitBookingMutation.isPending}
              submissionError={submissionError}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handlePrev}
                className="gap-1.5 text-xs sm:text-sm"
              >
                <ArrowRight className="w-4 h-4" />
                <span>مرحله قبلی</span>
              </Button>
            )}
          </div>

          <div>
            {step < 4 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
                disabled={!canProceed}
                className="gap-1.5 text-xs sm:text-sm"
              >
                <span>مرحله بعدی</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                form="booking-details-form"
                variant="primary"
                size="md"
                disabled={submitBookingMutation.isPending}
                className="text-xs sm:text-sm px-6"
              >
                {submitBookingMutation.isPending ? 'در حال ثبت نوبت...' : 'ثبت درخواست نوبت'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Privacy Notice below wizard */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 py-2">
        <Lock className="w-3.5 h-3.5 text-[#0f766e]" />
        <span>اطلاعات شما فقط برای هماهنگی همین درخواست استفاده می‌شود.</span>
      </div>
    </div>
  );
};
