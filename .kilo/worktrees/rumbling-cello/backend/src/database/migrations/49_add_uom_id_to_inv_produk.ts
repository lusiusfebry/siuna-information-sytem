import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.addColumn('inv_produk', 'uom_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'inv_uom', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('inv_produk', 'uom_id');
};
