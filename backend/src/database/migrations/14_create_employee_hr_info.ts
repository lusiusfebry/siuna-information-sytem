import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {

    await queryInterface.createTable('employee_hr_info', {
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
        // Group Kontrak
        jenis_hubungan_kerja_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'jenis_hubungan_kerja',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        tanggal_masuk_group: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        tanggal_masuk: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        tanggal_permanent: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        tanggal_kontrak: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        tanggal_akhir_kontrak: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        tanggal_berhenti: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        // Group Education
        tingkat_pendidikan: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        bidang_studi: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        nama_sekolah: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        kota_sekolah: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        status_kelulusan: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        keterangan_pendidikan: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Group Pangkat
        kategori_pangkat_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'kategori_pangkat',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        golongan_pangkat_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'golongan',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        sub_golongan_pangkat_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'sub_golongan',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        no_dana_pensiun: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        // Group Kontak Darurat (1)
        nama_kontak_darurat_1: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        nomor_telepon_kontak_darurat_1: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        hubungan_kontak_darurat_1: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        alamat_kontak_darurat_1: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Group Kontak Darurat (2)
        nama_kontak_darurat_2: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        nomor_telepon_kontak_darurat_2: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        hubungan_kontak_darurat_2: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        alamat_kontak_darurat_2: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Group POO/POH
        point_of_original: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        point_of_hire: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        // Group Seragam
        ukuran_seragam_kerja: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        ukuran_sepatu_kerja: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        // Group Pergerakan
        lokasi_sebelumnya_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'lokasi_kerja',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        tanggal_mutasi: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        // Group Costing
        siklus_pembayaran_gaji: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        costing: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        assign: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        actual: {
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
    await queryInterface.addIndex('employee_hr_info', ['employee_id']);
    await queryInterface.addIndex('employee_hr_info', ['jenis_hubungan_kerja_id']);
    await queryInterface.addIndex('employee_hr_info', ['kategori_pangkat_id']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('employee_hr_info');
};
