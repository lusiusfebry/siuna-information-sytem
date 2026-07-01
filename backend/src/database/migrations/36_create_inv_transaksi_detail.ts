import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('inv_transaksi_detail', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        transaksi_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'inv_transaksi', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        produk_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'inv_produk', key: 'id' },
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
        jumlah: { type: DataTypes.INTEGER, allowNull: false },
        catatan: { type: DataTypes.TEXT, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.addIndex('inv_transaksi_detail', ['transaksi_id']);
    await queryInterface.addIndex('inv_transaksi_detail', ['produk_id']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('inv_transaksi_detail');
};
