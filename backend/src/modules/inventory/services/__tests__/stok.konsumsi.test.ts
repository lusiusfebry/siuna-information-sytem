import stokService from '../stok.service';
import sequelize from '../../../../config/database';
import InvTransaksi from '../../models/Transaksi';
import InvTransaksiDetail from '../../models/TransaksiDetail';
import InvProduk from '../../models/Produk';
import InvStok from '../../models/Stok';
import InvSerialNumber from '../../models/SerialNumber';
import Department from '../../../hr/models/Department';
import notificationService from '../../../../shared/services/notification.service';

// Consumable issue ('Konsumsi') business rules — validated by StokService.validateKonsumsi
// before any stock effect runs. Exercised here through the public createTransaksi path
// (validateKonsumsi is private). A Konsumsi is a 'Keluar' movement, so it is created
// Pending under the INV-N07 approval gate and applies no stock effect until approved.
//
//  - Recipient shape: exactly ONE of karyawan_id / department_id (employee XOR division).
//    Both-set or neither-set is rejected.
//  - Product must be a genuine consumable (is_consumable = true).
//  - Serial/tag-tracked products can never be consumables and are rejected.
//  - A department recipient must exist.

jest.mock('../../../../config/database', () => ({
    __esModule: true,
    default: { transaction: jest.fn(), query: jest.fn() },
}));
jest.mock('../../models/Transaksi', () => ({ __esModule: true, default: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), findAndCountAll: jest.fn() } }));
jest.mock('../../models/TransaksiDetail', () => ({ __esModule: true, default: { create: jest.fn(), findAll: jest.fn() } }));
jest.mock('../../models/Produk', () => ({ __esModule: true, default: { findByPk: jest.fn(), findAll: jest.fn().mockResolvedValue([]) } }));
jest.mock('../../models/Stok', () => ({ __esModule: true, default: { findOne: jest.fn(), create: jest.fn() } }));
jest.mock('../../models/SerialNumber', () => ({ __esModule: true, default: { findOne: jest.fn(), create: jest.fn(), update: jest.fn(), findAll: jest.fn() } }));
jest.mock('../../models/OpnameSession', () => ({ __esModule: true, default: { count: jest.fn().mockResolvedValue(0) } }));
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
jest.mock('../../../facility/models/Asset', () => ({ __esModule: true, default: { update: jest.fn(), create: jest.fn(), count: jest.fn() } }));
jest.mock('../../../../shared/services/notification.service', () => ({
    __esModule: true,
    default: { checkLowStockAndNotify: jest.fn().mockResolvedValue(undefined), notifyPendingApproval: jest.fn().mockResolvedValue(undefined) },
}));

const db = sequelize as any;
const Trx = InvTransaksi as any;
const TrxDetail = InvTransaksiDetail as any;
const Produk = InvProduk as any;
const Stok = InvStok as any;
const Serial = InvSerialNumber as any;
const Dept = Department as any;
const notif = notificationService as any;

const LOCK = { UPDATE: 'UPDATE' };
const makeTx = () => ({ commit: jest.fn().mockResolvedValue(undefined), rollback: jest.fn().mockResolvedValue(undefined), LOCK });

// A valid consumable-issue payload: Keluar/Konsumsi to a single employee recipient.
const konsumsiPayload = (over: any = {}) => ({
    tipe: 'Keluar',
    sub_tipe: 'Konsumsi',
    tanggal: '2025-01-10',
    gudang_id: 1,
    karyawan_id: 3,
    details: [{ produk_id: 10, uom_id: 1, jumlah: 5 }],
    ...over,
});

// A genuine consumable product (non-serial, non-tag).
const consumableProduk = { id: 10, code: 'CNS-001', nama: 'Sarung Tangan', is_consumable: true, has_serial_number: false, has_tag_number: false };

beforeEach(() => {
    jest.clearAllMocks();
    db.query.mockResolvedValue([[], []]);
    Trx.findOne.mockResolvedValue(null); // generateCode: no prior code
    Trx.create.mockImplementation((v: any) => Promise.resolve({ id: 100, ...v }));
    TrxDetail.create.mockResolvedValue({ id: 1 });
    Produk.findByPk.mockResolvedValue(consumableProduk);
    Stok.findOne.mockResolvedValue({ jumlah: 50, update: jest.fn().mockResolvedValue(undefined) });
    Stok.create.mockResolvedValue({ id: 1 });
    Serial.findAll.mockResolvedValue([]);
    Dept.findByPk.mockResolvedValue({ id: 2, code: 'DEP-01', nama: 'Produksi' });
    Trx.findByPk.mockImplementation((id: number, opts: any) =>
        opts?.lock ? Promise.resolve(null) : Promise.resolve({ toJSON: () => ({ id, details: [] }) }));
});

describe('validateKonsumsi — recipient shape (employee XOR division)', () => {
    it('rejects when BOTH karyawan_id and department_id are provided', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        await expect(
            stokService.createTransaksi(konsumsiPayload({ karyawan_id: 3, department_id: 2 }) as any, 7)
        ).rejects.toThrow(/salah satu: karyawan ATAU divisi\/departemen/);
        expect(tx.rollback).toHaveBeenCalled();
        expect(Trx.create).not.toHaveBeenCalled();
    });

    it('rejects when NEITHER karyawan_id nor department_id is provided', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        await expect(
            stokService.createTransaksi(konsumsiPayload({ karyawan_id: undefined, department_id: undefined }) as any, 7)
        ).rejects.toThrow(/salah satu: karyawan ATAU divisi\/departemen/);
        expect(tx.rollback).toHaveBeenCalled();
    });

    it('rejects a department recipient that does not exist', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Dept.findByPk.mockResolvedValue(null);
        await expect(
            stokService.createTransaksi(konsumsiPayload({ karyawan_id: undefined, department_id: 999 }) as any, 7)
        ).rejects.toThrow(/Divisi\/departemen tujuan tidak ditemukan/);
        expect(tx.rollback).toHaveBeenCalled();
    });
});

describe('validateKonsumsi — product eligibility', () => {
    it('rejects a non-consumable product', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Produk.findByPk.mockResolvedValue({ ...consumableProduk, is_consumable: false });
        await expect(
            stokService.createTransaksi(konsumsiPayload() as any, 7)
        ).rejects.toThrow(/bukan barang consumable/);
        expect(tx.rollback).toHaveBeenCalled();
    });

    it('rejects a serial-tracked product even if flagged consumable', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Produk.findByPk.mockResolvedValue({ ...consumableProduk, has_serial_number: true });
        await expect(
            stokService.createTransaksi(konsumsiPayload() as any, 7)
        ).rejects.toThrow(/serial\/tag number/);
        expect(tx.rollback).toHaveBeenCalled();
    });

    it('rejects a tag-tracked product', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Produk.findByPk.mockResolvedValue({ ...consumableProduk, has_tag_number: true });
        await expect(
            stokService.createTransaksi(konsumsiPayload() as any, 7)
        ).rejects.toThrow(/serial\/tag number/);
        expect(tx.rollback).toHaveBeenCalled();
    });

    it('reports a missing product line', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Produk.findByPk.mockResolvedValue(null);
        await expect(
            stokService.createTransaksi(konsumsiPayload() as any, 7)
        ).rejects.toThrow(/tidak ditemukan/);
        expect(tx.rollback).toHaveBeenCalled();
    });
});

describe('validateKonsumsi — valid issue is created Pending under the approval gate', () => {
    it('accepts a consumable to a single employee, persists the recipient, applies no stock effect', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);

        await stokService.createTransaksi(konsumsiPayload() as any, 7);

        const created = Trx.create.mock.calls[0][0];
        // Konsumsi is a 'Keluar' movement — gated to Pending (INV-N07)
        expect(created.approval_status).toBe('Pending');
        expect(created.karyawan_id).toBe(3);
        expect(created.department_id).toBeNull();
        // no stock advisory-lock query for the stok row (effects deferred until approval)
        const stokLockCalls = db.query.mock.calls.filter((c: any[]) => c[1]?.replacements?.k === 'inv_stok_10_1');
        expect(stokLockCalls).toHaveLength(0);
        expect(tx.commit).toHaveBeenCalled();
        expect(notif.notifyPendingApproval).toHaveBeenCalled();
    });

    it('accepts a consumable to a division and persists department_id', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);

        await stokService.createTransaksi(
            konsumsiPayload({ karyawan_id: undefined, department_id: 2 }) as any, 7
        );

        const created = Trx.create.mock.calls[0][0];
        expect(created.department_id).toBe(2);
        expect(created.karyawan_id).toBeNull();
        expect(tx.commit).toHaveBeenCalled();
    });
});
