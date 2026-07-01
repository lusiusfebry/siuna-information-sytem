import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import facilityAssetService from '../services/api/facility-asset.service';
import { FacAsset, AssetPayload, AssetFilterParams } from '../types/facility';

export const useAssetList = (filters?: AssetFilterParams) => {
    return useQuery({
        queryKey: ['facilityAssets', filters],
        queryFn: () => facilityAssetService.getAll(filters),
        placeholderData: keepPreviousData,
    });
};

export const useAssetById = (id: number) => {
    return useQuery({
        queryKey: ['facilityAssets', id],
        queryFn: () => facilityAssetService.getOne(id),
        enabled: !!id,
    });
};

export const useCreateAsset = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: FacAsset }, AxiosError<{ message: string }>, AssetPayload>({
        mutationFn: (data: AssetPayload) => facilityAssetService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilityAssets'] });
            queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });
        },
    });
};

export const useUpdateAsset = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: FacAsset }, AxiosError<{ message: string }>, { id: number; data: Partial<AssetPayload> }>({
        mutationFn: ({ id, data }) => facilityAssetService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilityAssets'] });
            queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });
        },
    });
};

export const useWithdrawAsset = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: FacAsset }, AxiosError<{ message: string }>, { id: number; data?: { tanggal_penarikan?: string; keterangan?: string } }>({
        mutationFn: ({ id, data }) => facilityAssetService.withdraw(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilityAssets'] });
            queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });
        },
    });
};
