import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import inventoryStokService from '../services/api/inventory-stok.service';
import {
    InvTransaksi,
    TransaksiPayload,
    StokFilter,
    TransaksiFilter,
    SerialNumberFilter,
    KartuStokFilter,
    LaporanKonsumsiFilter,
} from '../types/inventory';

export const useStokList = (filters?: StokFilter) => {
    return useQuery({
        queryKey: ['inventoryStok', filters],
        queryFn: () => inventoryStokService.getStok(filters),
        placeholderData: keepPreviousData,
    });
};

export const useSerialNumberList = (filters?: SerialNumberFilter) => {
    return useQuery({
        queryKey: ['inventorySerialNumbers', filters],
        queryFn: () => inventoryStokService.getSerialNumbers(filters),
        placeholderData: keepPreviousData,
    });
};

export const useCreateTransaksi = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: InvTransaksi }, AxiosError<{ message: string }>, TransaksiPayload>({
        mutationFn: (data: TransaksiPayload) => inventoryStokService.createTransaksi(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryStok'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryTransaksi'] });
            queryClient.invalidateQueries({ queryKey: ['inventorySerialNumbers'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryKartuStok'] });
            queryClient.invalidateQueries({ queryKey: ['facilityInventory'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryLaporanKonsumsi'] });
        },
    });
};

const invalidateTransaksiCaches = (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: ['inventoryStok'] });
    queryClient.invalidateQueries({ queryKey: ['inventoryTransaksi'] });
    queryClient.invalidateQueries({ queryKey: ['inventorySerialNumbers'] });
    queryClient.invalidateQueries({ queryKey: ['inventoryKartuStok'] });
    queryClient.invalidateQueries({ queryKey: ['facilityInventory'] });
    queryClient.invalidateQueries({ queryKey: ['inventoryLaporanKonsumsi'] });
};

// INV-N07: approving replays the deferred stock/serial effects, so it must
// invalidate the same caches as create.
export const useApproveTransaksi = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: InvTransaksi }, AxiosError<{ message: string }>, number>({
        mutationFn: (id: number) => inventoryStokService.approveTransaksi(id),
        onSuccess: () => invalidateTransaksiCaches(queryClient),
    });
};

// Rejecting applies no stock effects, so only the transaction lists need refreshing.
export const useRejectTransaksi = () => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: InvTransaksi }, AxiosError<{ message: string }>, { id: number; reason?: string }>({
        mutationFn: ({ id, reason }) => inventoryStokService.rejectTransaksi(id, reason),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventoryTransaksi'] }),
    });
};

export const useTransaksiList = (filters?: TransaksiFilter) => {
    return useQuery({
        queryKey: ['inventoryTransaksi', filters],
        queryFn: () => inventoryStokService.getTransaksiList(filters),
        placeholderData: keepPreviousData,
    });
};

export const useTransaksiDetail = (id: number) => {
    return useQuery({
        queryKey: ['inventoryTransaksi', id],
        queryFn: () => inventoryStokService.getTransaksiDetail(id),
        enabled: !!id,
    });
};

export const useKartuStok = (filters: KartuStokFilter) => {
    return useQuery({
        queryKey: ['inventoryKartuStok', filters],
        queryFn: () => inventoryStokService.getKartuStok(filters),
        placeholderData: keepPreviousData,
        enabled: !!filters.produk_id,
    });
};

export const useLaporanKonsumsi = (filters?: LaporanKonsumsiFilter) => {
    return useQuery({
        queryKey: ['inventoryLaporanKonsumsi', filters],
        queryFn: () => inventoryStokService.getLaporanKonsumsi(filters),
        placeholderData: keepPreviousData,
    });
};

export const useFacilityInventory = (buildingId: number) => {
    return useQuery({
        queryKey: ['facilityInventory', buildingId],
        queryFn: () => inventoryStokService.getFacilityInventory(buildingId),
        enabled: !!buildingId,
    });
};
