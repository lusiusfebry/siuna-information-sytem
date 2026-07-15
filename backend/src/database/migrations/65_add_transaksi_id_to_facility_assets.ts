import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

// INV-C01: link a facility_assets placement back to the inventory transaction
// that created it, so "Ambil dari Gedung" can find and close the right row and
// so placements are traceable to their source movement. Manual placements
// (POST /facility/assets) that do not originate from a transaction leave this
// null. FK SET NULL keeps the placement row if the transaction is ever removed.

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.addColumn('facility_assets', 'transaksi_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'inv_transaksi', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('facility_assets', ['transaksi_id']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('facility_assets', 'transaksi_id');
};
