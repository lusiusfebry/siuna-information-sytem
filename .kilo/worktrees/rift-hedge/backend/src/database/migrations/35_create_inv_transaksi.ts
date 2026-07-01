import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('inv_transaksi', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        tipe: {
            type: DataTypes.ENUM('Masuk', 'Keluar', 'Adjustment'),
            allowNull: false,
        },
        sub_tipe: {
            type: DataTypes.ENUM('Supplier', 'Transfer Masuk', 'Retur Karyawan', 'Ke Karyawan', 'Transfer Gudang', 'Disposal', 'Opname'),
            allowNull: false,
        },
        tanggal: { type: DataTypes.DATEONLY, allowNull: false },
        gudang_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'inv_gudang', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        gudang_tujuan_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'inv_gudang', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        karyawan_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'employees', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        supplier_nama: { type: DataTypes.STRING(200), allowNull: true },
        no_referensi: { type: DataTypes.STRING(100), allowNull: true },
        catatan: { type: DataTypes.TEXT, allowNull: true },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.addIndex('inv_transaksi', ['tipe']);
    await queryInterface.addIndex('inv_transaksi', ['sub_tipe']);
    await queryInterface.addIndex('inv_transaksi', ['gudang_id']);
    await queryInterface.addIndex('inv_transaksi', ['karyawan_id']);
    await queryInterface.addIndex('inv_transaksi', ['tanggal']);
    await queryInterface.addIndex('inv_transaksi', ['code']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('inv_transaksi');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inv_transaksi_tipe"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inv_transaksi_sub_tipe"');
};
