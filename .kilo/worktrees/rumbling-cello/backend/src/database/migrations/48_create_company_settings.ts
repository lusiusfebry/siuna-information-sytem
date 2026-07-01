import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('company_settings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            defaultValue: 1,
        },
        company_name: {
            type: DataTypes.STRING(200),
            allowNull: false,
            defaultValue: 'Bebang Sistem Informasi',
        },
        company_short_name: {
            type: DataTypes.STRING(50),
            defaultValue: 'BIS',
        },
        company_legal_name: {
            type: DataTypes.STRING(200),
            defaultValue: 'PT Prima Sarana Gemilang',
        },
        company_tagline: {
            type: DataTypes.STRING(200),
            defaultValue: 'Sistem Informasi Terintegrasi',
        },
        logo_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        favicon_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        website: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        app_version: {
            type: DataTypes.STRING(20),
            defaultValue: '1.0.0',
        },
        footer_text: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    });

    await queryInterface.sequelize.query(
        `ALTER TABLE company_settings ADD CONSTRAINT company_settings_singleton CHECK (id = 1)`
    );

    await queryInterface.bulkInsert('company_settings', [{
        id: 1,
        company_name: 'Bebang Sistem Informasi',
        company_short_name: 'BIS',
        company_legal_name: 'PT Prima Sarana Gemilang',
        company_tagline: 'Sistem Informasi Terintegrasi',
        app_version: '1.0.0',
        created_at: new Date(),
        updated_at: new Date(),
    }]);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('company_settings');
};
