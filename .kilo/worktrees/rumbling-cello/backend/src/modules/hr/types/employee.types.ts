import { EmployeeAttributes } from '../models/Employee';
import { EmployeePersonalInfoAttributes } from '../models/EmployeePersonalInfo';
import { EmployeeHRInfoAttributes } from '../models/EmployeeHRInfo';
import { EmployeeFamilyInfoAttributes, DataAnak, DataSaudaraKandung } from '../models/EmployeeFamilyInfo';

// Enums
export enum JenisKelamin {
    LAKI_LAKI = 'Laki-laki',
    PEREMPUAN = 'Perempuan'
}

export enum GolonganDarah {
    A = 'A',
    B = 'B',
    AB = 'AB',
    O = 'O'
}

// Re-export Data Interfaces
export { DataAnak, DataSaudaraKandung };

// DTO for create/update
export interface CreateEmployeeDTO {
    // Head section
    foto_karyawan?: string;
    nama_lengkap: string;
    nomor_induk_karyawan: string;
    divisi_id?: number;
    department_id?: number;
    manager_id?: number;
    atasan_langsung_id?: number;
    jumlah_saudara_kandung?: number;
    nama_ayah_kandung?: string;
    nama_ibu_kandung?: string;
    alamat_orang_tua?: string;
    nama_ayah_mertua?: string;
    posisi_jabatan_id?: number;
    email_perusahaan?: string;
    nomor_handphone?: string;
    status_karyawan_id?: number;
    lokasi_kerja_id?: number;
    tag_id?: number;

    // Personal info
    personal_info?: Partial<EmployeePersonalInfoAttributes>;

    // HR info
    hr_info?: Partial<EmployeeHRInfoAttributes>;

    // Family info
    family_info?: Partial<EmployeeFamilyInfoAttributes>;
}

export type UpdateEmployeeDTO = Partial<CreateEmployeeDTO>;

// Response DTO
export interface EmployeeDetailDTO extends Omit<EmployeeAttributes, 'personal_info' | 'hr_info' | 'family_info'> {
    personal_info?: EmployeePersonalInfoAttributes;
    hr_info?: EmployeeHRInfoAttributes;
    family_info?: EmployeeFamilyInfoAttributes;
}
