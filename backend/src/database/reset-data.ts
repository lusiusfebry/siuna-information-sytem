import * as readline from 'readline';
import sequelize from '../config/database';
import { env } from '../config/env';

/**
 * Reset Data — hapus seluruh data bisnis tetapi PERTAHANKAN credential.
 *
 * Tantangan: `TRUNCATE employees ... CASCADE` di PostgreSQL akan ikut menghapus
 * baris `users` karena ada FK `users.employee_id → employees`, meski FK sudah
 * di-NULL-kan dan `session_replication_role = replica` sudah aktif.
 *
 * Solusi: backup baris `users` (lengkap dengan password hash) ke memori,
 * truncate semua tabel bisnis, lalu re-insert `users` dengan `INSERT ... ON
 * CONFLICT DO NOTHING`. Hash password tidak ikut diregenerasi sehingga
 * credential lama (termasuk password yang sudah diubah lewat UI) tetap berlaku.
 */

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

interface UserBackup {
    id: number;
    nama: string;
    nik: string;
    password: string;
    role_id: number | null;
    is_active: boolean;
    last_login: Date | null;
    created_at: Date;
    updated_at: Date;
}

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

function shouldSkipConfirm(): boolean {
    return process.argv.includes('--yes') || process.argv.includes('-y');
}

async function backupUsers(): Promise<UserBackup[]> {
    const [rows] = await sequelize.query(`
        SELECT id, nama, nik, password, role_id, is_active, last_login, created_at, updated_at
        FROM "users"
        ORDER BY id
    `);
    return rows as UserBackup[];
}

async function restoreUsers(users: UserBackup[]): Promise<number> {
    if (users.length === 0) return 0;

    let restored = 0;
    for (const u of users) {
        // Pakai INSERT ... ON CONFLICT (nik) DO NOTHING agar idempotent dan
        // tidak menimpa user yang mungkin sudah ada (mis. user baru yang
        // dibuat lewat seed di antara dua run).
        // employee_id sengaja TIDAK direstore karena tabel employees baru
        // saja di-truncate. User tetap bisa login; relasi employee bisa
        // dibuat ulang lewat UI Manajemen User.
        await sequelize.query(
            `INSERT INTO "users" (id, nama, nik, password, employee_id, role_id, is_active, last_login, created_at, updated_at)
             VALUES (:id, :nama, :nik, :password, NULL, :role_id, :is_active, :last_login, :created_at, :updated_at)
             ON CONFLICT (nik) DO NOTHING`,
            {
                replacements: {
                    id: u.id,
                    nama: u.nama,
                    nik: u.nik,
                    password: u.password,
                    role_id: u.role_id,
                    is_active: u.is_active,
                    last_login: u.last_login,
                    created_at: u.created_at,
                    updated_at: u.updated_at,
                },
            }
        );
        restored++;
    }

    // Reset sequence agar INSERT berikutnya tidak konflik dengan id manual.
    await sequelize.query(
        `SELECT setval(pg_get_serial_sequence('users', 'id'),
                       COALESCE((SELECT MAX(id) FROM "users"), 1),
                       (SELECT MAX(id) IS NOT NULL FROM "users"))`
    );

    return restored;
}

async function ensureFallbackAdmin(restoredCount: number): Promise<boolean> {
    // Jika tidak ada user yang berhasil dipulihkan (mis. database awalnya
    // kosong), buat 1 superadmin minimal agar aplikasi tetap bisa diakses.
    if (restoredCount > 0) return false;

    const [roles] = await sequelize.query<{ id: number }>(
        `SELECT id FROM "roles" WHERE name = 'superadmin' LIMIT 1`,
        { type: 'SELECT' as any }
    );
    const roleId = (roles as any)?.id ?? null;
    if (!roleId) {
        console.log('  [!] Role superadmin tidak ditemukan — lewati fallback admin.');
        console.log('      Jalankan `npm run seed` untuk membuat RBAC + akun superadmin.');
        return false;
    }

    // Hash password 'password123' — generate lewat User.create agar hook
    // beforeCreate yang melakukan bcrypt tetap dipakai.
    const User = require('../modules/auth/models/User').default;
    await User.findOrCreate({
        where: { nik: '111111' },
        defaults: {
            nama: 'Superadmin',
            nik: '111111',
            password: 'password123',
            role_id: roleId,
            is_active: true,
        },
    });
    return true;
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

        if (!shouldSkipConfirm()) {
            const confirmed = await askConfirmation(
                'Apakah Anda yakin? Ketik "yes" untuk melanjutkan: '
            );
            if (!confirmed) {
                console.log('\nDibatalkan. Tidak ada data yang dihapus.');
                process.exit(0);
            }
        } else {
            console.log('Flag --yes terdeteksi, melewati konfirmasi interaktif.\n');
        }

        // Phase 1: Backup users (mengantisipasi TRUNCATE ... CASCADE)
        console.log('\n=== PHASE 1: Backup credential ===');
        const userBackup = await backupUsers();
        console.log(`  ${userBackup.length} user di-backup ke memori`);

        // Phase 2: Nullify cross-boundary FK (defensive; FK akan SET NULL juga)
        console.log('\n=== PHASE 2: Nullify cross-boundary references ===');
        await sequelize.query(
            'UPDATE "users" SET "employee_id" = NULL WHERE "employee_id" IS NOT NULL'
        );
        console.log('  users.employee_id set to NULL');

        // Phase 3: Disable FK checks
        console.log('\n=== PHASE 3: Disable FK checks ===');
        await sequelize.query('SET session_replication_role = replica;');
        console.log('  session_replication_role = replica');

        try {
            // Phase 4: Truncate tables
            console.log('\n=== PHASE 4: Truncate tables ===');
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
            console.log(`  Total: ${cleaned} cleaned, ${skipped} skipped`);
        } finally {
            // Phase 5: Re-enable FK checks (always runs)
            console.log('\n=== PHASE 5: Re-enable FK checks ===');
            await sequelize.query('SET session_replication_role = DEFAULT;');
            console.log('  session_replication_role = DEFAULT');
        }

        // Phase 6: Restore users (catatan: TRUNCATE CASCADE di Phase 4 ikut
        // menghapus rows users. Kita pulihkan dari backup memori.)
        console.log('\n=== PHASE 6: Restore credential ===');
        const restoredCount = await restoreUsers(userBackup);
        console.log(`  ${restoredCount} user dipulihkan`);

        const createdFallback = await ensureFallbackAdmin(restoredCount);
        if (createdFallback) {
            console.log('  Database awalnya kosong → akun fallback dibuat:');
            console.log('    NIK: 111111   Password: password123   Role: superadmin');
        }

        // Phase 7: Verification
        console.log('\n=== PHASE 7: Verification ===');
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

        const keptInfo: string[] = [];
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

        // Phase 8: Summary
        console.log('\n╔══════════════════════════════════════════════════╗');
        console.log('║          RESET DATA BERHASIL                    ║');
        console.log('╠══════════════════════════════════════════════════╣');
        console.log(`║  Dihapus       : ${TABLES_TO_CLEAN.length} tabel`);
        console.log(`║  Credential    : ${restoredCount} user dipulihkan` +
                    (createdFallback ? ' + 1 fallback' : ''));
        console.log(`║  Dipertahankan :`);
        for (const info of keptInfo) {
            console.log(`║    - ${info}`);
        }
        console.log(`║  Sequence      : Reset (RESTART IDENTITY)`);
        console.log(`║  users.employee_id : NULL untuk semua user`);
        console.log('╚══════════════════════════════════════════════════╝');
        console.log('\nSiap input data real. Login dengan akun admin Anda yang lama.\n');

        process.exit(0);
    } catch (error) {
        console.error('\nReset gagal:', error);
        process.exit(1);
    }
}

resetData();
