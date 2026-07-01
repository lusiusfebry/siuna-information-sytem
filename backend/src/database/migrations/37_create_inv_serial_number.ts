import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('inv_serial_number', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        produk_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'inv_produk', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        serial_number: { type: DataTypes.STRING(100), allowNull: false },
        gudang_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'inv_gudang', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        karyawan_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'employees', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        status: {
            type: DataTypes.ENUM('Tersedia', 'Digunakan', 'Rusak', 'Disposed'),
            allowNull: false,
            defaultValue: 'Tersedia',
        },
        transaksi_masuk_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'inv_transaksi', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        transaksi_terakhir_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'inv_transaksi', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.addIndex('inv_serial_number', ['produk_id', 'serial_number'], { unique: true });
    await queryInterface.addIndex('inv_serial_number', ['gudang_id']);
    await queryInterface.addIndex('inv_serial_number', ['karyawan_id']);
    await queryInterface.addIndex('inv_serial_number', ['status']);
    await queryInterface.addIndex('inv_serial_number', ['serial_number']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('inv_serial_number');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inv_serial_number_status"');
};
