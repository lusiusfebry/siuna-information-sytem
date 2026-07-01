import * as readline from 'readline';
import sequelize from '../config/database';
import { env } from '../config/env';

const KEEP_TABLES = ['users', 'roles', 'permissions', 'role_permissions', 'company_settings'];

const TABLES_TO_CLEAN = [
    // Facility leaf (hapus dulu karena FK)
    'facility_work_orders', 'facility_assets', 'facility_occupants',
    // Facility mid
    'facility_rooms',
    // Facility master
    'facility_buildings', 'facility_room_types', 'facility_maintenance_categories',
    // Inventory leaf
    'inv_serial_number', 'inv_transaksi_detail', 'inv_stok',
    // Inventory mid
    'inv_transaksi', 'inv_produk', 'inv_gudang',
    // Inventory master
    'inv_brand', 'inv_sub_kategori', 'inv_kategori', 'inv_uom',
    // Shared
    'audit_logs', 'notifications',
    // HR employee detail
    'employee_documents', 'employee_family_info', 'employee_hr_info',
    'employee_personal_info', 'leaves', 'attendances',
    // HR employees
    'employees',
    // HR master data
    'posisi_jabatan', 'department', 'divisi',
    'kategori_pangkat', 'golongan', 'sub_golongan',
    'jenis_hubungan_kerja', 'tag', 'lokasi_kerja', 'status_karyawan',
];

function askConfirmation(question: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === 'yes');
        });
    });
}

async function resetData() {
    try {
        await sequelize.authenticate();
        console.log(`\nConnected to database: ${env.db.name}`);
        console.log(`Host: ${env.db.host}:${env.db.port}\n`);

        console.log('╔══════════════════════════════════════════════════╗');
        console.log('║  WARNING: RESET DATA — HAPUS SEMUA DATA SEED   ║');
        console.log('╚══════════════════════════════════════════════════╝\n');

        console.log(`Tabel yang DIPERTAHANKAN (${KEEP_TABLES.length}):`);
        console.log(`  ${KEEP_TABLES.join(', ')}\n`);

        console.log(`Tabel yang DIHAPUS (${TABLES_TO_CLEAN.length}):`);
        console.log(`  ${TABLES_TO_CLEAN.join(', ')}\n`);

        const confirmed = await askConfirmation(
            'Apakah Anda yakin? Ketik "yes" untuk melanjutkan: '
        );
        if (!confirmed) {
            console.log('\nDibatalkan. Tidak ada data yang dihapus.');
            process.exit(0);
        }

        // Phase 1: Nullify cross-boundary FK (users.employee_id -> employees)
        console.log('\n=== PHASE 1: Nullify cross-boundary references ===');
        const [, meta] = await sequelize.query(
            'UPDATE "users" SET "employee_id" = NULL WHERE "employee_id" IS NOT NULL'
        );
        const rowCount = (meta as any)?.rowCount ?? 0;
        console.log(`  users.employee_id set to NULL (${rowCount} rows)`);

        // Phase 2: Disable FK checks
        console.log('\n=== PHASE 2: Disable FK checks ===');
        await sequelize.query('SET session_replication_role = replica;');
        console.log('  session_replication_role = replica');

        try {
            // Phase 3: Truncate tables
            console.log('\n=== PHASE 3: Truncate tables ===');
            const total = TABLES_TO_CLEAN.length;
            let cleaned = 0;
            let skipped = 0;

            for (let i = 0; i < total; i++) {
                const table = TABLES_TO_CLEAN[i];
                try {
                    await sequelize.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
                    console.log(`  [${i + 1}/${total}] ${table} ... done`);
                    cleaned++;
                } catch {
                    console.log(`  [${i + 1}/${total}] ${table} ... skipped (not found)`);
                    skipped++;
                }
            }
        } finally {
            // Phase 4: Re-enable FK checks (always runs)
            console.log('\n=== PHASE 4: Re-enable FK checks ===');
            await sequelize.query('SET session_replication_role = DEFAULT;');
            console.log('  session_replication_role = DEFAULT');
        }

        // Phase 5: Verification
        console.log('\n=== PHASE 5: Verification ===');
        let allClean = true;
        for (const table of TABLES_TO_CLEAN) {
            try {
                const [rows] = await sequelize.query(
                    `SELECT COUNT(*)::int as count FROM "${table}"`
                );
                const count = (rows as any)[0]?.count ?? 0;
                if (count > 0) {
                    console.log(`  WARNING: ${table} masih memiliki ${count} rows!`);
                    allClean = false;
                }
            } catch { /* table not found */ }
        }

        // Verify kept tables
        let keptInfo: string[] = [];
        for (const table of KEEP_TABLES) {
            try {
                const [rows] = await sequelize.query(
                    `SELECT COUNT(*)::int as count FROM "${table}"`
                );
                const count = (rows as any)[0]?.count ?? 0;
                keptInfo.push(`${table}: ${count} rows`);
            } catch { /* table not found */ }
        }

        if (allClean) {
            console.log(`  Semua ${TABLES_TO_CLEAN.length} tabel terverifikasi kosong.`);
        }

        // Phase 6: Summary
        console.log('\n╔══════════════════════════════════════════════════╗');
        console.log('║          RESET DATA BERHASIL                    ║');
        console.log('╠══════════════════════════════════════════════════╣');
        console.log(`║  Dihapus  : ${TABLES_TO_CLEAN.length} tabel`);
        console.log(`║  Dipertahankan:`);
        for (const info of keptInfo) {
            console.log(`║    - ${info}`);
        }
        console.log(`║  Sequence : Reset (RESTART IDENTITY)`);
        console.log(`║  users.employee_id : NULL untuk semua user`);
        console.log('╚══════════════════════════════════════════════════╝');

        process.exit(0);
    } catch (error) {
        console.error('\nReset gagal:', error);
        process.exit(1);
    }
}

resetData();
