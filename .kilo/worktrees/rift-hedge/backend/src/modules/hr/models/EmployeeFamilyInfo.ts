import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../../config/database';
import Employee from './Employee';

// Interfaces for JSONB data
export interface DataAnak {
    nama: string;
    jenis_kelamin: 'Laki-laki' | 'Perempuan';
    tanggal_lahir: string; // Date string
    keterangan?: string;
}

export interface DataSaudaraKandung {
    nama: string;
    jenis_kelamin: 'Laki-laki' | 'Perempuan';
    tanggal_lahir: string; // Date string
    pendidikan_terakhir?: string;
    pekerjaan?: string;
    keterangan?: string;
}

export interface EmployeeFamilyInfoAttributes {
    id: number;
    employee_id: number;
    // Pasangan
    tanggal_lahir_pasangan?: string | null;
    pendidikan_terakhir_pasangan?: string | null;
    keterangan_pasangan?: string | null;
    // Saudara Kandung
    anak_ke?: number | null;
    jumlah_saudara_kandung?: number;
    // Orang Tua Mertua (Ayah)
    nama_ayah_mertua?: string | null;
    tanggal_lahir_ayah_mertua?: string | null;
    pendidikan_terakhir_ayah_mertua?: string | null;
    keterangan_ayah_mertua?: string | null;
    // Orang Tua Mertua (Ibu)
    nama_ibu_mertua?: string | null;
    tanggal_lahir_ibu_mertua?: string | null;
    pendidikan_terakhir_ibu_mertua?: string | null;
    keterangan_ibu_mertua?: string | null;
    // Orang Tua Kandung
    nama_ayah_kandung?: string | null;
    nama_ibu_kandung?: string | null;
    alamat_orang_tua?: string | null;
    // Repeatable Fields
    data_anak?: DataAnak[] | null;
    data_saudara_kandung?: DataSaudaraKandung[] | null;

    created_at?: Date;
    updated_at?: Date;

    // Associations
    employee?: Employee;
}

export type EmployeeFamilyInfoCreationAttributes = Optional<EmployeeFamilyInfoAttributes, 'id' | 'created_at' | 'updated_at'>;

export class EmployeeFamilyInfo extends Model<EmployeeFamilyInfoAttributes, EmployeeFamilyInfoCreationAttributes> implements EmployeeFamilyInfoAttributes {
    public id!: number;
    public employee_id!: number;
    public tanggal_lahir_pasangan?: string | null;
    public pendidikan_terakhir_pasangan?: string | null;
    public keterangan_pasangan?: string | null;
    public anak_ke?: number | null;
    public jumlah_saudara_kandung!: number;
    public nama_ayah_mertua?: string | null;
    public tanggal_lahir_ayah_mertua?: string | null;
    public pendidikan_terakhir_ayah_mertua?: string | null;
    public keterangan_ayah_mertua?: string | null;
    public nama_ibu_mertua?: string | null;
    public tanggal_lahir_ibu_mertua?: string | null;
    public pendidikan_terakhir_ibu_mertua?: string | null;
    public keterangan_ibu_mertua?: string | null;
    public nama_ayah_kandung?: string | null;
    public nama_ibu_kandung?: string | null;
    public alamat_orang_tua?: string | null;
    public data_anak?: DataAnak[] | null;
    public data_saudara_kandung?: DataSaudaraKandung[] | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    public readonly employee?: Employee;

    // Helpers
    public addAnak(anak: DataAnak) {
        const currentAnak = this.data_anak || [];
        this.data_anak = [...currentAnak, anak];
    }

    public removeAnak(index: number) {
        const currentAnak = this.data_anak || [];
        if (index >= 0 && index < currentAnak.length) {
            this.data_anak = currentAnak.filter((_, i) => i !== index);
        }
    }

    public addSaudaraKandung(saudara: DataSaudaraKandung) {
        const currentSaudara = this.data_saudara_kandung || [];
        if (currentSaudara.length >= 5) {
            throw new Error('Maksimal jumlah saudara kandung adalah 5');
        }
        this.data_saudara_kandung = [...currentSaudara, saudara];
    }

    public removeSaudaraKandung(index: number) {
        const currentSaudara = this.data_saudara_kandung || [];
        if (index >= 0 && index < currentSaudara.length) {
            this.data_saudara_kandung = currentSaudara.filter((_, i) => i !== index);
        }
    }
}

EmployeeFamilyInfo.init({
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
    tanggal_lahir_pasangan: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    pendidikan_terakhir_pasangan: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    keterangan_pasangan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    anak_ke: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    jumlah_saudara_kandung: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    nama_ayah_mertua: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    tanggal_lahir_ayah_mertua: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    pendidikan_terakhir_ayah_mertua: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    keterangan_ayah_mertua: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    nama_ibu_mertua: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    tanggal_lahir_ibu_mertua: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    pendidikan_terakhir_ibu_mertua: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    keterangan_ibu_mertua: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    nama_ayah_kandung: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    nama_ibu_kandung: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    alamat_orang_tua: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    data_anak: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
    },
    data_saudara_kandung: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
        validate: {
            checkLimit(value: any[]) {
                if (value && value.length > 5) {
                    throw new Error('Maksimal data saudara kandung hanya boleh 5');
                }
            }
        }
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
    tableName: 'employee_family_info',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default EmployeeFamilyInfo;
