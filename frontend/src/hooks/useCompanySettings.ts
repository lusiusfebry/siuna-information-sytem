import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import companySettingsService from '../services/api/company-settings.service';
import type { CompanySettings } from '../services/api/company-settings.service';

export const useCompanySettings = () => {
    return useQuery({
        queryKey: ['company-settings'],
        queryFn: companySettingsService.getSettings,
        staleTime: 30 * 60 * 1000,
    });
};

export const useUpdateCompanySettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<CompanySettings>) => companySettingsService.updateSettings(data),
        onSuccess: (data) => {
            queryClient.setQueryData(['company-settings'], data);
        },
    });
};

export const useUploadCompanyLogo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => companySettingsService.uploadLogo(file),
        onSuccess: (data) => {
            queryClient.setQueryData(['company-settings'], data);
        },
    });
};
