import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../../config/database';
import Divisi from './Divisi';
import Department from './Department';
import PosisiJabatan from './PosisiJabatan';
import StatusKaryawan from './StatusKaryawan';
import LokasiKerja from './LokasiKerja';
import Tag from './Tag';
import EmployeePersonalInfo from './EmployeePersonalInfo';
import EmployeeHRInfo from './EmployeeHRInfo';
import EmployeeFamilyInfo from './EmployeeFamilyInfo';
import Leave from './Leave';
import Attendance from './Attendance';

export interface EmployeeAttributes {
    id: number;
    foto_karyawan?: string;
    nama_lengkap: string;
    nomor_induk_karyawan: string;
    divisi_id?: number;
    department_id?: number;
    manager_id?: number;
    // ... existing attributes ...
    leaves?: Leave[];
    attendances?: Attendance[];
    atasan_langsung_id?: number;
    posisi_jabatan_id?: number;
    email_perusahaan?: string;
    nomor_handphone?: string;
    status_karyawan_id?: number;
    lokasi_kerja_id?: number;
    tag_id?: number;
    is_draft?: boolean;

    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;

    // Associations
    divisi?: Divisi;
    department?: Department;
    posisi_jabatan?: PosisiJabatan;
    status_karyawan?: StatusKaryawan;
    lokasi_kerja?: LokasiKerja;
    tag?: Tag;
    manager?: Employee;
    atasan_langsung?: Employee;
    personal_info?: EmployeePersonalInfo;
    hr_info?: EmployeeHRInfo;
    family_info?: EmployeeFamilyInfo;
}

// Updated EmployeeCreationAttributes to include all nullable fields as optional
export type EmployeeCreationAttributes = Optional<EmployeeAttributes,
    'id' |
    'createdAt' |
    'updatedAt' |
    'foto_karyawan' |
    'divisi_id' |
    'department_id' |
    'manager_id' |
    'atasan_langsung_id' |
    'posisi_jabatan_id' |
    'email_perusahaan' |
    'nomor_handphone' |
    'status_karyawan_id' |
    'lokasi_kerja_id' |
    'tag_id' |
    'is_draft'
>;

export class Employee extends Model<EmployeeAttributes, EmployeeCreationAttributes> implements EmployeeAttributes {
    public id!: number;
    // Updated class properties to be optional/nullable where allowNull is true
    public foto_karyawan?: string;
    public nama_lengkap!: string;
    public nomor_induk_karyawan!: string;
    public divisi_id?: number;
    public department_id?: number;
    public manager_id?: number;
    public atasan_langsung_id?: number;
    public posisi_jabatan_id?: number;
    public email_perusahaan?: string;
    public nomor_handphone?: string;
    public status_karyawan_id?: number;
    public lokasi_kerja_id?: number;
    public tag_id?: number;
    public is_draft?: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Association Mixins
    public readonly divisi?: Divisi;
    public readonly department?: Department;
    public readonly posisi_jabatan?: PosisiJabatan;
    public readonly status_karyawan?: StatusKaryawan;
    public readonly lokasi_kerja?: LokasiKerja;
    public readonly tag?: Tag;
    public readonly manager?: Employee;
    public readonly atasan_langsung?: Employee;
    public readonly personal_info?: EmployeePersonalInfo;
    public readonly hr_info?: EmployeeHRInfo;
    public readonly family_info?: EmployeeFamilyInfo;
}

Employee.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    foto_karyawan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    nama_lengkap: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    nomor_induk_karyawan: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    divisi_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'divisi',
            key: 'id'
        }
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'department',
            key: 'id'
        }
    },
    manager_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id'
        }
    },
    atasan_langsung_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id'
        }
    },
    posisi_jabatan_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'posisi_jabatan',
            key: 'id'
        }
    },
    email_perusahaan: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true,
        },
    },
    nomor_handphone: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    status_karyawan_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'status_karyawan',
            key: 'id'
        }
    },
    lokasi_kerja_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'lokasi_kerja',
            key: 'id'
        }
    },
    tag_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tag',
            key: 'id'
        }
    },
    is_draft: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    sequelize,
    tableName: 'employees',
});

export default Employee;
