import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/errorHandler';

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

const kategoriSchema = baseSchema;

const subKategoriSchema = baseSchema.extend({
    kategori_id: z.number().int().positive('Kategori harus dipilih'),
    prefix_tag: z.string().optional().nullable(),
});

const brandSchema = baseSchema.extend({
    sub_kategori_id: z.number().int().positive('Sub Kategori harus dipilih'),
});

const uomSchema = baseSchema;

const produkSchema = baseSchema.extend({
    brand_id: z.number().int().positive('Brand harus dipilih'),
    has_serial_number: z.union([z.boolean(), z.string()])
        .transform(val => {
            if (val === true || val === 'true') return true;
            return false;
        })
        .optional()
        .default(false),
    has_tag_number: z.union([z.boolean(), z.string()])
        .transform(val => {
            if (val === true || val === 'true') return true;
            return false;
        })
        .optional()
        .default(false),
    is_consumable: z.union([z.boolean(), z.string()])
        .transform(val => {
            if (val === true || val === 'true') return true;
            return false;
        })
        .optional()
        .default(false),
    uom_id: z.number().int().positive().optional().nullable(),
    stok_minimum: z.coerce.number().int().min(0).optional().default(5),
}).superRefine((data, ctx) => {
    // A consumable is used the moment it leaves the warehouse, so per-unit tracking
    // makes no sense — reject the contradictory combination here (mirrors the runtime
    // guard in stok.service.validateKonsumsi).
    if ((data as any).is_consumable && ((data as any).has_serial_number || (data as any).has_tag_number)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Produk consumable tidak boleh memiliki serial number atau tag number',
            path: ['is_consumable'],
        });
    }
});

const gudangSchema = baseSchema.extend({
    penanggung_jawab_id: z.number().int().optional().nullable(),
    department_id: z.number().int().optional().nullable(),
    lokasi_kerja_id: z.number().int().optional().nullable(),
    lokasi: z.string().optional().nullable(),
});

const schemaMap: Record<string, z.ZodSchema> = {
    'kategori': kategoriSchema,
    'sub-kategori': subKategoriSchema,
    'brand': brandSchema,
    'uom': uomSchema,
    'produk': produkSchema,
    'gudang': gudangSchema,
};

export const validateInventoryMasterData = (req: Request, res: Response, next: NextFunction) => {
    const modelParams = req.params.model.replace(/_/g, '-');
    const schema = schemaMap[modelParams];

    if (!schema) {
        // Fail-closed: the 6 slugs in schemaMap are the complete set of valid
        // inventory master-data models. An unknown slug is a bad route/typo, not
        // something to silently pass through unvalidated (INV-M08).
        return next(new AppError(`Model master data inventory tidak dikenal: ${req.params.model}`, 400));
    }

    try {
        const validatedData = schema.parse(req.body);
        req.body = validatedData;
        delete req.body.code;
        next();
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const zodError = error as any;
            const formattedErrors = (zodError.issues ?? zodError.errors).map((err: any) => ({
                field: err.path.join('.'),
                message: err.message
            }));
            next(new AppError('Validation Error', 400, formattedErrors));
        } else {
            next(error);
        }
    }
};
