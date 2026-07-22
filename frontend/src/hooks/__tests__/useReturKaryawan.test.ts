import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { useReturKaryawan } from '../useReturKaryawan';
import type { ReturSelection } from '../../components/inventory/ReturAssetPicker';

const mutateAsync = vi.fn();

vi.mock('../useInventoryStok', () => ({
    useCreateTransaksi: () => ({ mutateAsync, isPending: false }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
    const qc = new QueryClient();
    return React.createElement(QueryClientProvider, { client: qc }, children);
};

const sel = (items: ReturSelection['items']): ReturSelection => ({
    karyawan_id: 5, karyawan_nama: 'Triyanto', gudang_id: 1, items,
});

describe('useReturKaryawan.submitRetur', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mutateAsync.mockResolvedValue({ status: 'success', data: { id: 99 } });
    });

    it('builds a Retur Karyawan Masuk payload, grouping units by product', async () => {
        const { result } = renderHook(() => useReturKaryawan(), { wrapper });
        await result.current.submitRetur(sel([
            { serial_number_id: 9, produk_id: 3, uom_id: 7, identifier: 'SN-1' },
            { serial_number_id: 10, produk_id: 3, uom_id: 7, identifier: 'SN-2' },
            { serial_number_id: 11, produk_id: 4, uom_id: 8, identifier: 'SN-3' },
        ]), '2026-07-22', 'catatan');

        const payload = mutateAsync.mock.calls[0][0];
        expect(payload).toMatchObject({ tipe: 'Masuk', sub_tipe: 'Retur Karyawan', karyawan_id: 5, gudang_id: 1 });
        // product 3 → one detail line, jumlah 2, both serials; product 4 → separate line.
        expect(payload.details).toEqual([
            { produk_id: 3, uom_id: 7, jumlah: 2, serial_numbers: ['SN-1', 'SN-2'] },
            { produk_id: 4, uom_id: 8, jumlah: 1, serial_numbers: ['SN-3'] },
        ]);
    });

    it('returns the new transaksi id', async () => {
        const { result } = renderHook(() => useReturKaryawan(), { wrapper });
        const res = await result.current.submitRetur(
            sel([{ serial_number_id: 9, produk_id: 3, uom_id: 7, identifier: 'SN-1' }]),
            '2026-07-22',
        );
        expect(res).toEqual({ id: 99 });
    });

    it('rejects a unit whose product has no uom_id instead of sending 0', async () => {
        const { result } = renderHook(() => useReturKaryawan(), { wrapper });
        await expect(result.current.submitRetur(
            sel([{ serial_number_id: 9, produk_id: 3, uom_id: 0, identifier: 'SN-1' }]),
            '2026-07-22',
        )).rejects.toThrow(/UOM/);
        expect(mutateAsync).not.toHaveBeenCalled();
    });
});
