import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { services } from '../../../services';
import { queryKeys } from '../../../services/queryKeys';
import type { Appointment, CreateAppointmentInput } from '../../../domain/appointment';
import type { AppointmentStatus } from '../../../domain/appointmentStatus';
import type { AppointmentFilters } from '../../../services/repositories/IAppointmentRepository';
import { useAuth } from '../../../app/contexts';

export const useAppointments = (clinicId: string, filters?: AppointmentFilters) => {
  const { actor } = useAuth();

  return useQuery({
    queryKey: queryKeys.appointments.list(clinicId, filters as Record<string, unknown>),
    queryFn: () => services.appointmentRepo.getAppointments(clinicId, filters, actor || undefined),
  });
};

export const useTodayQueue = (clinicId: string, limit: number = 5) => {
  const { actor } = useAuth();

  return useQuery({
    queryKey: queryKeys.appointments.todayQueue(clinicId, actor?.userId),
    queryFn: () => services.appointmentRepo.getTodayQueue(clinicId, limit, actor || undefined),
  });
};

export const useUpdateAppointmentStatus = (clinicId: string) => {
  const queryClient = useQueryClient();
  const { actor } = useAuth();

  return useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: AppointmentStatus }) =>
      services.appointmentRepo.updateStatus(clinicId, id, newStatus, actor || undefined),

    // Optimistic Update
    onMutate: async ({ id, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.appointments.all(clinicId) });

      const snapshots: Array<{ key: QueryKey; data: Appointment[] }> = [];
      const cache = queryClient.getQueryCache().findAll({
        queryKey: queryKeys.appointments.all(clinicId),
      });

      for (const query of cache) {
        const data = query.state.data;
        if (Array.isArray(data)) {
          snapshots.push({ key: query.queryKey, data: data as Appointment[] });
          queryClient.setQueryData<Appointment[]>(
            query.queryKey,
            (data as Appointment[]).map((apt) =>
              apt.id === id ? { ...apt, status: newStatus } : apt
            )
          );
        }
      }

      return { snapshots };
    },

    // Rollback on error
    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(({ key, data }) => {
        queryClient.setQueryData(key, data);
      });
    },

    // Re-sync server/mock state
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all(clinicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary(clinicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.outbox(clinicId) });
    },
  });
};

export const useCreateAppointment = (clinicId: string) => {
  const queryClient = useQueryClient();
  const { actor } = useAuth();

  return useMutation({
    mutationFn: (input: CreateAppointmentInput) =>
      services.appointmentRepo.createAppointment(clinicId, input, actor || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all(clinicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary(clinicId) });
    },
  });
};
