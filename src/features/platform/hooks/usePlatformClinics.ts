import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { services } from '../../../services';
import { queryKeys } from '../../../services/queryKeys';
import type {
  PlatformClinicsListQuery,
  CreateClinicPayload,
  UpdateClinicPayload,
  ClinicStatus,
} from '../../../services/repositories/IPlatformClinicRepository';

export const useClinicsSummary = () => {
  return useQuery({
    queryKey: queryKeys.platform.summary(),
    queryFn: () => services.platformClinicRepo.getSummary(),
    staleTime: 60 * 1000,
  });
};

export const usePlatformClinicsList = (query: PlatformClinicsListQuery = {}) => {
  return useQuery({
    queryKey: queryKeys.platform.clinics(query as Record<string, unknown>),
    queryFn: () => services.platformClinicRepo.listClinics(query),
    staleTime: 30 * 1000,
  });
};

export const usePlatformClinicDetails = (id: string | undefined) => {
  return useQuery({
    queryKey: id ? queryKeys.platform.clinicDetail(id) : ['platform', 'clinics', 'detail', 'none'],
    queryFn: () => {
      if (!id) throw new Error('Clinic ID is required');
      return services.platformClinicRepo.getClinic(id);
    },
    enabled: Boolean(id),
  });
};

export const useCreateClinic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClinicPayload) => services.platformClinicRepo.createClinic(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.summary() });
      queryClient.invalidateQueries({ queryKey: ['platform', 'clinics'] });
    },
  });
};

export const useUpdateClinic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateClinicPayload }) =>
      services.platformClinicRepo.updateClinic(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.clinicDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['platform', 'clinics'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.summary() });
    },
  });
};

export const useUpdateClinicStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ClinicStatus }) =>
      services.platformClinicRepo.updateClinicStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.clinicDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['platform', 'clinics'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.summary() });
    },
  });
};

export const useDeleteClinic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, confirmSlug }: { id: string; confirmSlug: string }) =>
      services.platformClinicRepo.deleteClinic(id, confirmSlug),
    onSuccess: (_data, variables) => {
      queryClient.removeQueries({ queryKey: queryKeys.platform.clinicDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['platform', 'clinics'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.summary() });
    },
  });
};

// --- Clinic Doctors Hooks ---

export const useClinicDoctors = (clinicId: string | undefined) => {
  return useQuery({
    queryKey: ['platform', 'clinics', clinicId, 'doctors'],
    queryFn: () => {
      if (!clinicId) throw new Error('Clinic ID is required');
      return services.platformClinicRepo.getDoctors(clinicId);
    },
    enabled: Boolean(clinicId),
  });
};

export const useCreateClinicDoctor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clinicId, payload }: { clinicId: string; payload: any }) =>
      services.platformClinicRepo.createDoctor(clinicId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'clinics', variables.clinicId, 'doctors'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.clinicDetail(variables.clinicId) });
    },
  });
};

export const useUpdateClinicDoctor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clinicId, doctorId, payload }: { clinicId: string; doctorId: string; payload: any }) =>
      services.platformClinicRepo.updateDoctor(clinicId, doctorId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'clinics', variables.clinicId, 'doctors'] });
    },
  });
};

export const useDeleteClinicDoctor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clinicId, doctorId }: { clinicId: string; doctorId: string }) =>
      services.platformClinicRepo.deleteDoctor(clinicId, doctorId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'clinics', variables.clinicId, 'doctors'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.clinicDetail(variables.clinicId) });
    },
  });
};

// --- Clinic Services Hooks ---

export const useClinicServices = (clinicId: string | undefined) => {
  return useQuery({
    queryKey: ['platform', 'clinics', clinicId, 'services'],
    queryFn: () => {
      if (!clinicId) throw new Error('Clinic ID is required');
      return services.platformClinicRepo.getServices(clinicId);
    },
    enabled: Boolean(clinicId),
  });
};

export const useCreateClinicService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clinicId, payload }: { clinicId: string; payload: any }) =>
      services.platformClinicRepo.createService(clinicId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'clinics', variables.clinicId, 'services'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.clinicDetail(variables.clinicId) });
    },
  });
};

export const useUpdateClinicService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clinicId, serviceId, payload }: { clinicId: string; serviceId: string; payload: any }) =>
      services.platformClinicRepo.updateService(clinicId, serviceId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'clinics', variables.clinicId, 'services'] });
    },
  });
};

export const useDeleteClinicService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clinicId, serviceId }: { clinicId: string; serviceId: string }) =>
      services.platformClinicRepo.deleteService(clinicId, serviceId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'clinics', variables.clinicId, 'services'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.clinicDetail(variables.clinicId) });
    },
  });
};

// --- Clinic Holidays Hooks ---

export const useClinicHolidays = (clinicId: string | undefined, doctorId?: string) => {
  return useQuery({
    queryKey: ['platform', 'clinics', clinicId, 'holidays', doctorId || 'all'],
    queryFn: () => {
      if (!clinicId) throw new Error('Clinic ID is required');
      return services.platformClinicRepo.getHolidays(clinicId, doctorId);
    },
    enabled: Boolean(clinicId),
  });
};

export const useCreateClinicHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clinicId, payload }: { clinicId: string; payload: any }) =>
      services.platformClinicRepo.createHoliday(clinicId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'clinics', variables.clinicId, 'holidays'] });
    },
  });
};

export const useDeleteClinicHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clinicId, holidayId }: { clinicId: string; holidayId: string }) =>
      services.platformClinicRepo.deleteHoliday(clinicId, holidayId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'clinics', variables.clinicId, 'holidays'] });
    },
  });
};
