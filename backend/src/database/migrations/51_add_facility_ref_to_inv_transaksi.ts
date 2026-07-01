import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.addColumn('inv_transaksi', 'facility_building_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'facility_buildings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('inv_transaksi', 'facility_room_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'facility_rooms', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('inv_transaksi', ['facility_building_id']);
    await queryInterface.addIndex('inv_transaksi', ['facility_room_id']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('inv_transaksi', 'facility_room_id');
    await queryInterface.removeColumn('inv_transaksi', 'facility_building_id');
};
