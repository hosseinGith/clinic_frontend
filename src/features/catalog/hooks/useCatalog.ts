import { useQuery } from '@tanstack/react-query';
import { services } from '../../../services';
import { queryKeys } from '../../../services/queryKeys';

export const useServices = (clinicId: string) => {
  return useQuery({
    queryKey: queryKeys.catalog.services(clinicId),
    queryFn: () => services.catalogRepo.getServices(clinicId),
  });
};

export const useDoctors = (clinicId: string) => {
  return useQuery({
    queryKey: queryKeys.catalog.doctors(clinicId),
    queryFn: () => services.catalogRepo.getDoctors(clinicId),
  });
};
