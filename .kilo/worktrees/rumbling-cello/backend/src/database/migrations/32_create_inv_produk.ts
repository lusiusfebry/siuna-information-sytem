import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('inv_produk', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        nama: { type: DataTypes.STRING(100), allowNull: false },
        brand_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'inv_brand', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        has_serial_number: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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

    await queryInterface.addIndex('inv_produk', ['brand_id']);
    await queryInterface.addIndex('inv_produk', ['status']);
    await queryInterface.addIndex('inv_produk', ['nama']);
    await queryInterface.addIndex('inv_produk', ['code']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('inv_produk');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inv_produk_status"');
};
