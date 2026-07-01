import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('tag', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nama: { type: DataTypes.STRING(100), allowNull: false },
        warna_tag: {
            type: DataTypes.STRING(7), // Hex color code #RRGGBB
            allowNull: false,
            defaultValue: '#3B82F6', // Default blue
        },
        keterangan: { type: DataTypes.TEXT, allowNull: true },
        status: {
            type: DataTypes.ENUM('Aktif', 'Tidak Aktif'),
            allowNull: false,
            defaultValue: 'Aktif',
        },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.addIndex('tag', ['status']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('tag');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_tag_status');
};
