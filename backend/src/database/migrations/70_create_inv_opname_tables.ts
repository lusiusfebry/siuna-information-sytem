import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

// Stock Opname (sesi perhitungan fisik gudang) — INV roadmap §3.4.
//
// Dua tabel baru:
// - inv_opname_session: satu sesi opname per gudang, siklus
//   Draft -> Berjalan -> Selesai -> Approved (cabang Dibatalkan).
// - inv_opname_detail: hasil hitung fisik per produk dalam sesi.
//
// Tidak ada perubahan ENUM: sub_tipe 'Opname' sudah ada di
// enum_inv_transaksi_sub_tipe (migration 35/39). Adjustment hasil approve
// memakai transaksi_id yang menunjuk inv_transaksi.
export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('inv_opname_session', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        kode: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        gudang_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'inv_gudang', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'Draft',
        },
        tanggal_mulai: { type: 'TIMESTAMPTZ' as any, allowNull: true },
        tanggal_selesai: { type: 'TIMESTAMPTZ' as any, allowNull: true },
        catatan: { type: DataTypes.TEXT, allowNull: true },
        transaksi_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'inv_transaksi', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        approved_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        approved_at: { type: 'TIMESTAMPTZ' as any, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        deleted_at: { type: 'TIMESTAMPTZ' as any, allowNull: true },
    });
    await queryInterface.addIndex('inv_opname_session', ['gudang_id', 'status'], {
        name: 'idx_opname_session_gudang_status',
    });
    await queryInterface.addIndex('inv_opname_session', ['deleted_at'], {
        name: 'idx_opname_session_deleted_at',
    });

    await queryInterface.createTable('inv_opname_detail', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        opname_session_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'inv_opname_session', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        produk_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'inv_produk', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        jumlah_sistem_snapshot: { type: DataTypes.INTEGER, allowNull: false },
        jumlah_fisik: { type: DataTypes.INTEGER, allowNull: true },
        selisih: { type: DataTypes.INTEGER, allowNull: true },
        catatan: { type: DataTypes.TEXT, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.addIndex('inv_opname_detail', ['opname_session_id', 'produk_id'], {
        name: 'idx_opname_detail_session_produk',
        unique: true,
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('inv_opname_detail');
    await queryInterface.dropTable('inv_opname_session');
};
