import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export type OpnameSerialKondisi = 'Ada' | 'Tidak Ada';

export class InvOpnameSerial extends Model {
    public id!: number;
    public opname_detail_id!: number;
    public serial_number_id!: number;
    public serial_number!: string | null;
    public tag_number!: string | null;
    public kondisi!: OpnameSerialKondisi;
    public catatan!: string | null;

    public detail?: any;
    public serial?: any;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

InvOpnameSerial.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    opname_detail_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'inv_opname_detail', key: 'id' },
    },
    serial_number_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'inv_serial_number', key: 'id' },
    },
    serial_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    tag_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    kondisi: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Ada',
    },
    catatan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize,
    tableName: 'inv_opname_serial',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    // Cocok dengan idx_opname_serial_detail_serial (migrasi 71). Wajib
    // dideklarasikan agar upsert() memakai ON CONFLICT (opname_detail_id,
    // serial_number_id).
    indexes: [
        {
            unique: true,
            name: 'idx_opname_serial_detail_serial',
            fields: ['opname_detail_id', 'serial_number_id'],
        },
    ],
});

export default InvOpnameSerial;
