import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { services } from '../../../services';
import { queryKeys } from '../../../services/queryKeys';
import type { BookingSubmissionInput } from '../../../services/repositories/IBookingRepository';

export const useAvailableSlots = (params: {
  clinicId: string;
  doctorId: string;
  serviceId: string;
  date: string;
}) => {
  const { clinicId, doctorId, serviceId, date } = params;

  return useQuery({
    queryKey: queryKeys.booking.slots(clinicId, doctorId, serviceId, date),
    queryFn: () => services.bookingRepo.getAvailableSlots(params),
    enabled: Boolean(clinicId && doctorId && serviceId && date),
  });
};

export const useSubmitBooking = (clinicId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BookingSubmissionInput) =>
      services.bookingRepo.submitBooking(input),
    onSuccess: () => {
      // Immediate invalidation so new appointment appears on the reception dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all(clinicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.todayQueue(clinicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary(clinicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.outbox(clinicId) });
    },
  });
};
