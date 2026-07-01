import { z } from 'zod';
import { validateNIK, validateNPWP, validatePhoneNumber, calculateAge, validateEmployeeNIK } from '../utils/validators';
import { ERROR_MESSAGES } from '../constants/error-messages';

// Helper for custom refinements
const customRefine = (validator: (val: string) => boolean) => {
    return (val: string | undefined | null) => {
        if (!val) return true; // Skip empty
        return validator(val);
    };
};

export const employeeStep1Schema = z.object({
    // Head / Basic Info
    nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi').max(200, 'Maksimal 200 karakter'),
    nomor_induk_karyawan: z.string().min(1, 'NIK wajib diisi').max(8, 'Maksimal 8 karakter')
        .refine(customRefine(validateEmployeeNIK), { message: 'Format NIK tidak valid (xx-xxxxx)' }),
    foto_karyawan: z.instanceof(File).optional().nullable().or(z.string().optional().nullable()),

    // Organization
    divisi_id: z.coerce.number().optional().nullable(),
    department_id: z.coerce.number().optional().nullable(),
    posisi_jabatan_id: z.coerce.number().optional().nullable(),
    status_karyawan_id: z.coerce.number().optional().nullable(),
    lokasi_kerja_id: z.coerce.number().optional().nullable(),
    tag_id: z.coerce.number().optional().nullable(),
    manager_id: z.coerce.number().optional().nullable(),
    atasan_langsung_id: z.coerce.number().optional().nullable(),

    // Contacts
    email_perusahaan: z.string().email(ERROR_MESSAGES.EMAIL_INVALID_FORMAT).optional().nullable().or(z.literal('')),
    nomor_handphone: z.string().max(20, 'Maksimal 20 karakter').optional().nullable().or(z.literal(''))
        .refine(customRefine(validatePhoneNumber), { message: ERROR_MESSAGES.PHONE_INVALID_FORMAT }),
    nomor_wa: z.string().max(20, 'Maksimal 20 karakter').optional().nullable().or(z.literal(''))
        .refine(customRefine(validatePhoneNumber), { message: ERROR_MESSAGES.PHONE_INVALID_FORMAT }),
    akun_sosmed: z.string().max(255).optional().nullable().or(z.literal('')),

    // Personal Info - Biodata
    jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']).optional().nullable(),
    tempat_lahir: z.string().max(100).optional().nullable(),
    tanggal_lahir: z.string().optional().nullable()
        .refine((val) => !val || calculateAge(val) >= 17, { message: ERROR_MESSAGES.AGE_BELOW_MINIMUM }),
    agama: z.string().optional().nullable(),
    golongan_darah: z.enum(['A', 'B', 'AB', 'O']).optional().nullable(),
    status_pernikahan: z.string().optional().nullable(),

    // Personal Info - Identity & Contracts
    nomor_ktp: z.string().min(16, 'No KTP minimal 16 karakter').optional().nullable().or(z.literal(''))
        .refine(customRefine(validateNIK), { message: 'No KTP harus 16 digit angka' }),
    nomor_npwp: z.string().optional().nullable()
        .refine(customRefine(validateNPWP), { message: ERROR_MESSAGES.NPWP_INVALID_FORMAT }),
    nomor_bpjs: z.string().optional().nullable(), // No format validation - BPJS numbers vary
    nomor_kartu_keluarga: z.string().max(50).optional().nullable().or(z.literal(''))
        .refine(customRefine(validateNIK), { message: 'Nomor KK harus 16 digit angka' }),
    no_nik_kk: z.string().optional().nullable(),
    status_pajak: z.string().optional().nullable(),
    email_pribadi: z.string().email(ERROR_MESSAGES.EMAIL_INVALID_FORMAT).optional().nullable().or(z.literal('')),
    nomor_handphone_2: z.string().max(20).optional().nullable().or(z.literal(''))
        .refine(customRefine(validatePhoneNumber), { message: ERROR_MESSAGES.PHONE_INVALID_FORMAT }),
    nomor_telepon_rumah_1: z.string().max(20).optional().nullable().or(z.literal(''))
        .refine(customRefine(validatePhoneNumber), { message: ERROR_MESSAGES.PHONE_INVALID_FORMAT }),
    nomor_telepon_rumah_2: z.string().max(20).optional().nullable().or(z.literal(''))
        .refine(customRefine(validatePhoneNumber), { message: ERROR_MESSAGES.PHONE_INVALID_FORMAT }),

    // Personal Info - Address KTP
    alamat_ktp: z.string().optional().nullable(),
    kota_ktp: z.string().optional().nullable(),
    provinsi_ktp: z.string().optional().nullable(),

    // Personal Info - Address Domisili
    alamat_domisili: z.string().optional().nullable(),
    kota_domisili: z.string().optional().nullable(),
    provinsi_domisili: z.string().optional().nullable(),
    kode_pos: z.string().max(10, 'Maksimal 10 karakter').optional().nullable().or(z.literal('')),

    // Family Info Details
    nama_pasangan: z.string().optional().nullable(),
    tanggal_menikah: z.string().optional().nullable(),
    tanggal_cerai: z.string().optional().nullable(),
    tanggal_wafat_pasangan: z.string().optional().nullable(),
    pekerjaan_pasangan: z.string().optional().nullable(),
    jumlah_anak: z.coerce.number().optional().nullable(),

    // Bank Info
    nomor_rekening: z.string().optional().nullable(),
    nama_pemegang_rekening: z.string().optional().nullable(),
    nama_bank: z.string().optional().nullable(),
    cabang_bank: z.string().optional().nullable(),
}).superRefine((data) => {
    if (data.divisi_id && data.department_id) {
        // Should validate department belongs to divisi.
        // Since we can't async call API in sync Zod superRefine easily without side effects or complexity,
        // we usually rely on form/hook logic to clear mismatch.
        // Here we just placeholder or remove if logic is handled in UI.
        // UI cascade handles clearing, so invalid combination is unlikely unless forced.
    }
});

export type EmployeeStep1FormValues = z.infer<typeof employeeStep1Schema>;

export const employeeStep2Schema = z.object({
    // Kepegawaian (Reference Fields - Read Only in Form but validated here if needed)
    nomor_induk_karyawan: z.string().optional().nullable(),
    posisi_jabatan_id: z.coerce.number().optional().nullable(),
    divisi_id: z.coerce.number().optional().nullable(),
    department_id: z.coerce.number().optional().nullable(),
    email_perusahaan: z.string().optional().nullable(),
    manager_id: z.coerce.number().optional().nullable(),
    atasan_langsung_id: z.coerce.number().optional().nullable(),

    // Kontrak
    jenis_hubungan_kerja_id: z.coerce.number().optional().nullable(),
    tanggal_masuk: z.string().optional().nullable(), // Date string YYYY-MM-DD
    tanggal_masuk_group: z.string().optional().nullable(),
    tanggal_permanent: z.string().optional().nullable(),
    tanggal_kontrak: z.string().optional().nullable(),
    tanggal_akhir_kontrak: z.string().optional().nullable(),
    tanggal_berhenti: z.string().optional().nullable(),

    // Education
    tingkat_pendidikan: z.string().optional().nullable(),
    bidang_studi: z.string().optional().nullable(),
    nama_sekolah: z.string().optional().nullable(),
    kota_sekolah: z.string().optional().nullable(),
    status_kelulusan: z.string().optional().nullable(),
    keterangan_pendidikan: z.string().optional().nullable(),

    // Pangkat
    kategori_pangkat_id: z.coerce.number().optional().nullable(),
    golongan_pangkat_id: z.coerce.number().optional().nullable(),
    sub_golongan_pangkat_id: z.coerce.number().optional().nullable(),
    no_dana_pensiun: z.string().optional().nullable(),

    // Kontak Darurat 1
    nama_kontak_darurat_1: z.string().optional().nullable(),
    nomor_telepon_kontak_darurat_1: z.string().optional().nullable().or(z.literal(''))
        .refine(customRefine(validatePhoneNumber), { message: ERROR_MESSAGES.PHONE_INVALID_FORMAT }),
    hubungan_kontak_darurat_1: z.string().optional().nullable(),
    alamat_kontak_darurat_1: z.string().optional().nullable(),

    // Kontak Darurat 2
    nama_kontak_darurat_2: z.string().optional().nullable(),
    nomor_telepon_kontak_darurat_2: z.string().optional().nullable().or(z.literal(''))
        .refine(customRefine(validatePhoneNumber), { message: ERROR_MESSAGES.PHONE_INVALID_FORMAT }),
    hubungan_kontak_darurat_2: z.string().optional().nullable(),
    alamat_kontak_darurat_2: z.string().optional().nullable(),

    // POO/POH
    point_of_original: z.string().optional().nullable(),
    point_of_hire: z.string().optional().nullable(),

    // Seragam
    ukuran_seragam_kerja: z.string().optional().nullable(),
    ukuran_sepatu_kerja: z.string().optional().nullable(),

    // Pergerakan
    lokasi_sebelumnya_id: z.coerce.number().optional().nullable(),
    tanggal_mutasi: z.string().optional().nullable(),

    // Costing
    siklus_pembayaran_gaji: z.string().optional().nullable(),
    costing: z.string().optional().nullable(),
    assign: z.string().optional().nullable(),
    actual: z.string().optional().nullable(),
}).refine(data => {
    if (data.tanggal_kontrak && data.tanggal_akhir_kontrak) {
        return new Date(data.tanggal_akhir_kontrak) > new Date(data.tanggal_kontrak);
    }
    return true;
}, {
    message: ERROR_MESSAGES.CONTRACT_DATE_INVALID,
    path: ["tanggal_akhir_kontrak"]
}).refine(data => {
    if (data.tanggal_masuk && data.tanggal_permanent) {
        return new Date(data.tanggal_permanent) >= new Date(data.tanggal_masuk);
    }
    return true;
}, {
    message: ERROR_MESSAGES.PERMANENT_DATE_INVALID,
    path: ["tanggal_permanent"]
});

export type EmployeeStep2FormValues = z.infer<typeof employeeStep2Schema>;


export const dataAnakSchema = z.object({
    nama: z.string().optional().nullable(),
    jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']).optional().nullable(),
    tanggal_lahir: z.string().optional().nullable(),
    keterangan: z.string().optional().nullable()
});

export const dataSaudaraKandungSchema = z.object({
    nama: z.string().optional().nullable(),
    jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']).optional().nullable(),
    tanggal_lahir: z.string().optional().nullable(),
    pendidikan_terakhir: z.string().optional().nullable(),
    pekerjaan: z.string().optional().nullable(),
    keterangan: z.string().optional().nullable()
});

export const employeeStep3Schema = z.object({
    // Pasangan
    tanggal_lahir_pasangan: z.string().optional().nullable(),
    pendidikan_terakhir_pasangan: z.string().optional().nullable(),
    keterangan_pasangan: z.string().optional().nullable(),

    // Saudara Kandung
    anak_ke: z.coerce.number().optional().nullable(),
    jumlah_saudara_kandung: z.coerce.number().max(5, 'Maksimal 5 saudara kandung').optional().nullable(),

    // Orang Tua Kandung
    nama_ayah_kandung: z.string().optional().nullable(),
    nama_ibu_kandung: z.string().optional().nullable(),
    alamat_orang_tua: z.string().optional().nullable(),

    // Mertua
    nama_ayah_mertua: z.string().optional().nullable(),
    tanggal_lahir_ayah_mertua: z.string().optional().nullable(),
    pendidikan_terakhir_ayah_mertua: z.string().optional().nullable(),
    keterangan_ayah_mertua: z.string().optional().nullable(),
    nama_ibu_mertua: z.string().optional().nullable(),
    tanggal_lahir_ibu_mertua: z.string().optional().nullable(),
    pendidikan_terakhir_ibu_mertua: z.string().optional().nullable(),
    keterangan_ibu_mertua: z.string().optional().nullable(),

    // Repeatable Fields
    data_anak: z.array(dataAnakSchema).optional().nullable(),
    data_saudara_kandung: z.array(dataSaudaraKandungSchema).max(5, 'Maksimal 5 saudara kandung').optional().nullable(),
    // Hidden field to cross-validate with Step 1 data
    jumlah_anak_step1: z.coerce.number().optional().nullable(),
}).superRefine((data, ctx) => {
    if (data.jumlah_anak_step1 !== undefined && data.jumlah_anak_step1 !== null) {
        if (data.data_anak && data.data_anak.length > data.jumlah_anak_step1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Jumlah data anak (${data.data_anak.length}) tidak boleh melebihi jumlah anak yang diisi (${data.jumlah_anak_step1})`,
                path: ["data_anak"]
            });
        }
    }
});

export type EmployeeStep3FormValues = z.infer<typeof employeeStep3Schema>;
