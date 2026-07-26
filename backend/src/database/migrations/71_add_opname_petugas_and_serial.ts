import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

// Perluasan Stock Opname — petugas & pelacakan serial/tag per unit.
//
// Tiga perubahan:
// - inv_opname_petugas: daftar petugas (karyawan) yang melakukan opname,
//   many-to-many terhadap sesi. Minimal 1 petugas divalidasi di service.
// - inv_opname_serial: snapshot unit ber-serial/tag yang ada di gudang saat
//   sesi dimulai, satu baris per unit, dengan kondisi 'Ada'/'Tidak Ada'.
//   serial_number & tag_number di-snapshot agar berita acara tetap utuh
//   walau master serial berubah setelah opname.
// - inv_opname_detail.tipe_hitung: 'Fisik' (hitung angka) vs 'Serial'
//   (jumlah_fisik diturunkan dari unit yang kondisinya 'Ada').
export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('inv_opname_petugas', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        opname_session_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'inv_opname_session', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        karyawan_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'employees', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('inv_opname_petugas', ['opname_session_id', 'karyawan_id'], {
        name: 'idx_opname_petugas_session_karyawan',
        unique: true,
    });

    await queryInterface.createTable('inv_opname_serial', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        opname_detail_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'inv_opname_detail', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        serial_number_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'inv_serial_number', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        serial_number: { type: DataTypes.STRING(100), allowNull: true },
        tag_number: { type: DataTypes.STRING(100), allowNull: true },
        kondisi: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Ada' },
        catatan: { type: DataTypes.TEXT, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('inv_opname_serial', ['opname_detail_id', 'serial_number_id'], {
        name: 'idx_opname_serial_detail_serial',
        unique: true,
    });

    await queryInterface.addColumn('inv_opname_detail', 'tipe_hitung', {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Fisik',
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('inv_opname_detail', 'tipe_hitung');
    await queryInterface.dropTable('inv_opname_serial');
    await queryInterface.dropTable('inv_opname_petugas');
};
