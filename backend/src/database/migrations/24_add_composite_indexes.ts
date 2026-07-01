import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    // Composite index for common filter combinations
    await queryInterface.addIndex('employees',
        ['divisi_id', 'department_id', 'status_karyawan_id'],
        { name: 'idx_employees_filter_combo' }
    );

    // Index for search optimization
    // Assuming nama_lengkap and nomor_induk_karyawan are columns in employees table
    await queryInterface.addIndex('employees',
        ['nama_lengkap', 'nomor_induk_karyawan'],
        { name: 'idx_employees_search' }
    );

    // Index for manager filtering or department+status checks
    await queryInterface.addIndex('employees',
        ['department_id', 'status_karyawan_id'],
        { name: 'idx_employees_dept_status' }
    );
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeIndex('employees', 'idx_employees_filter_combo');
    await queryInterface.removeIndex('employees', 'idx_employees_search');
    await queryInterface.removeIndex('employees', 'idx_employees_dept_status');
};
