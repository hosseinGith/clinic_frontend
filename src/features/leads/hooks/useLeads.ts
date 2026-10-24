import { useQuery } from '@tanstack/react-query';
import { services } from '../../../services';
import { queryKeys } from '../../../services/queryKeys';

export const useLeads = (clinicId: string) => {
  return useQuery({
    queryKey: queryKeys.leads.all(clinicId),
    queryFn: () => services.leadRepo.getLeads(clinicId),
  });
};

export const useHotLeads = (clinicId: string) => {
  return useQuery({
    queryKey: queryKeys.leads.hot(clinicId),
    queryFn: () => services.leadRepo.getHotLeads(clinicId),
  });
};
