import stokService from '../stok.service';
import sequelize from '../../../../config/database';
import InvTransaksi from '../../models/Transaksi';

// voidTransaksi: hanya boleh untuk transaksi Pending. Karena Pending belum
// meng-apply efek (INV-N07), void cukup ubah status ke 'Voided' + jejak audit.
// Tidak menyentuh stok, serial, atau facility_assets.

jest.mock('../../../../config/database', () => ({
    __esModule: true,
    default: { transaction: jest.fn(), query: jest.fn() },
}));
jest.mock('../../models/Transaksi', () => ({
    __esModule: true,
    default: { findByPk: jest.fn(), findOne: jest.fn() },
}));
jest.mock('../../models/TransaksiDetail', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Produk', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Stok', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/SerialNumber', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Gudang', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Uom', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Brand', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/SubKategori', () => ({ __esModule: true, default: {} }));
jest.mock('../../../hr/models/Employee', () => ({ __esModule: true, default: {} }));
jest.mock('../../../hr/models/Department', () => ({ __esModule: true, default: {} }));
jest.mock('../../../hr/models/LokasiKerja', () => ({ __esModule: true, default: {} }));
jest.mock('../../../auth/models/User', () => ({ __esModule: true, default: {} }));
jest.mock('../../../facility/models/Building', () => ({ __esModule: true, default: {} }));
jest.mock('../../../facility/models/Room', () => ({ __esModule: true, default: {} }));
jest.mock('../../../facility/models/Asset', () => ({ __esModule: true, default: {} }));
jest.mock('../../../../shared/services/notification.service', () => ({
    __esModule: true,
    default: { checkLowStockAndNotify: jest.fn(), notifyPendingApproval: jest.fn() },
}));

const db = sequelize as any;
const Trx = InvTransaksi as any;

const makeTx = () => ({
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    LOCK: { UPDATE: 'UPDATE' },
});

const makePendingRow = (over: any = {}) => ({
    id: 100, approval_status: 'Pending',
    amends_transaksi_id: null, amended_by_transaksi_id: null,
    update: jest.fn().mockResolvedValue(undefined),
    ...over,
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('voidTransaksi', () => {
    it('mengubah status Pending menjadi Voided dan mencatat jejak', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const row = makePendingRow();
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(row) : Promise.resolve({ toJSON: () => ({ id: 100, details: [] }) }));

        await stokService.voidTransaksi(100, 9, 'Salah input karyawan');

        expect(row.update).toHaveBeenCalledWith(
            expect.objectContaining({
                approval_status: 'Voided',
                voided_by: 9,
                void_reason: 'Salah input karyawan',
                voided_at: expect.any(Date),
            }),
            expect.anything(),
        );
        expect(tx.commit).toHaveBeenCalled();
    });

    it('menolak void transaksi Approved', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Trx.findByPk.mockResolvedValue({ id: 100, approval_status: 'Approved' });
        await expect(stokService.voidTransaksi(100, 9, 'alasan cukup'))
            .rejects.toThrow(/Pending yang bisa dibatalkan/);
        expect(tx.rollback).toHaveBeenCalled();
    });

    it('menolak void baris reversal/koreksi (amends_transaksi_id != null)', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Trx.findByPk.mockResolvedValue({ id: 100, approval_status: 'Pending', amends_transaksi_id: 42, amended_by_transaksi_id: null });
        await expect(stokService.voidTransaksi(100, 9, 'alasan cukup'))
            .rejects.toThrow(/reversal\/koreksi/);
        expect(tx.rollback).toHaveBeenCalled();
    });

    it('menolak reason yang terlalu pendek (setelah trim)', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        await expect(stokService.voidTransaksi(100, 9, '  ok  '))
            .rejects.toThrow(/minimal 5 karakter/);
    });

    it('melempar 404 jika transaksi tidak ditemukan', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Trx.findByPk.mockResolvedValue(null);
        await expect(stokService.voidTransaksi(999, 9, 'alasan cukup'))
            .rejects.toThrow(/tidak ditemukan/);
        expect(tx.rollback).toHaveBeenCalled();
    });

    it('rollback transaksi jika update gagal', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const row = makePendingRow({ update: jest.fn().mockRejectedValue(new Error('boom')) });
        Trx.findByPk.mockResolvedValue(row);
        await expect(stokService.voidTransaksi(100, 9, 'alasan cukup')).rejects.toThrow('boom');
        expect(tx.rollback).toHaveBeenCalled();
    });
});
