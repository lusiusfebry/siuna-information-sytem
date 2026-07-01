import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// We only enforce MINIMAL validation for everyone now.

// We only enforce MINIMAL validation for everyone now.

export const employeeHeadSchema = z.object({
    nama_lengkap: z.string().min(1, { message: 'Nama lengkap wajib diisi' }).max(200),
    nomor_induk_karyawan: z.string().min(1).max(50),

    // Everything else is optional and loose
    divisi_id: z.any().optional(),
    department_id: z.any().optional(),
    manager_id: z.any().optional(),
    atasan_langsung_id: z.any().optional(),
    posisi_jabatan_id: z.any().optional(),
    email_perusahaan: z.string().optional().or(z.literal('')),
    nomor_handphone: z.string().optional().or(z.literal('')),
    status_karyawan_id: z.any().optional(),
    lokasi_kerja_id: z.any().optional(),
    tag_id: z.any().optional(),
});

export const employeePersonalInfoSchema = z.object({
    jenis_kelamin: z.any().optional(),
    tempat_lahir: z.string().optional(),
    tanggal_lahir: z.string().optional(),
    email_pribadi: z.string().optional().or(z.literal('')),
    agama: z.string().optional(),
    golongan_darah: z.any().optional(),
    nomor_kartu_keluarga: z.string().optional(),
    nomor_ktp: z.string().optional(),
    nomor_npwp: z.string().optional(),
    nomor_bpjs: z.string().optional(),
    no_nik_kk: z.string().optional(),
    status_pajak: z.string().optional(),
    alamat_domisili: z.string().optional(),
    kota_domisili: z.string().optional(),
    provinsi_domisili: z.string().optional(),
    alamat_ktp: z.string().optional(),
    kota_ktp: z.string().optional(),
    provinsi_ktp: z.string().optional(),
    nomor_handphone_2: z.string().optional().or(z.literal('')),
    nomor_telepon_rumah_1: z.string().optional().or(z.literal('')),
    nomor_telepon_rumah_2: z.string().optional().or(z.literal('')),
    status_pernikahan: z.string().optional(),
    nama_pasangan: z.string().optional(),
    tanggal_menikah: z.string().optional(),
    tanggal_cerai: z.string().optional(),
    tanggal_wafat_pasangan: z.string().optional(),
    pekerjaan_pasangan: z.string().optional(),
    jumlah_anak: z.any().optional(),
    nomor_rekening: z.string().optional(),
    nama_pemegang_rekening: z.string().optional(),
    nama_bank: z.string().optional(),
    cabang_bank: z.string().optional(),
});

export const employeeHRInfoSchema = z.object({
    jenis_hubungan_kerja_id: z.any().optional(),
    tanggal_masuk: z.string().optional(),
    tanggal_berhenti: z.string().optional(),
    tanggal_kontrak: z.string().optional(),
    tanggal_akhir_kontrak: z.string().optional(),
    tanggal_permanent: z.string().optional(),
    kategori_pangkat_id: z.any().optional(),
    golongan_pangkat_id: z.any().optional(),
    sub_golongan_pangkat_id: z.any().optional(),
    lokasi_sebelumnya_id: z.any().optional(),
});

export const validateEmployeeCreate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body;
        // User requested: Validasi HANYA NIK dan Nama.
        // So we strictly validate those, and leniently parse the rest.

        const minimalSchema = z.object({
            nomor_induk_karyawan: z.string().min(1, { message: 'NIK wajib diisi' }),
            nama_lengkap: z.string().min(1, { message: 'Nama Lengkap wajib diisi' }),
        });

        await minimalSchema.parseAsync(body);

        // Still try to parse others to ensure shape is correct, but schema is now relaxed
        await employeeHeadSchema.partial().parseAsync(body);
        await employeePersonalInfoSchema.partial().parseAsync(body);
        await employeeHRInfoSchema.partial().parseAsync(body);

        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: 'Validation Error',
                errors: error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }
        next(error);
    }
};

export const validateEmployeeUpdate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body;
        // RELAXED UPDATE: Same as create, only basics required if present.

        await employeeHeadSchema.partial().parseAsync(body);
        await employeePersonalInfoSchema.partial().parseAsync(body);
        await employeeHRInfoSchema.partial().parseAsync(body);

        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.log('Update Validation Error:', JSON.stringify(error.issues));
            return res.status(400).json({
                message: 'Validation Error',
                errors: error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }
        next(error);
    }
};
