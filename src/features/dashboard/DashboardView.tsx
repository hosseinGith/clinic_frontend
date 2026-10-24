import React, { useState, useCallback } from 'react';
import { useClinic } from '../../app/contexts';
import { useDashboardSummary, useNextActions } from './hooks/useDashboard';
import { useTodayQueue, useUpdateAppointmentStatus } from '../appointments/hooks/useAppointments';
import { useAutomations, useAutomationStats, useSetAutomationEnabled } from '../automations/hooks/useAutomations';

import { DashboardMetricsBar } from './components/DashboardMetricsBar';
import { TodayAppointmentsQueue } from './components/TodayAppointmentsQueue';
import { AutomationsStatusPanel } from './components/AutomationsStatusPanel';
import { NextActionsList } from './components/NextActionsList';
import { ManualAppointmentModal } from './components/ManualAppointmentModal';

import { Button } from '../../components/ui/Button';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { ErrorState } from '../../components/common/ErrorState';
import { Card } from '../../components/ui/Card';
import { Can } from '../../components/auth/Can';
import { ExternalLink, Plus } from 'lucide-react';
import type { AppointmentStatus } from '../../domain/appointmentStatus';

export const DashboardView: React.FC = () => {
  const { clinic, clinicId } = useClinic();
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useDashboardSummary(clinicId);
  const {
    data: queue = [],
    isLoading: isQueueLoading,
    isError: isQueueError,
    refetch: refetchQueue,
  } = useTodayQueue(clinicId, 5);
  const {
    data: automations = [],
    isLoading: isAutomationsLoading,
    isError: isAutomationsError,
    refetch: refetchAutomations,
  } = useAutomations(clinicId);
  const { data: stats } = useAutomationStats(clinicId);
  const {
    data: nextActions = [],
    isLoading: isActionsLoading,
    isError: isActionsError,
    refetch: refetchActions,
  } = useNextActions(clinicId);

  const updateStatusMutation = useUpdateAppointmentStatus(clinicId);
  const toggleAutomationMutation = useSetAutomationEnabled(clinicId);

  const handleUpdateStatus = useCallback(
    (id: string, newStatus: AppointmentStatus) => {
      updateStatusMutation.mutate({ id, newStatus });
    },
    [updateStatusMutation]
  );

  const handleToggleAutomation = useCallback(
    (id: string, enabled: boolean) => {
      toggleAutomationMutation.mutate({ id, enabled });
    },
    [toggleAutomationMutation]
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#0f766e] tracking-wide block">
            فضای عملیاتی کلینیک
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight mt-0.5">
            داشبورد
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            تصویر زنده فروش، نوبت و پیگیری
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <ButtonLink
            to={`/book/${clinic.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="md"
            className="text-xs sm:text-sm gap-1.5"
          >
            <span>لینک رزرو مشتری</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </ButtonLink>

          <Can permission="appointments:create">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsManualModalOpen(true)}
              className="text-xs sm:text-sm gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت نوبت</span>
            </Button>
          </Can>
        </div>
      </div>

      {/* 1. Metrics Bar (4 StatCards) */}
      {isSummaryError ? (
        <Card className="p-4">
          <ErrorState onRetry={() => refetchSummary()} />
        </Card>
      ) : (
        <DashboardMetricsBar
          metrics={summary?.metrics}
          isLoading={isSummaryLoading}
        />
      )}

      {/* 2. Today's Appointments Queue Table (5 upcoming appointments) */}
      {isQueueError ? (
        <Card className="p-4">
          <ErrorState onRetry={() => refetchQueue()} />
        </Card>
      ) : (
        <TodayAppointmentsQueue
          appointments={queue}
          isLoading={isQueueLoading}
          onUpdateStatus={handleUpdateStatus}
          isUpdating={updateStatusMutation.isPending}
        />
      )}

      {/* 3 & 4. Automations and Next Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {isAutomationsError ? (
          <Card className="p-4">
            <ErrorState onRetry={() => refetchAutomations()} />
          </Card>
        ) : (
          <AutomationsStatusPanel
            automations={automations}
            stats={stats}
            isLoading={isAutomationsLoading}
            onToggleEnabled={handleToggleAutomation}
            isToggling={toggleAutomationMutation.isPending}
          />
        )}

        {isActionsError ? (
          <Card className="p-4">
            <ErrorState onRetry={() => refetchActions()} />
          </Card>
        ) : (
          <NextActionsList
            actions={nextActions}
            isLoading={isActionsLoading}
          />
        )}
      </div>

      {/* Manual Appointment Booking Modal */}
      {isManualModalOpen && (
        <ManualAppointmentModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          clinicId={clinicId}
        />
      )}
    </div>
  );
};
