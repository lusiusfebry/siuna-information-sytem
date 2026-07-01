import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export interface CompanySettingsAttributes {
    id: number;
    company_name: string;
    company_short_name: string;
    company_legal_name: string;
    company_tagline: string;
    logo_url: string | null;
    favicon_url: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    app_version: string;
    footer_text: string | null;
    created_at?: Date;
    updated_at?: Date;
}

export class CompanySettings extends Model<CompanySettingsAttributes> implements CompanySettingsAttributes {
    public id!: number;
    public company_name!: string;
    public company_short_name!: string;
    public company_legal_name!: string;
    public company_tagline!: string;
    public logo_url!: string | null;
    public favicon_url!: string | null;
    public address!: string | null;
    public phone!: string | null;
    public email!: string | null;
    public website!: string | null;
    public app_version!: string;
    public footer_text!: string | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

CompanySettings.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
        company_name: { type: DataTypes.STRING(200), allowNull: false },
        company_short_name: { type: DataTypes.STRING(50) },
        company_legal_name: { type: DataTypes.STRING(200) },
        company_tagline: { type: DataTypes.STRING(200) },
        logo_url: { type: DataTypes.TEXT },
        favicon_url: { type: DataTypes.TEXT },
        address: { type: DataTypes.TEXT },
        phone: { type: DataTypes.STRING(50) },
        email: { type: DataTypes.STRING(100) },
        website: { type: DataTypes.STRING(200) },
        app_version: { type: DataTypes.STRING(20) },
        footer_text: { type: DataTypes.STRING(200) },
        created_at: { type: DataTypes.DATE },
        updated_at: { type: DataTypes.DATE },
    },
    {
        sequelize,
        tableName: 'company_settings',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default CompanySettings;
