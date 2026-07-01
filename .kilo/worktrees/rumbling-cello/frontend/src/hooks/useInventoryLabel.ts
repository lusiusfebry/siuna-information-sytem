import { useQuery, useMutation } from '@tanstack/react-query';
import inventoryLabelService from '../services/api/inventory-label.service';
import type { PrintLabelPayload } from '../services/api/inventory-label.service';

export const useProductQR = (produkId: number) => {
    return useQuery({
        queryKey: ['inventoryLabel', 'produk', produkId],
        queryFn: () => inventoryLabelService.getProductQR(produkId),
        enabled: !!produkId,
    });
};

export const useSerialNumberQR = (snId: number) => {
    return useQuery({
        queryKey: ['inventoryLabel', 'sn', snId],
        queryFn: () => inventoryLabelService.getSerialNumberQR(snId),
        enabled: !!snId,
    });
};

export const useAssetTagQR = (tagId: number) => {
    return useQuery({
        queryKey: ['inventoryLabel', 'asset-tag', tagId],
        queryFn: () => inventoryLabelService.getAssetTagQR(tagId),
        enabled: !!tagId,
    });
};

export const usePrintLabels = () => {
    return useMutation({
        mutationFn: (payload: PrintLabelPayload) =>
            inventoryLabelService.printLabels(payload),
    });
};

export const useLookupQR = (code: string) => {
    return useQuery({
        queryKey: ['inventoryLabel', 'lookup', code],
        queryFn: () => inventoryLabelService.lookupQR(code),
        enabled: !!code,
    });
};
