import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { services } from '../../../services';
import { queryKeys } from '../../../services/queryKeys';

export const useAutomations = (clinicId: string) => {
  return useQuery({
    queryKey: queryKeys.automations.all(clinicId),
    queryFn: () => services.automationRepo.getAutomations(clinicId),
  });
};

export const useAutomationStats = (clinicId: string) => {
  return useQuery({
    queryKey: queryKeys.automations.stats(clinicId),
    queryFn: () => services.automationRepo.getStats(clinicId),
  });
};

export const useSetAutomationEnabled = (clinicId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      services.automationRepo.setEnabled(clinicId, id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.automations.all(clinicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.automations.stats(clinicId) });
    },
  });
};
