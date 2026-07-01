import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../../config/database';
import Employee from './Employee';

export interface EmployeePersonalInfoAttributes {
    id: number;
    employee_id: number;
    // Biodata
    jenis_kelamin?: 'Laki-laki' | 'Perempuan';
    tempat_lahir?: string;
    tanggal_lahir?: string; // Date string (YYYY-MM-DD)
    email_pribadi?: string;
    // Identifikasi
    agama?: string;
    golongan_darah?: 'A' | 'B' | 'AB' | 'O';
    nomor_kartu_keluarga?: string;
    nomor_ktp?: string;
    nomor_npwp?: string;
    nomor_bpjs?: string;
    no_nik_kk?: string;
    status_pajak?: string;
    // Alamat Domisili
    alamat_domisili?: string;
    kota_domisili?: string;
    provinsi_domisili?: string;
    // Alamat KTP
    alamat_ktp?: string;
    kota_ktp?: string;
    provinsi_ktp?: string;
    // Kontak
    nomor_handphone_2?: string;
    nomor_telepon_rumah_1?: string;
    nomor_telepon_rumah_2?: string;
    // Status Pernikahan
    status_pernikahan?: string;
    nama_pasangan?: string;
    tanggal_menikah?: string;
    tanggal_cerai?: string;
    tanggal_wafat_pasangan?: string;
    pekerjaan_pasangan?: string;
    jumlah_anak?: number;
    // Rekening Bank
    nomor_rekening?: string;
    nama_pemegang_rekening?: string;
    nama_bank?: string;
    cabang_bank?: string;
    // New fields
    nomor_wa?: string;
    akun_sosmed?: string;
    kode_pos?: string;

    created_at?: Date;
    updated_at?: Date;

    // Associations
    employee?: Employee;
}

export type EmployeePersonalInfoCreationAttributes = Optional<EmployeePersonalInfoAttributes, 'id' | 'created_at' | 'updated_at'>;

export class EmployeePersonalInfo extends Model<EmployeePersonalInfoAttributes, EmployeePersonalInfoCreationAttributes> implements EmployeePersonalInfoAttributes {
    public id!: number;
    public employee_id!: number;
    public jenis_kelamin?: 'Laki-laki' | 'Perempuan';
    public tempat_lahir?: string;
    public tanggal_lahir?: string;
    public email_pribadi?: string;
    public agama?: string;
    public golongan_darah?: 'A' | 'B' | 'AB' | 'O';
    public nomor_kartu_keluarga?: string;
    public nomor_ktp?: string;
    public nomor_npwp?: string;
    public nomor_bpjs?: string;
    public no_nik_kk?: string;
    public status_pajak?: string;
    public alamat_domisili?: string;
    public kota_domisili?: string;
    public provinsi_domisili?: string;
    public alamat_ktp?: string;
    public kota_ktp?: string;
    public provinsi_ktp?: string;
    public nomor_handphone_2?: string;
    public nomor_telepon_rumah_1?: string;
    public nomor_telepon_rumah_2?: string;
    public status_pernikahan?: string;
    public nama_pasangan?: string;
    public tanggal_menikah?: string;
    public tanggal_cerai?: string;
    public tanggal_wafat_pasangan?: string;
    public pekerjaan_pasangan?: string;
    public jumlah_anak?: number;
    public nomor_rekening?: string;
    public nama_pemegang_rekening?: string;
    public nama_bank?: string;
    public cabang_bank?: string;
    public nomor_wa?: string;
    public akun_sosmed?: string;
    public kode_pos?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    public readonly employee?: Employee;
}

EmployeePersonalInfo.init({
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
    jenis_kelamin: {
        type: DataTypes.ENUM('Laki-laki', 'Perempuan'),
        allowNull: true,
    },
    tempat_lahir: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    tanggal_lahir: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    email_pribadi: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true,
        }
    },
    agama: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    golongan_darah: {
        type: DataTypes.ENUM('A', 'B', 'AB', 'O'),
        allowNull: true,
    },
    nomor_kartu_keluarga: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    nomor_ktp: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    nomor_npwp: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    nomor_bpjs: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    no_nik_kk: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    status_pajak: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    alamat_domisili: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    kota_domisili: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    provinsi_domisili: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    alamat_ktp: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    kota_ktp: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    provinsi_ktp: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    nomor_handphone_2: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    nomor_telepon_rumah_1: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    nomor_telepon_rumah_2: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    status_pernikahan: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    nama_pasangan: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    tanggal_menikah: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    tanggal_cerai: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    tanggal_wafat_pasangan: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    pekerjaan_pasangan: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    jumlah_anak: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    nomor_rekening: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    nama_pemegang_rekening: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    nama_bank: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    cabang_bank: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    nomor_wa: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    akun_sosmed: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    kode_pos: {
        type: DataTypes.STRING(10),
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
    tableName: 'employee_personal_info',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default EmployeePersonalInfo;
