import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import facilityWorkOrderService from '../services/api/facility-work-order.service';
import { FacWorkOrder, WorkOrderPayload, WorkOrderFilterParams } from '../types/facility';

export const useWorkOrderList = (filters?: WorkOrderFilterParams) => {
    return useQuery({
        queryKey: ['facilityWorkOrders', filters],
        queryFn: () => facilityWorkOrderService.getAll(filters),
        placeholderData: keepPreviousData,
    });
};

export const useWorkOrderById = (id: number) => {
    return useQuery({
        queryKey: ['facilityWorkOrders', id],
        queryFn: () => facilityWorkOrderService.getOne(id),
        enabled: !!id,
    });
};

export const useCreateWorkOrder = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: FacWorkOrder }, AxiosError<{ message: string }>, WorkOrderPayload>({
        mutationFn: (data: WorkOrderPayload) => facilityWorkOrderService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilityWorkOrders'] });
            queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });
        },
    });
};

export const useUpdateWorkOrder = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: FacWorkOrder }, AxiosError<{ message: string }>, { id: number; data: Partial<WorkOrderPayload> }>({
        mutationFn: ({ id, data }) => facilityWorkOrderService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilityWorkOrders'] });
            queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });
        },
    });
};
