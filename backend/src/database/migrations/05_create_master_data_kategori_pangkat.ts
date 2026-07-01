import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('kategori_pangkat', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nama: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        keterangan: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('Aktif', 'Tidak Aktif'),
            allowNull: false,
            defaultValue: 'Aktif',
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });

    await queryInterface.addIndex('kategori_pangkat', ['status']);
    await queryInterface.addIndex('kategori_pangkat', ['nama']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('kategori_pangkat');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_kategori_pangkat_status');
};
