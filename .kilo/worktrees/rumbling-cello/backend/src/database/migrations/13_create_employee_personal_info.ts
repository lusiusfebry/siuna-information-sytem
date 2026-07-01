import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {

    await queryInterface.createTable('employee_personal_info', {
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
        // Group Biodata
        jenis_kelamin: {
            type: DataTypes.ENUM('Laki-laki', 'Perempuan'),
            allowNull: true,
        },
        tempat_lahir: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        tanggal_lahir: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        email_pribadi: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        // Group Identifikasi
        agama: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        golongan_darah: {
            type: DataTypes.ENUM('A', 'B', 'AB', 'O'),
            allowNull: true,
        },
        nomor_kartu_keluarga: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        nomor_ktp: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        nomor_npwp: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        nomor_bpjs: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        no_nik_kk: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        status_pajak: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        // Group Alamat Domisili
        alamat_domisili: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        kota_domisili: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        provinsi_domisili: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        // Group Alamat KTP
        alamat_ktp: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        kota_ktp: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        provinsi_ktp: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        // Group Kontak
        nomor_handphone_2: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        nomor_telepon_rumah_1: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        nomor_telepon_rumah_2: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        // Group Status Pernikahan
        status_pernikahan: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        nama_pasangan: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        tanggal_menikah: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        tanggal_cerai: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        tanggal_wafat_pasangan: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        pekerjaan_pasangan: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        jumlah_anak: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        // Group Rekening Bank
        nomor_rekening: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        nama_pemegang_rekening: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        nama_bank: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        cabang_bank: {
            type: DataTypes.STRING(100),
            allowNull: true,
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
    await queryInterface.addIndex('employee_personal_info', ['employee_id']);
    await queryInterface.addIndex('employee_personal_info', ['nomor_ktp']);
    await queryInterface.addIndex('employee_personal_info', ['nomor_npwp']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('employee_personal_info');
};
