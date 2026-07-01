import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('inv_brand', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        nama: { type: DataTypes.STRING(100), allowNull: false },
        sub_kategori_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'inv_sub_kategori', key: 'id' },
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
        deleted_at: { type: DataTypes.DATE, allowNull: true },
    });

    await queryInterface.addIndex('inv_brand', ['sub_kategori_id']);
    await queryInterface.addIndex('inv_brand', ['status']);
    await queryInterface.addIndex('inv_brand', ['nama']);
    await queryInterface.addIndex('inv_brand', ['code']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('inv_brand');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inv_brand_status"');
};
