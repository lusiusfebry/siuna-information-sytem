import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/errorHandler';

const createSessionSchema = z.object({
    gudang_id: z.number().int().positive('Gudang harus dipilih'),
    catatan: z.string().optional().nullable(),
    petugas_ids: z.array(z.number().int().positive())
        .min(1, 'Minimal 1 petugas opname wajib dipilih'),
});

const upsertDetailSchema = z.object({
    produk_id: z.number().int().positive('Produk harus dipilih'),
    // null = reset (belum dihitung); >= 0 saat diisi.
    jumlah_fisik: z.number().int('Jumlah fisik harus berupa angka').min(0, 'Jumlah fisik tidak boleh negatif').nullable(),
    catatan: z.string().optional().nullable(),
});

const upsertSerialSchema = z.object({
    opname_serial_id: z.number().int().positive('Baris serial tidak valid'),
    kondisi: z.enum(['Ada', 'Tidak Ada'], { message: 'Kondisi harus "Ada" atau "Tidak Ada"' }),
    catatan: z.string().optional().nullable(),
});

const cancelSchema = z.object({
    reason: z.string().trim().min(5, 'Alasan wajib diisi (minimal 5 karakter)'),
});

const runValidation = (schema: z.ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const formattedErrors = (error.issues ?? (error as any).errors).map((err: any) => ({
                field: err.path.join('.'),
                message: err.message,
            }));
            return next(new AppError(formattedErrors[0]?.message ?? 'Validasi gagal', 400));
        }
        next(error);
    }
};

export const validateCreateOpname = runValidation(createSessionSchema);
export const validateUpsertOpnameDetail = runValidation(upsertDetailSchema);
export const validateUpsertOpnameSerial = runValidation(upsertSerialSchema);
export const validateCancelOpname = runValidation(cancelSchema);
