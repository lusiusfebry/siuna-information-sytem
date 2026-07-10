import { validateInventoryStok } from '../validateInventoryStok';
import { AppError } from '../../utils/errorHandler';

// Locks RT-2: the inventory transaction validator must
//  - return 400 (AppError), NOT 500, on invalid input (zod v4 uses .issues)
//  - allow negative jumlah for Adjustment (stok opname pengurangan)
//  - still reject jumlah < 1 for Masuk / Keluar
const run = (body: any) => {
    const req: any = { body };
    const res: any = {};
    let nextArg: any = 'UNSET';
    const next = (arg?: any) => { nextArg = arg; };
    validateInventoryStok(req, res, next);
    return nextArg;
};

const baseDetail = { produk_id: 1, uom_id: 1 };

describe('validateInventoryStok (RT-2)', () => {
    it('passes a valid Masuk transaction (next called with no error)', () => {
        const err = run({
            tipe: 'Masuk', sub_tipe: 'Supplier', tanggal: '2026-07-09',
            gudang_id: 1, supplier_nama: 'PT X',
            details: [{ ...baseDetail, jumlah: 5 }],
        });
        expect(err).toBeUndefined();
    });

    it('allows NEGATIVE jumlah for Adjustment', () => {
        const err = run({
            tipe: 'Adjustment', sub_tipe: 'Opname', tanggal: '2026-07-09',
            gudang_id: 1,
            details: [{ ...baseDetail, jumlah: -2 }],
        });
        expect(err).toBeUndefined();
    });

    it('rejects jumlah < 1 for Masuk with a 400 AppError (not 500)', () => {
        const err = run({
            tipe: 'Masuk', sub_tipe: 'Supplier', tanggal: '2026-07-09',
            gudang_id: 1, supplier_nama: 'PT X',
            details: [{ ...baseDetail, jumlah: 0 }],
        });
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(400);
    });

    it('rejects jumlah < 1 for Keluar', () => {
        const err = run({
            tipe: 'Keluar', sub_tipe: 'Ke Karyawan', tanggal: '2026-07-09',
            gudang_id: 1, karyawan_id: 3,
            details: [{ ...baseDetail, jumlah: 0 }],
        });
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(400);
    });

    it('returns a 400 AppError (formatted, not a thrown 500) on a bad tipe', () => {
        const err = run({
            tipe: 'Nonsense', sub_tipe: 'Supplier', tanggal: '2026-07-09',
            gudang_id: 1, details: [{ ...baseDetail, jumlah: 5 }],
        });
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(400);
        expect(Array.isArray(err.errors)).toBe(true);
    });

    it('requires supplier_nama for Supplier sub_tipe', () => {
        const err = run({
            tipe: 'Masuk', sub_tipe: 'Supplier', tanggal: '2026-07-09',
            gudang_id: 1,
            details: [{ ...baseDetail, jumlah: 5 }],
        });
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(400);
    });

    it('requires karyawan_id for Ke Karyawan sub_tipe', () => {
        const err = run({
            tipe: 'Keluar', sub_tipe: 'Ke Karyawan', tanggal: '2026-07-09',
            gudang_id: 1,
            details: [{ ...baseDetail, jumlah: 2 }],
        });
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(400);
    });
});
