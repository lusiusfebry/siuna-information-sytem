import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('inv_stok', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        produk_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'inv_produk', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        gudang_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'inv_gudang', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        uom_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'inv_uom', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        jumlah: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.addIndex('inv_stok', ['produk_id', 'gudang_id'], { unique: true });
    await queryInterface.addIndex('inv_stok', ['produk_id']);
    await queryInterface.addIndex('inv_stok', ['gudang_id']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('inv_stok');
};
