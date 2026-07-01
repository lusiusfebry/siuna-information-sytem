import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    // Create Leaves Table
    await queryInterface.createTable('leaves', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        employee_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'employees',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        tanggal_mulai: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        tanggal_selesai: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        jenis: {
            type: DataTypes.ENUM('Izin', 'Cuti'),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
            allowNull: false,
            defaultValue: 'Pending'
        },
        created_at: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    // Create Attendances Table
    await queryInterface.createTable('attendances', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        employee_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'employees',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        tanggal: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('Hadir', 'Telat', 'Ijin', 'Sakit', 'Alpa'),
            allowNull: false
        },
        jam_masuk: {
            type: DataTypes.TIME,
            allowNull: true
        },
        jam_keluar: {
            type: DataTypes.TIME,
            allowNull: true
        },
        created_at: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('attendances');
    await queryInterface.dropTable('leaves');
};
