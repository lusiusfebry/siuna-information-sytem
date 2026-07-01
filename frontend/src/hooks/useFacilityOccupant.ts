import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import facilityOccupantService from '../services/api/facility-occupant.service';
import { FacOccupant, OccupantPayload, OccupantFilterParams } from '../types/facility';

export const useOccupantList = (filters?: OccupantFilterParams) => {
    return useQuery({
        queryKey: ['facilityOccupants', filters],
        queryFn: () => facilityOccupantService.getAll(filters),
        placeholderData: keepPreviousData,
    });
};

export const useOccupantById = (id: number) => {
    return useQuery({
        queryKey: ['facilityOccupants', id],
        queryFn: () => facilityOccupantService.getOne(id),
        enabled: !!id,
    });
};

export const useCreateOccupant = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: FacOccupant }, AxiosError<{ message: string }>, OccupantPayload>({
        mutationFn: (data: OccupantPayload) => facilityOccupantService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilityOccupants'] });
            queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });
        },
    });
};

export const useUpdateOccupant = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: FacOccupant }, AxiosError<{ message: string }>, { id: number; data: Partial<OccupantPayload> }>({
        mutationFn: ({ id, data }) => facilityOccupantService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilityOccupants'] });
            queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });
        },
    });
};

export const useCheckoutOccupant = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: FacOccupant }, AxiosError<{ message: string }>, { id: number; data?: { tanggal_keluar?: string; keterangan?: string } }>({
        mutationFn: ({ id, data }) => facilityOccupantService.checkout(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilityOccupants'] });
            queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });
        },
    });
};
