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
jest.mock('../../models/Produk', () => ({ __esModule: true, default: { findByPk: jest.fn(), findAll: jest.fn().mockResolvedValue([]) } }));
jest.mock('../../models/Stok', () => ({ __esModule: true, default: { findOne: jest.fn(), create: jest.fn() } }));
jest.mock('../../models/SerialNumber', () => ({
    __esModule: true,
    default: { findOne: jest.fn(), findAll: jest.fn(), destroy: jest.fn(), update: jest.fn(), create: jest.fn() },
}));
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
    Serial.findAll.mockResolvedValue([]);
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

describe('amendTransaksi — reversal non-serial', () => {
    it('Supplier: reversal Adjustment -N, transaksi asli ditandai amended_by', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);

        const original = approvedSupplier();
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 5, catatan: null, serial_numbers: null },
        ]);
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: 200, ...v,
            update: jest.fn().mockResolvedValue(undefined),
        }));
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: false, has_tag_number: false,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 100, update: jest.fn().mockResolvedValue(undefined),
        });

        await stokService.amendTransaksi(100, 9, 'Salah input quantity');

        const reversalArgs = Trx.create.mock.calls[0][0];
        expect(reversalArgs.tipe).toBe('Adjustment');
        expect(reversalArgs.sub_tipe).toBe('Supplier');
        expect(reversalArgs.amends_transaksi_id).toBeUndefined();
        expect(reversalArgs.approval_status).toBe('Approved');
        const detailArgs = TrxDetail.create.mock.calls[0][0];
        expect(detailArgs.jumlah).toBe(-5);
        expect(original.update).toHaveBeenCalledWith(
            expect.objectContaining({ amended_by_transaksi_id: 200 }),
            expect.anything(),
        );
        expect(tx.commit).toHaveBeenCalled();
    });

    it('Konsumsi: reversal Adjustment +N di gudang yang sama', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({ tipe: 'Keluar', sub_tipe: 'Konsumsi', karyawan_id: 3 });
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 5, catatan: null, serial_numbers: null },
        ]);
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: 201, ...v, update: jest.fn().mockResolvedValue(undefined),
        }));
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: false, has_tag_number: false, is_consumable: true,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 50, update: jest.fn().mockResolvedValue(undefined),
        });

        await stokService.amendTransaksi(100, 9, 'Salah input jumlah konsumsi');

        const reversalArgs = Trx.create.mock.calls[0][0];
        expect(reversalArgs.tipe).toBe('Adjustment');
        expect(TrxDetail.create.mock.calls[0][0].jumlah).toBe(5);
        expect(reversalArgs.gudang_id).toBe(1);
    });

    it('Adjustment: reversal Adjustment dengan jumlah dinegasi', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({ tipe: 'Adjustment', sub_tipe: 'Adjustment' });
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: -3, catatan: null, serial_numbers: null },
        ]);
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: 202, ...v, update: jest.fn().mockResolvedValue(undefined),
        }));
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: false, has_tag_number: false,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 100, update: jest.fn().mockResolvedValue(undefined),
        });

        await stokService.amendTransaksi(100, 9, 'Adjustment salah arah');
        const detailArgs = TrxDetail.create.mock.calls[0][0];
        expect(detailArgs.jumlah).toBe(3);
    });

    it('Amend + koreksi.details: reversal + koreksi baru dibuat sebagai transaksi terpisah', async () => {

        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier();
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 5, catatan: null, serial_numbers: null },
        ]);
        let createIdCounter = 200;
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: ++createIdCounter, ...v, update: jest.fn().mockResolvedValue(undefined),
        }));
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: false, has_tag_number: false,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 100, update: jest.fn().mockResolvedValue(undefined),
        });

        const result = await stokService.amendTransaksi(100, 9, 'Salah input quantity, seharusnya 3', {
            details: [{ produk_id: 10, uom_id: 1, jumlah: 3 }],
        });

        expect(Trx.create).toHaveBeenCalledTimes(2);
        expect(result).toHaveProperty('reversal');
        expect(result).toHaveProperty('koreksi');
    });
});

describe('amendTransaksi — reversal serial', () => {
    it('Ke Karyawan: reversal Retur Karyawan dengan serial yang sama', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({
            id: 100, tipe: 'Keluar', sub_tipe: 'Ke Karyawan', karyawan_id: 3,
        });
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 1, catatan: null, serial_numbers: ['SN-001'] },
        ]);
        // Guard: serial masih di posisi asli (transaksi_terakhir_id = 100)
        Serial.findAll.mockResolvedValue([
            { serial_number: 'SN-001', transaksi_terakhir_id: 100, karyawan_id: 3, status: 'Digunakan' },
        ]);
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: 300, ...v, update: jest.fn().mockResolvedValue(undefined),
        }));
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: true, has_tag_number: false,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 5, update: jest.fn().mockResolvedValue(undefined),
        });
        Serial.update.mockResolvedValue([1]);

        await stokService.amendTransaksi(100, 9, 'Salah karyawan penerima');

        const reversalArgs = Trx.create.mock.calls[0][0];
        expect(reversalArgs.tipe).toBe('Masuk');
        expect(reversalArgs.sub_tipe).toBe('Retur Karyawan');
        expect(reversalArgs.karyawan_id).toBe(3);
        expect(TrxDetail.create.mock.calls[0][0].serial_numbers).toEqual(['SN-001']);
    });

    it('Retur Karyawan: reversal Ke Karyawan ke karyawan yang sama', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({
            id: 100, tipe: 'Masuk', sub_tipe: 'Retur Karyawan', karyawan_id: 3,
        });
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 1, catatan: null, serial_numbers: ['SN-002'] },
        ]);
        Serial.findAll.mockResolvedValue([
            { serial_number: 'SN-002', transaksi_terakhir_id: 100, gudang_id: 1, status: 'Tersedia' },
        ]);
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: 301, ...v, update: jest.fn().mockResolvedValue(undefined),
        }));
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: true, has_tag_number: false,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 5, update: jest.fn().mockResolvedValue(undefined),
        });
        (require('../../models/SerialNumber').default.findOne as jest.Mock).mockResolvedValue({
            update: jest.fn().mockResolvedValue(undefined),
        });

        await stokService.amendTransaksi(100, 9, 'Retur diproses karena salah');

        const reversalArgs = Trx.create.mock.calls[0][0];
        expect(reversalArgs.tipe).toBe('Keluar');
        expect(reversalArgs.sub_tipe).toBe('Ke Karyawan');
        expect(reversalArgs.karyawan_id).toBe(3);
    });

    it('Guard: menolak 409 jika serial sudah dipindah oleh transaksi lain', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({
            id: 100, tipe: 'Keluar', sub_tipe: 'Ke Karyawan', karyawan_id: 3,
        });
        Trx.findByPk.mockResolvedValue(original);
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 1, catatan: null, serial_numbers: ['SN-001'] },
        ]);
        // Serial sudah dipindah oleh transaksi 555
        Serial.findAll.mockResolvedValue([
            { serial_number: 'SN-001', transaksi_terakhir_id: 555, karyawan_id: 8, status: 'Digunakan' },
        ]);

        try {
            await stokService.amendTransaksi(100, 9, 'Salah karyawan penerima');
            throw new Error('Should have thrown');
        } catch (e: any) {
            expect(e.message).toMatch(/sudah dipindah/);
            expect(e.statusCode).toBe(409);
        }
        expect(tx.rollback).toHaveBeenCalled();
    });
});

describe('amendTransaksi — Transfer Masuk (paired)', () => {
    it('membangun 2 reversal: destinasi (Adjustment -N) + asal (Adjustment +N)', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({
            id: 100, tipe: 'Masuk', sub_tipe: 'Transfer Masuk',
            gudang_id: 2, gudang_tujuan_id: 1, // 1 = asal, 2 = destinasi
        });
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 5, catatan: null, serial_numbers: null },
        ]);
        let counter = 500;
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: ++counter, ...v, update: jest.fn().mockResolvedValue(undefined),
        }));
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: false, has_tag_number: false,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 20, update: jest.fn().mockResolvedValue(undefined),
        });

        await stokService.amendTransaksi(100, 9, 'Transfer salah gudang');

        // 2 create dipanggil: primary reversal + paired reversal
        expect(Trx.create).toHaveBeenCalledTimes(2);
        const firstArgs = Trx.create.mock.calls[0][0];
        const secondArgs = Trx.create.mock.calls[1][0];
        expect(firstArgs.gudang_id).toBe(2); // destinasi asli
        expect(secondArgs.gudang_id).toBe(1); // asal
    });
});

describe('amendTransaksi — reversal fasilitas', () => {
    it('Ke Gedung/Mess: reversal Ambil dari Gedung dari ruangan yang sama', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({
            id: 100, tipe: 'Keluar', sub_tipe: 'Ke Gedung/Mess',
            facility_building_id: 5, facility_room_id: 7,
        });
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 1, catatan: null, serial_numbers: ['SN-100'] },
        ]);
        Serial.findAll.mockResolvedValue([
            { serial_number: 'SN-100', transaksi_terakhir_id: 100, gudang_id: null, status: 'Digunakan' },
        ]);
        // Guard facility: penempatan masih Aktif
        FA.count.mockResolvedValue(1);
        FA.findOne.mockResolvedValue({
            serial_number_id: 999, status: 'Aktif', room_id: 7,
        });
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: 400, ...v, update: jest.fn().mockResolvedValue(undefined),
        }));
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: true, has_tag_number: false,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 5, update: jest.fn().mockResolvedValue(undefined),
        });
        (require('../../models/SerialNumber').default.findOne as jest.Mock).mockResolvedValue({
            id: 999, update: jest.fn().mockResolvedValue(undefined),
        });
        (require('../../../facility/models/Room').default.findByPk as jest.Mock).mockResolvedValue({
            id: 7, building_id: 5,
        });

        await stokService.amendTransaksi(100, 9, 'Salah ruangan penempatan');

        const reversalArgs = Trx.create.mock.calls[0][0];
        expect(reversalArgs.tipe).toBe('Masuk');
        expect(reversalArgs.sub_tipe).toBe('Ambil dari Gedung');
    });

    it('Guard: menolak 409 jika penempatan fasilitas sudah ditarik', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({
            id: 100, tipe: 'Keluar', sub_tipe: 'Ke Gedung/Mess',
            facility_building_id: 5, facility_room_id: 7,
        });
        Trx.findByPk.mockResolvedValue(original);
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 1, catatan: null, serial_numbers: ['SN-100'] },
        ]);
        Serial.findAll.mockResolvedValue([
            { serial_number: 'SN-100', transaksi_terakhir_id: 100, gudang_id: null, status: 'Digunakan' },
        ]);
        // Penempatan sudah ditarik
        FA.count.mockResolvedValue(0);

        try {
            await stokService.amendTransaksi(100, 9, 'Salah ruangan penempatan');
            throw new Error('Should have thrown');
        } catch (e: any) {
            expect(e.message).toMatch(/sudah ditarik/);
            expect(e.statusCode).toBe(409);
        }
        expect(tx.rollback).toHaveBeenCalled();
    });
});
