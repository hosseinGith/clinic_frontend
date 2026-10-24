import { useQuery } from '@tanstack/react-query';
import { services } from '../../../services';
import { queryKeys } from '../../../services/queryKeys';

export const useClients = (clinicId: string, search?: string) => {
  return useQuery({
    queryKey: queryKeys.clients.all(clinicId, search),
    queryFn: () => services.clientRepo.getClients(clinicId, search),
  });
};

export const useAtRiskClients = (clinicId: string) => {
  return useQuery({
    queryKey: queryKeys.clients.atRisk(clinicId),
    queryFn: () => services.clientRepo.getAtRiskClients(clinicId),
  });
};
