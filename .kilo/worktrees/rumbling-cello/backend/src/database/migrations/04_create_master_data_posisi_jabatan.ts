import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('posisi_jabatan', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nama: { type: DataTypes.STRING(100), allowNull: false },
        department_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'department', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
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

    await queryInterface.addIndex('posisi_jabatan', ['department_id']);
    await queryInterface.addIndex('posisi_jabatan', ['status']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('posisi_jabatan');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_posisi_jabatan_status');
};
