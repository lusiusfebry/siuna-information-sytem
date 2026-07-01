import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import facilityMasterDataService from '../services/api/facility-master-data.service';
import { MasterData } from '../types/hr';
import { FacilityFilterParams, FacBuilding, FacRoomType, FacRoom, FacMaintenanceCategory } from '../types/facility';

export const useFacilityMasterDataList = <T = MasterData>(modelName: string, filters?: FacilityFilterParams) => {
    return useQuery({
        queryKey: ['facilityMasterData', modelName, filters],
        queryFn: () => facilityMasterDataService.getAll<T>(modelName, filters),
        placeholderData: keepPreviousData,
    });
};

export const useFacilityMasterDataById = <T = MasterData>(modelName: string, id: number) => {
    return useQuery({
        queryKey: ['facilityMasterData', modelName, id],
        queryFn: () => facilityMasterDataService.getOne<T>(modelName, id),
        enabled: !!id,
    });
};

export const useCreateFacilityMasterData = <T = MasterData>(modelName: string) => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: T }, AxiosError<{ message: string }>, Partial<T>>({
        mutationFn: (data: Partial<T>) => facilityMasterDataService.create<T>(modelName, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilityMasterData', modelName] });
        },
    });
};

export const useUpdateFacilityMasterData = <T = MasterData>(modelName: string) => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: T }, AxiosError<{ message: string }>, { id: number; data: Partial<T> }>({
        mutationFn: ({ id, data }: { id: number; data: Partial<T> }) => facilityMasterDataService.update<T>(modelName, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilityMasterData', modelName] });
        },
    });
};

export const useDeleteFacilityMasterData = (modelName: string) => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; message: string }, AxiosError<{ message: string }>, number>({
        mutationFn: (id: number) => facilityMasterDataService.delete(modelName, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilityMasterData', modelName] });
        },
    });
};

export const useRestoreFacilityMasterData = <T = MasterData>(modelName: string) => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: T }, AxiosError<{ message: string }>, number>({
        mutationFn: (id: number) => facilityMasterDataService.restore<T>(modelName, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilityMasterData', modelName] });
        },
    });
};

// Convenience hooks per entity
export const useFacBuildingList = (filters?: FacilityFilterParams) => useFacilityMasterDataList<FacBuilding>('building', filters);
export const useFacRoomTypeList = (filters?: FacilityFilterParams) => useFacilityMasterDataList<FacRoomType>('room-type', filters);
export const useFacRoomList = (filters?: FacilityFilterParams) => useFacilityMasterDataList<FacRoom>('room', filters);
export const useFacMaintenanceCategoryList = (filters?: FacilityFilterParams) => useFacilityMasterDataList<FacMaintenanceCategory>('maintenance-category', filters);
