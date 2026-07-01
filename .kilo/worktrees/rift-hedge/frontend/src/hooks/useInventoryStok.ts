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
        },
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
