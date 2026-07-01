import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/errorHandler';

// Common schemas
const baseSchema = z.object({
    nama: z.string().min(1, 'Nama tidak boleh kosong'),
    keterangan: z.string().optional().nullable(),
    status: z.union([z.boolean(), z.string()])
        .transform(val => {
            if (val === true || val === 'true' || val === 'Aktif') return 'Aktif';
            return 'Tidak Aktif';
        })
        .optional()
        .default('Aktif'),
});

// Specific schemas
const divisiSchema = baseSchema;

const departmentSchema = baseSchema.extend({
    divisi_id: z.number().int().positive('Divisi harus dipilih'),
    manager_id: z.number().int().optional().nullable(),
});

const posisiSchema = baseSchema.extend({
    department_id: z.number().int().positive('Department harus dipilih'),
});

const tagSchema = baseSchema.extend({
    warna_tag: z.string().optional().nullable(),
});

const lokasiSchema = baseSchema.extend({
    alamat: z.string().optional().nullable(),
    kode_site: z.string().optional().nullable(),
});

// Map model name to schema
const schemaMap: Record<string, z.ZodSchema> = {
    'divisi': divisiSchema,
    'department': departmentSchema,
    'posisi-jabatan': posisiSchema,
    'tag': tagSchema,
    'lokasi-kerja': lokasiSchema,
    // Defaults for others
    'kategori-pangkat': baseSchema,
    'golongan': baseSchema,
    'sub-golongan': baseSchema,
    'jenis-hubungan-kerja': baseSchema,
    'status-karyawan': baseSchema,
};

export const validateMasterData = (req: Request, res: Response, next: NextFunction) => {
    const modelParams = req.params.model.replace(/_/g, '-');
    const schema = schemaMap[modelParams];

    if (!schema) {
        // If unknown model, maybe skip validation or loose validation?
        // For now, next() as controller checks model validity
        return next();
    }

    try {
        const validatedData = schema.parse(req.body);
        req.body = validatedData;
        delete req.body.code;
        next();
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const zodError = error as any;
            const formattedErrors = zodError.errors.map((err: any) => ({
                field: err.path.join('.'),
                message: err.message
            }));
            next(new AppError('Validation Error', 400, formattedErrors));
        } else {
            next(error);
        }
    }
};
