import stokService from '../stok.service';
import sequelize from '../../../config/database';
import InvTransaksi from '../models/Transaksi';
import InvTransaksiDetail from '../models/TransaksiDetail';
import InvProduk from '../models/Produk';
import InvStok from '../models/Stok';
import InvSerialNumber from '../models/SerialNumber';
import notificationService from '../../../shared/services/notification.service';

// INV-N07: locks the approval gate on stock transactions.
//  - Outbound ('Keluar'), 'Adjustment', and 'Transfer Masuk' are created Pending and
//    apply NO stock effects until approved (a Pending row never touches stock).
//  - Plain inbound ('Masuk' / 'Supplier') auto-approves and applies effects at once.
//  - approveTransaksi replays the deferred effects and stamps approver; validation
//    (e.g. insufficient stock) runs at approval time and rolls back on failure.
//  - rejectTransaksi marks the row and applies nothing.

jest.mock('../../../config/database', () => ({
    __esModule: true,
    default: { transaction: jest.fn(), query: jest.fn() },
}));
jest.mock('../models/Transaksi', () => ({ __esModule: true, default: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), findAndCountAll: jest.fn() } }));
jest.mock('../models/TransaksiDetail', () => ({ __esModule: true, default: { create: jest.fn(), findAll: jest.fn() } }));
jest.mock('../models/Produk', () => ({ __esModule: true, default: { findByPk: jest.fn() } }));
jest.mock('../models/Stok', () => ({ __esModule: true, default: { findOne: jest.fn(), create: jest.fn() } }));
jest.mock('../models/SerialNumber', () => ({ __esModule: true, default: { findOne: jest.fn(), create: jest.fn(), update: jest.fn(), findAll: jest.fn() } }));
jest.mock('../models/Gudang', () => ({ __esModule: true, default: {} }));
jest.mock('../models/Uom', () => ({ __esModule: true, default: {} }));
jest.mock('../models/Brand', () => ({ __esModule: true, default: {} }));
jest.mock('../models/SubKategori', () => ({ __esModule: true, default: {} }));
jest.mock('../../hr/models/Employee', () => ({ __esModule: true, default: {} }));
jest.mock('../../hr/models/LokasiKerja', () => ({ __esModule: true, default: {} }));
jest.mock('../../auth/models/User', () => ({ __esModule: true, default: {} }));
jest.mock('../../facility/models/Building', () => ({ __esModule: true, default: {} }));
jest.mock('../../facility/models/Room', () => ({ __esModule: true, default: { findByPk: jest.fn() } }));
jest.mock('../../facility/models/Asset', () => ({ __esModule: true, default: { update: jest.fn(), create: jest.fn(), count: jest.fn() } }));
jest.mock('../../../shared/services/notification.service', () => ({
    __esModule: true,
    default: { checkLowStockAndNotify: jest.fn().mockResolvedValue(undefined), notifyPendingApproval: jest.fn().mockResolvedValue(undefined) },
}));

const db = sequelize as any;
const Trx = InvTransaksi as any;
const TrxDetail = InvTransaksiDetail as any;
const Produk = InvProduk as any;
const Stok = InvStok as any;
const Serial = InvSerialNumber as any;
const notif = notificationService as any;

const LOCK = { UPDATE: 'UPDATE' };
const makeTx = () => ({ commit: jest.fn().mockResolvedValue(undefined), rollback: jest.fn().mockResolvedValue(undefined), LOCK });

const basePayload = (over: any = {}) => ({
    tipe: 'Masuk',
    sub_tipe: 'Supplier',
    tanggal: '2025-01-10',
    gudang_id: 1,
    details: [{ produk_id: 10, uom_id: 1, jumlah: 5 }],
    ...over,
});

beforeEach(() => {
    jest.clearAllMocks();
    db.query.mockResolvedValue([[], []]);
    // generateCode: no prior code -> STx-0001
    Trx.findOne.mockResolvedValue(null);
    // create returns the row (id echoed) so downstream reads have an id
    Trx.create.mockImplementation((v: any) => Promise.resolve({ id: 100, ...v }));
    TrxDetail.create.mockResolvedValue({ id: 1 });
    // a non-serial, non-tag product so effect handlers stay simple
    Produk.findByPk.mockResolvedValue({ id: 10, nama: 'Item', has_serial_number: false, has_tag_number: false });
    Stok.findOne.mockResolvedValue({ jumlah: 50, update: jest.fn().mockResolvedValue(undefined) });
    Stok.create.mockResolvedValue({ id: 1 });
    Serial.findAll.mockResolvedValue([]);
    // getTransaksiDetail at the end of create/approve — return a minimal row
    Trx.findByPk.mockImplementation((id: number, opts: any) => {
        if (opts?.lock) {
            // approve/reject path: locked fetch of the pending row (overridden per-test)
            return Promise.resolve(null);
        }
        return Promise.resolve({ toJSON: () => ({ id, details: [] }) });
    });
});

describe('createTransaksi approval gating (INV-N07)', () => {
    it('auto-approves a plain inbound (Supplier) and applies stock immediately', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);

        await stokService.createTransaksi(basePayload() as any, 7);

        const created = Trx.create.mock.calls[0][0];
        expect(created.approval_status).toBe('Approved');
        // effect applied: stock upsert path ran (advisory lock query fired for the stok key)
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('pg_advisory_xact_lock'),
            expect.objectContaining({ replacements: expect.objectContaining({ k: 'inv_stok_10_1' }) })
        );
        expect(tx.commit).toHaveBeenCalled();
        expect(notif.notifyPendingApproval).not.toHaveBeenCalled();
        expect(notif.checkLowStockAndNotify).toHaveBeenCalled();
    });

    it('creates Keluar as Pending and applies NO stock effect', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);

        await stokService.createTransaksi(basePayload({ tipe: 'Keluar', sub_tipe: 'Ke Karyawan', karyawan_id: 3 }) as any, 7);

        const created = Trx.create.mock.calls[0][0];
        expect(created.approval_status).toBe('Pending');
        // no stock advisory-lock query for the stok row (effects deferred)
        const stokLockCalls = db.query.mock.calls.filter((c: any[]) => c[1]?.replacements?.k === 'inv_stok_10_1');
        expect(stokLockCalls).toHaveLength(0);
        // the detail row snapshots serials for later replay
        expect(TrxDetail.create.mock.calls[0][0]).toHaveProperty('serial_numbers');
        expect(tx.commit).toHaveBeenCalled();
        expect(notif.notifyPendingApproval).toHaveBeenCalledWith(100, expect.any(String));
        expect(notif.checkLowStockAndNotify).not.toHaveBeenCalled();
    });

    it('creates Adjustment as Pending', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        await stokService.createTransaksi(basePayload({ tipe: 'Adjustment', sub_tipe: 'Koreksi' }) as any, 7);
        expect(Trx.create.mock.calls[0][0].approval_status).toBe('Pending');
    });

    it('creates Transfer Masuk as Pending even though its header is Masuk', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        await stokService.createTransaksi(basePayload({ tipe: 'Masuk', sub_tipe: 'Transfer Masuk', gudang_tujuan_id: 2 }) as any, 7);
        expect(Trx.create.mock.calls[0][0].approval_status).toBe('Pending');
    });
});

describe('approveTransaksi (INV-N07)', () => {
    it('replays effects, stamps approver, and commits', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);

        const pendingRow: any = {
            id: 100, tipe: 'Keluar', sub_tipe: 'Ke Karyawan', tanggal: '2025-01-10',
            gudang_id: 1, gudang_tujuan_id: null, facility_building_id: null, facility_room_id: null,
            karyawan_id: 3, supplier_nama: null, no_referensi: null, catatan: null, created_by: 7,
            approval_status: 'Pending',
            update: jest.fn().mockResolvedValue(undefined),
        };
        Trx.findByPk.mockImplementation((id: number, opts: any) =>
            opts?.lock ? Promise.resolve(pendingRow) : Promise.resolve({ toJSON: () => ({ id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([{ produk_id: 10, uom_id: 1, jumlah: 5, catatan: null, serial_numbers: null }]);

        await stokService.approveTransaksi(100, 9);

        // stock effect now runs (advisory lock for the stok row fired during replay)
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('pg_advisory_xact_lock'),
            expect.objectContaining({ replacements: expect.objectContaining({ k: 'inv_stok_10_1' }) })
        );
        expect(pendingRow.update).toHaveBeenCalledWith(
            expect.objectContaining({ approval_status: 'Approved', approved_by: 9, approved_at: expect.any(Date) }),
            expect.anything()
        );
        expect(tx.commit).toHaveBeenCalled();
    });

    it('rejects a non-Pending transaction and rolls back', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve({ id: 100, approval_status: 'Approved' }) : Promise.resolve(null));

        await expect(stokService.approveTransaksi(100, 9)).rejects.toThrow(/tidak dapat disetujui/);
        expect(tx.rollback).toHaveBeenCalled();
    });
});

describe('rejectTransaksi (INV-N07)', () => {
    it('marks Rejected with reason and applies no effects', async () => {
        const row: any = { id: 100, approval_status: 'Pending', update: jest.fn().mockResolvedValue(undefined) };
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(row) : Promise.resolve({ toJSON: () => ({ id: 100, details: [] }) }));
        // reject uses a non-locked findByPk then update; make the first call return the row
        Trx.findByPk.mockResolvedValueOnce(row);

        await stokService.rejectTransaksi(100, 9, '  salah input  ');

        expect(row.update).toHaveBeenCalledWith(expect.objectContaining({
            approval_status: 'Rejected', approved_by: 9, rejection_reason: 'salah input',
        }));
        // no stock effects
        expect(Stok.create).not.toHaveBeenCalled();
    });

    it('refuses to reject a non-Pending transaction', async () => {
        Trx.findByPk.mockResolvedValueOnce({ id: 100, approval_status: 'Approved' });
        await expect(stokService.rejectTransaksi(100, 9)).rejects.toThrow(/tidak dapat ditolak/);
    });
});
