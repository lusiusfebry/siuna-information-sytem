import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/errorHandler';

const transaksiDetailAdjustmentSchema = z.object({
    produk_id: z.number().int().positive('Produk harus dipilih'),
    uom_id: z.number().int().positive('UOM harus dipilih'),
    jumlah: z.number().int({ message: 'Jumlah harus berupa angka' }),
    catatan: z.string().optional(),
    serial_numbers: z.array(z.string().min(1)).optional(),
});

const transaksiSchema = z.object({
    tipe: z.enum(['Masuk', 'Keluar', 'Adjustment'], { message: 'Tipe transaksi tidak valid' }),
    sub_tipe: z.enum(['Supplier', 'Transfer Masuk', 'Retur Karyawan', 'Ke Karyawan', 'Transfer Gudang', 'Disposal', 'Opname', 'Ke Gedung/Mess', 'Rusak/Terbuang'], { message: 'Sub tipe tidak valid' }),
    tanggal: z.string().min(1, 'Tanggal harus diisi'),
    gudang_id: z.number().int().positive('Gudang harus dipilih'),
    gudang_tujuan_id: z.number().int().positive().optional().nullable(),
    facility_building_id: z.number().int().positive().optional().nullable(),
    facility_room_id: z.number().int().positive().optional().nullable(),
    karyawan_id: z.number().int().positive().optional().nullable(),
    supplier_nama: z.string().optional().nullable(),
    no_referensi: z.string().optional().nullable(),
    catatan: z.string().optional().nullable(),
    // Base uses the permissive detail schema (int, any sign). Sign is enforced
    // per-tipe in superRefine: Masuk/Keluar require jumlah >= 1, Adjustment
    // allows negative (stok opname pengurangan).
    details: z.array(transaksiDetailAdjustmentSchema).min(1, 'Minimal satu item detail harus diisi'),
}).superRefine((data, ctx) => {
    if (data.sub_tipe === 'Supplier' && !data.supplier_nama) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nama supplier harus diisi', path: ['supplier_nama'] });
    }
    if ((data.sub_tipe === 'Transfer Masuk' || data.sub_tipe === 'Transfer Gudang') && !data.gudang_tujuan_id) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Gudang tujuan harus dipilih', path: ['gudang_tujuan_id'] });
    }
    if (data.sub_tipe === 'Ke Gedung/Mess' && !data.facility_building_id) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Gedung/Mess tujuan harus dipilih', path: ['facility_building_id'] });
    }
    if ((data.sub_tipe === 'Ke Karyawan' || data.sub_tipe === 'Retur Karyawan') && !data.karyawan_id) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Karyawan harus dipilih', path: ['karyawan_id'] });
    }
    // Masuk/Keluar must use positive quantities; only Adjustment may be negative.
    if (data.tipe === 'Masuk' || data.tipe === 'Keluar') {
        data.details.forEach((d, i) => {
            if (d.jumlah < 1) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Jumlah harus lebih dari 0', path: ['details', i, 'jumlah'] });
            }
        });
    }
});

export const validateInventoryStok = (req: Request, _res: Response, next: NextFunction) => {
    try {
        const validatedData = transaksiSchema.parse(req.body);
        req.body = validatedData;
        next();
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const zodError = error as any;
            const formattedErrors = (zodError.issues ?? zodError.errors).map((err: any) => ({
                field: err.path.join('.'),
                message: err.message,
            }));
            next(new AppError('Validation Error', 400, formattedErrors));
        } else {
            next(error);
        }
    }
};
