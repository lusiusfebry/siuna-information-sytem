import stokService from '../stok.service';
import sequelize from '../../../../config/database';
import InvTransaksi from '../../models/Transaksi';
import InvTransaksiDetail from '../../models/TransaksiDetail';
import InvSerialNumber from '../../models/SerialNumber';
import FacilityAsset from '../../../facility/models/Asset';

// amendTransaksi: hanya untuk Approved. Membuat reversal (efek kebalikan)
// dan optional koreksi baru, semuanya auto-Approved dalam satu DB transaction.

jest.mock('../../../../config/database', () => ({
    __esModule: true,
    default: { transaction: jest.fn(), query: jest.fn() },
}));
jest.mock('../../models/Transaksi', () => ({
    __esModule: true,
    default: { findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
}));
jest.mock('../../models/TransaksiDetail', () => ({
    __esModule: true,
    default: { create: jest.fn(), findAll: jest.fn() },
}));
jest.mock('../../models/Produk', () => ({ __esModule: true, default: { findByPk: jest.fn() } }));
jest.mock('../../models/Stok', () => ({ __esModule: true, default: { findOne: jest.fn(), create: jest.fn() } }));
jest.mock('../../models/SerialNumber', () => ({
    __esModule: true,
    default: { findOne: jest.fn(), findAll: jest.fn(), destroy: jest.fn(), update: jest.fn(), create: jest.fn() },
}));
jest.mock('../../models/Gudang', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Uom', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Brand', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/SubKategori', () => ({ __esModule: true, default: {} }));
jest.mock('../../../hr/models/Employee', () => ({ __esModule: true, default: {} }));
jest.mock('../../../hr/models/Department', () => ({ __esModule: true, default: { findByPk: jest.fn() } }));
jest.mock('../../../hr/models/LokasiKerja', () => ({ __esModule: true, default: {} }));
jest.mock('../../../auth/models/User', () => ({ __esModule: true, default: {} }));
jest.mock('../../../facility/models/Building', () => ({ __esModule: true, default: {} }));
jest.mock('../../../facility/models/Room', () => ({ __esModule: true, default: { findByPk: jest.fn() } }));
jest.mock('../../../facility/models/Asset', () => ({
    __esModule: true,
    default: { count: jest.fn(), update: jest.fn(), create: jest.fn(), findOne: jest.fn() },
}));
jest.mock('../../../../shared/services/notification.service', () => ({
    __esModule: true,
    default: { checkLowStockAndNotify: jest.fn(), notifyPendingApproval: jest.fn() },
}));

const db = sequelize as any;
const Trx = InvTransaksi as any;
const TrxDetail = InvTransaksiDetail as any;
const Serial = InvSerialNumber as any;
const FA = FacilityAsset as any;

const makeTx = () => ({
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    LOCK: { UPDATE: 'UPDATE' },
});

const approvedSupplier = (over: any = {}) => ({
    id: 100, code: 'STM-0001', tipe: 'Masuk', sub_tipe: 'Supplier',
    tanggal: '2025-01-10', gudang_id: 1, gudang_tujuan_id: null,
    facility_building_id: null, facility_room_id: null,
    karyawan_id: null, department_id: null,
    approval_status: 'Approved', amends_transaksi_id: null, amended_by_transaksi_id: null,
    created_by: 7,
    update: jest.fn().mockResolvedValue(undefined),
    ...over,
});

beforeEach(() => {
    jest.clearAllMocks();
    db.query.mockResolvedValue([[], []]);
    Trx.findOne.mockResolvedValue(null);
});

describe('amendTransaksi — guards (§3.2 spec)', () => {
    it('menolak jika transaksi bukan Approved', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Trx.findByPk.mockResolvedValue(approvedSupplier({ approval_status: 'Pending' }));
        await expect(stokService.amendTransaksi(100, 9, 'salah input quantity'))
            .rejects.toThrow(/Approved yang bisa dikoreksi/);
        expect(tx.rollback).toHaveBeenCalled();
    });

    it('menolak jika sudah pernah di-amend', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Trx.findByPk.mockResolvedValue(approvedSupplier({ amended_by_transaksi_id: 101 }));
        await expect(stokService.amendTransaksi(100, 9, 'salah input quantity'))
            .rejects.toThrow(/sudah pernah dikoreksi/);
    });

    it('menolak amend baris reversal/koreksi', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Trx.findByPk.mockResolvedValue(approvedSupplier({ amends_transaksi_id: 42 }));
        await expect(stokService.amendTransaksi(100, 9, 'salah input quantity'))
            .rejects.toThrow(/reversal\/koreksi tidak bisa/);
    });

    it('menolak amend leg Transfer Gudang auto-generated', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Trx.findByPk.mockResolvedValue(approvedSupplier({
            sub_tipe: 'Transfer Gudang',
            catatan: 'Auto-generated dari transfer masuk STM-0099',
        }));
        await expect(stokService.amendTransaksi(100, 9, 'salah input quantity'))
            .rejects.toThrow(/amend transaksi Transfer Masuk-nya/);
    });

    it('menolak reason yang terlalu pendek', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        await expect(stokService.amendTransaksi(100, 9, '  ok  '))
            .rejects.toThrow(/minimal 5 karakter/);
    });
});
