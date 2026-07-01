import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {

    await queryInterface.createTable('employee_family_info', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        employee_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'employees',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        // Group Pasangan
        tanggal_lahir_pasangan: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        pendidikan_terakhir_pasangan: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        keterangan_pasangan: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Group Saudara Kandung
        anak_ke: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        jumlah_saudara_kandung: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        // Group Orang Tua Mertua (Ayah)
        nama_ayah_mertua: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        tanggal_lahir_ayah_mertua: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        pendidikan_terakhir_ayah_mertua: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        keterangan_ayah_mertua: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Group Orang Tua Mertua (Ibu)
        nama_ibu_mertua: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        tanggal_lahir_ibu_mertua: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        pendidikan_terakhir_ibu_mertua: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        keterangan_ibu_mertua: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Repeatable Fields (JSONB)
        data_anak: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: [],
        },
        data_saudara_kandung: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: [],
        },
        // Metadata
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

    // Add indexes
    await queryInterface.addIndex('employee_family_info', ['employee_id']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('employee_family_info');
};
