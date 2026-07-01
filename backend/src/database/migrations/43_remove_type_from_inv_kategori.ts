import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeIndex('inv_kategori', ['type']);
    await queryInterface.removeColumn('inv_kategori', 'type');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inv_kategori_type"');
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.addColumn('inv_kategori', 'type', {
        type: DataTypes.ENUM('Fixed Asset', 'Consumable'),
        allowNull: true,
    });
    await queryInterface.addIndex('inv_kategori', ['type']);
};
