
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    // Adding indexes for frequently searched/filtered columns
    await queryInterface.addIndex('employees', ['nama_lengkap']);
    await queryInterface.addIndex('employees', ['nomor_induk_karyawan']);
    await queryInterface.addIndex('employees', ['divisi_id']);
    await queryInterface.addIndex('employees', ['department_id']);
    await queryInterface.addIndex('employees', ['posisi_jabatan_id']);
    await queryInterface.addIndex('employees', ['status_karyawan_id']);
    await queryInterface.addIndex('employees', ['lokasi_kerja_id']);
    await queryInterface.addIndex('employees', ['tag_id']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeIndex('employees', ['nama_lengkap']);
    await queryInterface.removeIndex('employees', ['nomor_induk_karyawan']);
    await queryInterface.removeIndex('employees', ['divisi_id']);
    await queryInterface.removeIndex('employees', ['department_id']);
    await queryInterface.removeIndex('employees', ['posisi_jabatan_id']);
    await queryInterface.removeIndex('employees', ['status_karyawan_id']);
    await queryInterface.removeIndex('employees', ['lokasi_kerja_id']);
    await queryInterface.removeIndex('employees', ['tag_id']);
};
