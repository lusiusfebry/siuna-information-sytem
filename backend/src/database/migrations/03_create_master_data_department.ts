import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('department', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nama: { type: DataTypes.STRING(100), allowNull: false },
        divisi_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'divisi', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        manager_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            // references: { model: 'employees', key: 'id' }, // Removed to avoid circular dependency
            // onUpdate: 'CASCADE',
            // onDelete: 'SET NULL',
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

    await queryInterface.addIndex('department', ['divisi_id']);
    await queryInterface.addIndex('department', ['manager_id']);
    await queryInterface.addIndex('department', ['status']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('department');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_department_status');
};
