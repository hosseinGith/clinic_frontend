import { useQuery } from '@tanstack/react-query';
import { services } from '../../../services';
import { queryKeys } from '../../../services/queryKeys';

export const useDashboardSummary = (clinicId: string) => {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(clinicId),
    queryFn: () => services.dashboardRepo.getSummary(clinicId),
  });
};

export const useNextActions = (clinicId: string) => {
  return useQuery({
    queryKey: queryKeys.dashboard.nextActions(clinicId),
    queryFn: () => services.dashboardRepo.getNextActions(clinicId),
  });
};
