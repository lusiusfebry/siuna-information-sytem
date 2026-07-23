import { render, screen, fireEvent, waitFor } from '../../../test/utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ReturAssetPicker, { ReturSelection } from '../ReturAssetPicker';
import inventoryEmployeeService from '../../../services/api/inventory-employee.service';

vi.mock('../../../services/api/inventory-employee.service', () => ({
    default: {
        getEmployeesWithAssets: vi.fn(),
        getEmployeeAssets: vi.fn(),
    },
}));

vi.mock('../../../hooks/useInventoryMasterData', () => ({
    useInvGudangList: () => ({ data: { data: [{ id: 1, nama: 'Gudang Pusat' }] } }),
}));

const svc = inventoryEmployeeService as unknown as {
    getEmployeesWithAssets: ReturnType<typeof vi.fn>;
    getEmployeeAssets: ReturnType<typeof vi.fn>;
};

describe('ReturAssetPicker', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        svc.getEmployeesWithAssets.mockResolvedValue({
            status: 'success',
            data: [{ id: 5, nama_lengkap: 'Triyanto', nomor_induk_karyawan: 'EMP-005', asset_count: 2 }],
        });
        svc.getEmployeeAssets.mockResolvedValue({
            status: 'success',
            data: [
                { id: 9, produk_id: 3, serial_number: 'SN-1', tag_number: null, status: 'Digunakan', produk: { id: 3, code: 'P3', nama: 'Laptop', uom_id: 7 }, created_at: '2026-01-01' },
            ],
        });
    });

    it('shows asset-holder results and loads their assets on select', async () => {
        render(<ReturAssetPicker onChange={() => {}} />);

        const input = screen.getByPlaceholderText(/karyawan/i);
        fireEvent.change(input, { target: { value: 'tri' } });

        await waitFor(() => expect(screen.getByText('Triyanto')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Triyanto'));

        await waitFor(() => expect(screen.getByText('Laptop')).toBeInTheDocument());
    });

    it('emits the selected unit with its uom_id when checked', async () => {
        const onChange = vi.fn();
        render(<ReturAssetPicker initialKaryawanId={5} onChange={onChange} />);

        // Assets load immediately from the preselected employee.
        await waitFor(() => expect(screen.getByText('Laptop')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('checkbox'));

        await waitFor(() => {
            const last = onChange.mock.calls.at(-1)?.[0] as ReturSelection;
            expect(last.karyawan_id).toBe(5);
            expect(last.items).toEqual([
                { serial_number_id: 9, produk_id: 3, uom_id: 7, identifier: 'SN-1' },
            ]);
        });
    });

    it('preselects a specific unit from props', async () => {
        const onChange = vi.fn();
        render(<ReturAssetPicker initialKaryawanId={5} preselectSerialIds={[9]} onChange={onChange} />);

        await waitFor(() => {
            const last = onChange.mock.calls.at(-1)?.[0] as ReturSelection;
            expect(last.items.map(i => i.serial_number_id)).toContain(9);
        });
        expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
    });
});
