import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('inv_kategori', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        nama: { type: DataTypes.STRING(100), allowNull: false },
        type: {
            type: DataTypes.ENUM('Fixed Asset', 'Consumable'),
            allowNull: false,
        },
        keterangan: { type: DataTypes.TEXT, allowNull: true },
        status: {
            type: DataTypes.ENUM('Aktif', 'Tidak Aktif'),
            allowNull: false,
            defaultValue: 'Aktif',
        },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        deleted_at: { type: DataTypes.DATE, allowNull: true },
    });

    await queryInterface.addIndex('inv_kategori', ['status']);
    await queryInterface.addIndex('inv_kategori', ['nama']);
    await queryInterface.addIndex('inv_kategori', ['type']);
    await queryInterface.addIndex('inv_kategori', ['code']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('inv_kategori');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inv_kategori_type"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inv_kategori_status"');
};
