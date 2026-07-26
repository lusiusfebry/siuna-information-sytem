import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import inventoryOpnameService from '../services/api/inventory-opname.service';
import {
    InvOpnameSession,
    InvOpnameDetail,
    InvOpnameSerial,
    OpnameFilter,
    CreateOpnamePayload,
    UpsertOpnameDetailPayload,
    UpsertOpnameSerialPayload,
} from '../types/inventory';

type ApiError = AxiosError<{ message: string }>;

export const useOpnameList = (filters?: OpnameFilter) => {
    return useQuery({
        queryKey: ['inventoryOpname', filters],
        queryFn: () => inventoryOpnameService.listSessions(filters),
        placeholderData: keepPreviousData,
    });
};

export const useOpnameSession = (id: number) => {
    return useQuery({
        queryKey: ['inventoryOpname', id],
        queryFn: () => inventoryOpnameService.getSession(id),
        enabled: !!id,
    });
};

const invalidateOpname = (queryClient: ReturnType<typeof useQueryClient>, id?: number) => {
    queryClient.invalidateQueries({ queryKey: ['inventoryOpname'] });
    if (id) queryClient.invalidateQueries({ queryKey: ['inventoryOpname', id] });
};

export const useCreateOpname = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: InvOpnameSession }, ApiError, CreateOpnamePayload>({
        mutationFn: (data) => inventoryOpnameService.createSession(data),
        onSuccess: () => invalidateOpname(queryClient),
    });
};

export const useStartOpname = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: InvOpnameSession }, ApiError, number>({
        mutationFn: (id) => inventoryOpnameService.startSession(id),
        onSuccess: (_res, id) => invalidateOpname(queryClient, id),
    });
};

export const useUpsertOpnameDetail = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: InvOpnameDetail }, ApiError, { id: number; payload: UpsertOpnameDetailPayload }>({
        mutationFn: ({ id, payload }) => inventoryOpnameService.upsertDetail(id, payload),
        onSuccess: (_res, { id }) => invalidateOpname(queryClient, id),
    });
};

export const useUpsertOpnameSerial = () => {
    const queryClient = useQueryClient();
    return useMutation<
        { status: string; data: { serial: InvOpnameSerial; detail: InvOpnameDetail } },
        ApiError,
        { id: number; payload: UpsertOpnameSerialPayload }
    >({
        mutationFn: ({ id, payload }) => inventoryOpnameService.upsertSerial(id, payload),
        onSuccess: (_res, { id }) => invalidateOpname(queryClient, id),
    });
};

export const useFinishOpname = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: InvOpnameSession }, ApiError, number>({
        mutationFn: (id) => inventoryOpnameService.finishSession(id),
        onSuccess: (_res, id) => invalidateOpname(queryClient, id),
    });
};

// Approving generates an auto-approved Adjustment (sub_tipe 'Opname') for
// products with a non-zero selisih, so stock/transaksi caches must refresh too.
export const useApproveOpname = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: InvOpnameSession }, ApiError, number>({
        mutationFn: (id) => inventoryOpnameService.approveSession(id),
        onSuccess: (_res, id) => {
            invalidateOpname(queryClient, id);
            queryClient.invalidateQueries({ queryKey: ['inventoryStok'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryTransaksi'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryKartuStok'] });
        },
    });
};

export const useCancelOpname = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: InvOpnameSession }, ApiError, { id: number; reason: string }>({
        mutationFn: ({ id, reason }) => inventoryOpnameService.cancelSession(id, reason),
        onSuccess: (_res, { id }) => invalidateOpname(queryClient, id),
    });
};
