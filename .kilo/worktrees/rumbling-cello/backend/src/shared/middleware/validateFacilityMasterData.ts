import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/errorHandler';

const statusSchema = z.union([z.boolean(), z.string()])
    .transform(val => {
        if (val === true || val === 'true' || val === 'Aktif') return 'Aktif';
        return 'Tidak Aktif';
    })
    .optional()
    .default('Aktif');

const buildingSchema = z.object({
    nama: z.string().min(1, 'Nama gedung tidak boleh kosong'),
    alamat: z.string().optional().nullable(),
    jumlah_lantai: z.number().int().positive().optional().nullable(),
    lokasi_kerja_id: z.number().int().optional().nullable(),
    penanggung_jawab_id: z.number().int().optional().nullable(),
    keterangan: z.string().optional().nullable(),
    status: statusSchema,
});

const roomTypeSchema = z.object({
    nama: z.string().min(1, 'Nama tipe ruangan tidak boleh kosong'),
    keterangan: z.string().optional().nullable(),
    status: statusSchema,
});

const roomSchema = z.object({
    nama: z.string().min(1, 'Nama ruangan tidak boleh kosong'),
    building_id: z.number().int().positive('Gedung harus dipilih'),
    room_type_id: z.number().int().positive('Tipe ruangan harus dipilih'),
    lantai: z.number().int().optional().nullable(),
    kapasitas: z.number().int().positive().optional().default(1),
    keterangan: z.string().optional().nullable(),
    status: z.enum(['Tersedia', 'Penuh', 'Maintenance', 'Tidak Aktif']).optional().default('Tersedia'),
});

const maintenanceCategorySchema = z.object({
    nama: z.string().min(1, 'Nama kategori tidak boleh kosong'),
    keterangan: z.string().optional().nullable(),
    status: statusSchema,
});

const schemaMap: Record<string, z.ZodSchema> = {
    'building': buildingSchema,
    'room-type': roomTypeSchema,
    'room': roomSchema,
    'maintenance-category': maintenanceCategorySchema,
};

export const validateFacilityMasterData = (req: Request, res: Response, next: NextFunction) => {
    const modelParams = req.params.model.replace(/_/g, '-');
    const schema = schemaMap[modelParams];

    if (!schema) {
        return next();
    }

    try {
        const validatedData = schema.parse(req.body);
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
