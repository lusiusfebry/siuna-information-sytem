import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('inv_gudang', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        nama: { type: DataTypes.STRING(100), allowNull: false },
        penanggung_jawab_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'employees', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        department_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'department', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        lokasi: { type: DataTypes.TEXT, allowNull: true },
        keterangan: { type: DataTypes.TEXT, allowNull: true },
        status: {
            type: DataTypes.ENUM('Aktif', 'Tidak Aktif'),
            allowNull: false,
            defaultValue: 'Aktif',
        },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        deleted_at: { type: DataTypes.DATE, allowNull: true },
    });

    await queryInterface.addIndex('inv_gudang', ['penanggung_jawab_id']);
    await queryInterface.addIndex('inv_gudang', ['department_id']);
    await queryInterface.addIndex('inv_gudang', ['status']);
    await queryInterface.addIndex('inv_gudang', ['nama']);
    await queryInterface.addIndex('inv_gudang', ['code']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('inv_gudang');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inv_gudang_status"');
};
