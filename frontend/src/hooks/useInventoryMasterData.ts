import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import inventoryMasterDataService, { FilterParams } from '../services/api/inventory-master-data.service';
import { MasterData } from '../types/hr';
import { InvKategori, InvSubKategori, InvBrand, InvUom, InvProduk, InvGudang } from '../types/inventory';

export const useInventoryMasterDataList = <T = MasterData>(modelName: string, filters?: FilterParams) => {
    return useQuery({
        queryKey: ['inventoryMasterData', modelName, filters],
        queryFn: () => inventoryMasterDataService.getAll<T>(modelName, filters),
        placeholderData: keepPreviousData,
    });
};

export const useInventoryMasterDataById = <T = MasterData>(modelName: string, id: number) => {
    return useQuery({
        queryKey: ['inventoryMasterData', modelName, id],
        queryFn: () => inventoryMasterDataService.getOne<T>(modelName, id),
        enabled: !!id,
    });
};

export const useCreateInventoryMasterData = <T = MasterData>(modelName: string) => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: T }, AxiosError<{ message: string }>, Partial<T> | FormData>({
        mutationFn: (data: Partial<T> | FormData) => inventoryMasterDataService.create<T>(modelName, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryMasterData', modelName] });
        },
    });
};

export const useUpdateInventoryMasterData = <T = MasterData>(modelName: string) => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: T }, AxiosError<{ message: string }>, { id: number; data: Partial<T> | FormData }>({
        mutationFn: ({ id, data }: { id: number; data: Partial<T> | FormData }) => inventoryMasterDataService.update<T>(modelName, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryMasterData', modelName] });
        },
    });
};

export const useDeleteInventoryMasterData = (modelName: string) => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; message: string }, AxiosError<{ message: string }>, number>({
        mutationFn: (id: number) => inventoryMasterDataService.delete(modelName, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryMasterData', modelName] });
        },
    });
};

// Convenience hooks per entity
export const useInvKategoriList = (filters?: FilterParams) => useInventoryMasterDataList<InvKategori>('kategori', filters);
export const useInvSubKategoriList = (filters?: FilterParams) => useInventoryMasterDataList<InvSubKategori>('sub-kategori', filters);
export const useInvBrandList = (filters?: FilterParams) => useInventoryMasterDataList<InvBrand>('brand', filters);
export const useInvUomList = (filters?: FilterParams) => useInventoryMasterDataList<InvUom>('uom', filters);
export const useInvProdukList = (filters?: FilterParams) => useInventoryMasterDataList<InvProduk>('produk', filters);
export const useInvGudangList = (filters?: FilterParams) => useInventoryMasterDataList<InvGudang>('gudang', filters);
