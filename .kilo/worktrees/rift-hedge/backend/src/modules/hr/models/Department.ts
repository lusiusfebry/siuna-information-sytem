import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export class Department extends Model {
    public id!: number;
    public code!: string;
    public nama!: string;
    public divisi_id!: number;
    public manager_id!: number | null;
    public keterangan!: string | null;
    public status!: 'Aktif' | 'Tidak Aktif';

    public divisi?: any;
    public manager?: any;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

Department.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    nama: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Nama department tidak boleh kosong' },
        },
    },
    divisi_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'divisi',
            key: 'id',
        },
    },
    manager_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
    },
    keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('Aktif', 'Tidak Aktif'),
        allowNull: false,
        defaultValue: 'Aktif',
    },
}, {
    sequelize,
    tableName: 'department',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
});

export default Department;
