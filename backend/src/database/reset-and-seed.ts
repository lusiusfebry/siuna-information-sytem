import sequelize from '../config/database';
import { env } from '../config/env';

const KEEP_TABLES = ['users', 'roles', 'permissions', 'role_permissions', 'company_settings'];

const TABLES_TO_CLEAN = [
    'facility_work_orders', 'facility_assets', 'facility_occupants',
    'facility_rooms',
    'facility_buildings', 'facility_room_types', 'facility_maintenance_categories',
    'inv_serial_number', 'inv_transaksi_detail', 'inv_stok',
    'inv_transaksi', 'inv_produk', 'inv_gudang',
    'inv_brand', 'inv_sub_kategori', 'inv_kategori', 'inv_uom',
    'audit_logs', 'notifications',
    'employee_documents', 'employee_family_info', 'employee_hr_info',
    'employee_personal_info', 'leaves', 'attendances',
    'employees',
    'posisi_jabatan', 'department', 'divisi',
    'kategori_pangkat', 'golongan', 'sub_golongan',
    'jenis_hubungan_kerja', 'tag', 'lokasi_kerja', 'status_karyawan',
];

async function resetAndSeed() {
    try {
        await sequelize.authenticate();
        console.log(`\nConnected to database: ${env.db.name}`);
        console.log(`Host: ${env.db.host}:${env.db.port}\n`);

        console.log('╔══════════════════════════════════════════════════╗');
        console.log('║  RESET & SEED — Hapus data lalu isi ulang       ║');
        console.log('╚══════════════════════════════════════════════════╝\n');

        console.log(`Tabel yang DIPERTAHANKAN (${KEEP_TABLES.length}):`);
        console.log(`  ${KEEP_TABLES.join(', ')}\n`);

        // Phase 1: Nullify cross-boundary FK
        console.log('=== PHASE 1: Reset Data ===');
        await sequelize.query(
            'UPDATE "users" SET "employee_id" = NULL WHERE "employee_id" IS NOT NULL'
        );
        console.log('  users.employee_id set to NULL');

        // Phase 2: Disable FK checks & truncate
        await sequelize.query('SET session_replication_role = replica;');
        let cleaned = 0;
        for (const table of TABLES_TO_CLEAN) {
            try {
                await sequelize.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
                cleaned++;
            } catch { /* table mungkin belum ada */ }
        }
        await sequelize.query('SET session_replication_role = DEFAULT;');
        console.log(`  ${cleaned}/${TABLES_TO_CLEAN.length} tabel dibersihkan\n`);

        // Phase 3: Run seed-complete
        console.log('=== PHASE 2: Seed Data ===');
        console.log('  Menjalankan seed-complete...\n');

        // Dynamic import to run seed after reset
        const { seedComplete } = await import('./seed-complete');
        await seedComplete();

    } catch (error) {
        console.error('\nReset & Seed gagal:', error);
        process.exit(1);
    }
}

resetAndSeed();
