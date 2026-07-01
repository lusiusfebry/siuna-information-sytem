import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/errorHandler';

const transaksiDetailSchema = z.object({
    produk_id: z.number().int().positive('Produk harus dipilih'),
    uom_id: z.number().int().positive('UOM harus dipilih'),
    jumlah: z.number().int().min(1, 'Jumlah harus lebih dari 0'),
    catatan: z.string().optional(),
    serial_numbers: z.array(z.string().min(1)).optional(),
});

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
    karyawan_id: z.number().int().positive().optional().nullable(),
    supplier_nama: z.string().optional().nullable(),
    no_referensi: z.string().optional().nullable(),
    catatan: z.string().optional().nullable(),
    details: z.array(transaksiDetailSchema).min(1, 'Minimal satu item detail harus diisi'),
}).superRefine((data, ctx) => {
    if (data.sub_tipe === 'Supplier' && !data.supplier_nama) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nama supplier harus diisi', path: ['supplier_nama'] });
    }
    if ((data.sub_tipe === 'Transfer Masuk' || data.sub_tipe === 'Transfer Gudang' || data.sub_tipe === 'Ke Gedung/Mess') && !data.gudang_tujuan_id) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Gudang tujuan harus dipilih', path: ['gudang_tujuan_id'] });
    }
    if ((data.sub_tipe === 'Ke Karyawan' || data.sub_tipe === 'Retur Karyawan') && !data.karyawan_id) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Karyawan harus dipilih', path: ['karyawan_id'] });
    }
    if (data.tipe === 'Adjustment') {
        const adjustmentResult = z.array(transaksiDetailAdjustmentSchema).safeParse(data.details);
        if (!adjustmentResult.success) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Detail adjustment tidak valid', path: ['details'] });
        }
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
            const formattedErrors = zodError.errors.map((err: any) => ({
                field: err.path.join('.'),
                message: err.message,
            }));
            next(new AppError('Validation Error', 400, formattedErrors));
        } else {
            next(error);
        }
    }
};
