import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../../config/database';
import Employee from './Employee';
import JenisHubunganKerja from './JenisHubunganKerja';
import KategoriPangkat from './KategoriPangkat';
import Golongan from './Golongan';
import SubGolongan from './SubGolongan';
import LokasiKerja from './LokasiKerja';

export interface EmployeeHRInfoAttributes {
    id: number;
    employee_id: number;
    // Kontrak
    jenis_hubungan_kerja_id?: number;
    tanggal_masuk_group?: string; // Date string (YYYY-MM-DD)
    tanggal_masuk?: string;
    tanggal_permanent?: string;
    tanggal_kontrak?: string;
    tanggal_akhir_kontrak?: string;
    tanggal_berhenti?: string;
    // Education
    tingkat_pendidikan?: string;
    bidang_studi?: string;
    nama_sekolah?: string;
    kota_sekolah?: string;
    status_kelulusan?: string;
    keterangan_pendidikan?: string;
    // Pangkat
    kategori_pangkat_id?: number;
    golongan_pangkat_id?: number;
    sub_golongan_pangkat_id?: number;
    no_dana_pensiun?: string;
    // Kontak Darurat (1)
    nama_kontak_darurat_1?: string;
    nomor_telepon_kontak_darurat_1?: string;
    hubungan_kontak_darurat_1?: string;
    alamat_kontak_darurat_1?: string;
    // Kontak Darurat (2)
    nama_kontak_darurat_2?: string;
    nomor_telepon_kontak_darurat_2?: string;
    hubungan_kontak_darurat_2?: string;
    alamat_kontak_darurat_2?: string;
    // POO/POH
    point_of_original?: string;
    point_of_hire?: string;
    // Seragam
    ukuran_seragam_kerja?: string;
    ukuran_sepatu_kerja?: string;
    // Pergerakan
    lokasi_sebelumnya_id?: number;
    tanggal_mutasi?: string;
    // Costing
    siklus_pembayaran_gaji?: string;
    costing?: string;
    assign?: string;
    actual?: string;

    created_at?: Date;
    updated_at?: Date;

    // Associations
    employee?: Employee;
    jenis_hubungan_kerja?: JenisHubunganKerja;
    kategori_pangkat?: KategoriPangkat;
    golongan_pangkat?: Golongan;
    sub_golongan_pangkat?: SubGolongan;
    lokasi_sebelumnya?: LokasiKerja;
}

export type EmployeeHRInfoCreationAttributes = Optional<EmployeeHRInfoAttributes, 'id' | 'created_at' | 'updated_at'>;

export class EmployeeHRInfo extends Model<EmployeeHRInfoAttributes, EmployeeHRInfoCreationAttributes> implements EmployeeHRInfoAttributes {
    public id!: number;
    public employee_id!: number;
    public jenis_hubungan_kerja_id?: number;
    public tanggal_masuk_group?: string;
    public tanggal_masuk?: string;
    public tanggal_permanent?: string;
    public tanggal_kontrak?: string;
    public tanggal_akhir_kontrak?: string;
    public tanggal_berhenti?: string;
    public tingkat_pendidikan?: string;
    public bidang_studi?: string;
    public nama_sekolah?: string;
    public kota_sekolah?: string;
    public status_kelulusan?: string;
    public keterangan_pendidikan?: string;
    public kategori_pangkat_id?: number;
    public golongan_pangkat_id?: number;
    public sub_golongan_pangkat_id?: number;
    public no_dana_pensiun?: string;
    public nama_kontak_darurat_1?: string;
    public nomor_telepon_kontak_darurat_1?: string;
    public hubungan_kontak_darurat_1?: string;
    public alamat_kontak_darurat_1?: string;
    public nama_kontak_darurat_2?: string;
    public nomor_telepon_kontak_darurat_2?: string;
    public hubungan_kontak_darurat_2?: string;
    public alamat_kontak_darurat_2?: string;
    public point_of_original?: string;
    public point_of_hire?: string;
    public ukuran_seragam_kerja?: string;
    public ukuran_sepatu_kerja?: string;
    public lokasi_sebelumnya_id?: number;
    public tanggal_mutasi?: string;
    public siklus_pembayaran_gaji?: string;
    public costing?: string;
    public assign?: string;
    public actual?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    public readonly employee?: Employee;
    public readonly jenis_hubungan_kerja?: JenisHubunganKerja;
    public readonly kategori_pangkat?: KategoriPangkat;
    public readonly golongan_pangkat?: Golongan;
    public readonly sub_golongan_pangkat?: SubGolongan;
    public readonly lokasi_sebelumnya?: LokasiKerja;
}

EmployeeHRInfo.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'employees',
            key: 'id'
        }
    },
    jenis_hubungan_kerja_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'jenis_hubungan_kerja',
            key: 'id'
        }
    },
    tanggal_masuk_group: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    tanggal_masuk: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    tanggal_permanent: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    tanggal_kontrak: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    tanggal_akhir_kontrak: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isAfterStartDate(value: string) {
                if (value && this.tanggal_kontrak) {
                    const endDate = new Date(value);
                    const startDate = new Date(this.tanggal_kontrak as string);
                    if (endDate < startDate) {
                        throw new Error('Tanggal akhir kontrak harus setelah tanggal kontrak');
                    }
                }
            }
        }
    },
    tanggal_berhenti: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    tingkat_pendidikan: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    bidang_studi: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    nama_sekolah: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    kota_sekolah: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    status_kelulusan: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    keterangan_pendidikan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    kategori_pangkat_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'kategori_pangkat',
            key: 'id'
        }
    },
    golongan_pangkat_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'golongan',
            key: 'id'
        }
    },
    sub_golongan_pangkat_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'sub_golongan',
            key: 'id'
        }
    },
    no_dana_pensiun: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    nama_kontak_darurat_1: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    nomor_telepon_kontak_darurat_1: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    hubungan_kontak_darurat_1: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    alamat_kontak_darurat_1: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    nama_kontak_darurat_2: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    nomor_telepon_kontak_darurat_2: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    hubungan_kontak_darurat_2: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    alamat_kontak_darurat_2: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    point_of_original: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    point_of_hire: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    ukuran_seragam_kerja: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    ukuran_sepatu_kerja: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    lokasi_sebelumnya_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'lokasi_kerja',
            key: 'id'
        }
    },
    tanggal_mutasi: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    siklus_pembayaran_gaji: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    costing: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    assign: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    actual: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    tableName: 'employee_hr_info',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default EmployeeHRInfo;
