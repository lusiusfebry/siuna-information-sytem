import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/errorHandler';

const workOrderSchema = z.object({
    judul: z.string().min(1, 'Judul tidak boleh kosong'),
    deskripsi: z.string().optional().nullable(),
    room_id: z.number().int().positive('Ruangan harus dipilih'),
    kategori_id: z.number().int().optional().nullable(),
    prioritas: z.enum(['Low', 'Medium', 'High', 'Critical']).optional().default('Medium'),
    status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']).optional().default('Open'),
    reported_by: z.number().int().optional().nullable(),
    assigned_to: z.number().int().optional().nullable(),
    tanggal_lapor: z.string().optional().nullable(),
    tanggal_target: z.string().optional().nullable(),
    tanggal_selesai: z.string().optional().nullable(),
    biaya: z.number().optional().nullable(),
    keterangan: z.string().optional().nullable(),
});

export const validateFacilityWorkOrder = (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = workOrderSchema.parse(req.body);
        req.body = validatedData;
        delete req.body.code;
        next();
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.issues.map((err: any) => ({
                field: err.path.join('.'),
                message: err.message
            }));
            next(new AppError('Validation Error', 400, formattedErrors));
        } else {
            next(error);
        }
    }
};
