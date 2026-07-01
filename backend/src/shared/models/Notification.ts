import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

class Notification extends Model {
    public id!: number;
    public user_id!: number;
    public title!: string;
    public message!: string;
    public type!: string;
    public entity_type!: string | null;
    public entity_id!: number | null;
    public is_read!: boolean;
    public readonly created_at!: Date;
}

Notification.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'info',
    },
    entity_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
});

export default Notification;
