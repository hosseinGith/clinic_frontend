import { useQuery } from '@tanstack/react-query';
import { services } from '../../../services';
import { queryKeys } from '../../../services/queryKeys';

export const useOutboxMessages = (clinicId: string) => {
  return useQuery({
    queryKey: queryKeys.messages.outbox(clinicId),
    queryFn: () => services.messageRepo.getOutboxMessages(clinicId),
  });
};
