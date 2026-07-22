import { useCreateTransaksi } from './useInventoryStok';
import { TransaksiPayload, TransaksiDetailPayload } from '../types/inventory';
import { ReturSelection } from '../components/inventory/ReturAssetPicker';

export const useReturKaryawan = () => {
    const createMutation = useCreateTransaksi();

    const submitRetur = async (sel: ReturSelection, tanggal: string, catatan?: string): Promise<{ id: number } | null> => {
        // Every unit must carry its product's uom_id (the Masuk path writes it into
        // inv_stok). A product without a UOM would send 0 → reject early with a clear
        // message instead of a generic backend validation error.
        const tanpaUom = sel.items.find(i => !i.uom_id || i.uom_id <= 0);
        if (tanpaUom) {
            throw new Error(`Produk pada unit "${tanpaUom.identifier}" belum memiliki satuan (UOM). Lengkapi UOM produk sebelum retur.`);
        }

        // Group selected units by product → one detail line per product.
        // uom_id is taken from the unit (its product's uom) — REQUIRED positive value.
        const byProduct = new Map<number, { uom_id: number; ids: string[] }>();
        for (const item of sel.items) {
            const entry = byProduct.get(item.produk_id) || { uom_id: item.uom_id, ids: [] };
            entry.ids.push(item.identifier);
            byProduct.set(item.produk_id, entry);
        }
        const details: TransaksiDetailPayload[] = Array.from(byProduct.entries()).map(([produk_id, { uom_id, ids }]) => ({
            produk_id,
            uom_id,
            jumlah: ids.length,
            serial_numbers: ids,
        }));

        const payload: TransaksiPayload = {
            tipe: 'Masuk',
            sub_tipe: 'Retur Karyawan',
            tanggal,
            gudang_id: sel.gudang_id,
            karyawan_id: sel.karyawan_id,
            catatan: catatan || null,
            details,
        };

        const result = await createMutation.mutateAsync(payload);
        return result.data?.id ? { id: result.data.id } : null;
    };

    return { submitRetur, isPending: createMutation.isPending };
};
