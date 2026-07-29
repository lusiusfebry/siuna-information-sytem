import * as readline from 'readline';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { env } from '../config/env';

/**
 * Reset Data — kosongkan seluruh data operasional, PERTAHANKAN kredensial login
 * dan master data Human Resources.
 *
 * Aturan yang menentukan cara pengosongan setiap tabel:
 *
 *   `TRUNCATE ... CASCADE` di PostgreSQL tidak "membereskan kaitan FK" — ia
 *   MENGOSONGKAN tabel yang mereferensikan. Rantainya bisa panjang:
 *   `TRUNCATE department CASCADE` → employees → users. Artinya kredensial bisa
 *   ikut hilang meski tabelnya tercantum sebagai "dipertahankan".
 *
 * Karena itu tabel dibagi dua:
 *
 *   1. TABLES_TO_TRUNCATE — tabel yang rantai CASCADE-nya TIDAK PERNAH sampai ke
 *      `employees` (dan karenanya tidak sampai ke `users`). Aman di-TRUNCATE,
 *      sekaligus dapat reset sequence gratis lewat RESTART IDENTITY.
 *
 *   2. `employees` (dan master data HR bila `includeHrMaster`) — dikosongkan
 *      dengan `DELETE`, bukan TRUNCATE. FK `users.employee_id → employees` sudah
 *      bertanda ON DELETE SET NULL, jadi PostgreSQL hanya meng-NULL-kan kolom
 *      kaitannya dan baris `users` tidak pernah tersentuh. Tidak perlu
 *      backup/restore kredensial, tidak perlu `session_replication_role`, dan
 *      tidak ada momen di mana akun login berada dalam keadaan terhapus.
 *      Konsekuensinya sequence harus di-reset manual.
 *
 * Verifikasi di akhir bersifat KETAT: jumlah baris tabel yang dipertahankan harus
 * sama dengan sebelum reset (dikurangi baris soft-delete yang dibersihkan). Bila
 * tidak cocok, proses dilaporkan GAGAL dengan exit code 1.
 *
 * CATATAN untuk nanti: saat Redis nyata sudah dipasang (item A3 di
 * docs/ROADMAP-FITUR.md — sekarang masih stub no-op), script ini WAJIB menambah
 * langkah flush cache. Tanpa itu dashboard akan tetap menampilkan data lama.
 */

/** Kredensial, hak akses, dan identitas perusahaan — tidak pernah disentuh. */
const KEEP_CREDENTIAL_TABLES = [
    'users', 'roles', 'permissions', 'role_permissions',
    'company_settings',
];

/**
 * Master data HR — dipertahankan secara default (jumlahnya banyak dan mahal
 * untuk diinput ulang). Urutan sengaja anak → induk karena FK internal
 * `posisi_jabatan → department → divisi` bersifat RESTRICT; urutan ini dipakai
 * baik untuk pembersihan baris soft-delete maupun untuk mode `includeHrMaster`.
 */
const KEEP_HR_MASTER_TABLES = [
    'posisi_jabatan', 'department', 'divisi',
    'kategori_pangkat', 'golongan', 'sub_golongan',
    'jenis_hubungan_kerja', 'tag', 'lokasi_kerja', 'status_karyawan',
];

/**
 * Tabel yang aman di-TRUNCATE: tidak satu pun direferensikan oleh tabel yang
 * dipertahankan, dan rantai CASCADE-nya tidak mencapai `employees`.
 * Urutan anak → induk hanya untuk kerapian log.
 */
const TABLES_TO_TRUNCATE = [
    // Facility — leaf
    'facility_work_orders', 'facility_assets', 'facility_occupants',
    // Facility — mid
    'facility_rooms',
    // Facility — master
    'facility_buildings', 'facility_room_types', 'facility_maintenance_categories',
    // Inventory — Stock Opname (paling dalam)
    'inv_opname_serial', 'inv_opname_detail', 'inv_opname_petugas', 'inv_opname_session',
    // Inventory — leaf
    'inv_serial_number', 'inv_transaksi_detail', 'inv_stok',
    // Inventory — mid
    'inv_transaksi', 'inv_produk', 'inv_gudang',
    // Inventory — master
    'inv_brand', 'inv_sub_kategori', 'inv_kategori', 'inv_uom',
    // Lintas modul
    'audit_logs', 'notifications',
    // HR — detail karyawan (tabel `employees` sendiri ditangani dengan DELETE)
    'employee_documents', 'employee_family_info', 'employee_hr_info',
    'employee_personal_info', 'leaves', 'attendances',
];

export interface ResetOptions {
    /**
     * true  → master data HR ikut dikosongkan (dipakai oleh reset-and-seed,
     *         agar seeder bisa mengisi ulang tanpa tabrakan unique `code`).
     * false → master data HR dipertahankan (perilaku default `npm run reset-data`).
     */
    includeHrMaster?: boolean;
}

export interface ResetSummary {
    truncated: string[];
    skipped: string[];
    employeesDeleted: number;
    hrMasterDeleted: number;
    softDeletedRemoved: number;
    keptCounts: Record<string, number>;
    verified: boolean;
    problems: string[];
}

/** Daftar tabel yang dipertahankan pada mode tertentu. */
export function keptTables(opts: ResetOptions = {}): string[] {
    return opts.includeHrMaster
        ? [...KEEP_CREDENTIAL_TABLES]
        : [...KEEP_CREDENTIAL_TABLES, ...KEEP_HR_MASTER_TABLES];
}

/** Daftar tabel yang dikosongkan pada mode tertentu. */
export function clearedTables(opts: ResetOptions = {}): string[] {
    return opts.includeHrMaster
        ? [...TABLES_TO_TRUNCATE, 'employees', ...KEEP_HR_MASTER_TABLES]
        : [...TABLES_TO_TRUNCATE, 'employees'];
}

async function countRows(table: string): Promise<number | null> {
    try {
        const rows = await sequelize.query<{ count: number }>(
            `SELECT COUNT(*)::int AS count FROM "${table}"`,
            { type: QueryTypes.SELECT }
        );
        return rows[0]?.count ?? 0;
    } catch {
        return null; // tabel belum ada
    }
}

async function countSoftDeleted(table: string): Promise<number> {
    try {
        const rows = await sequelize.query<{ count: number }>(
            `SELECT COUNT(*)::int AS count FROM "${table}" WHERE deleted_at IS NOT NULL`,
            { type: QueryTypes.SELECT }
        );
        return rows[0]?.count ?? 0;
    } catch {
        return 0; // tabel atau kolom deleted_at tidak ada
    }
}

/** Kembalikan sequence id ke 1 sehingga baris berikutnya mendapat id = 1. */
async function resetIdSequence(table: string, problems: string[]): Promise<void> {
    try {
        await sequelize.query(
            `SELECT setval(pg_get_serial_sequence(:table, 'id'), 1, false)`,
            { replacements: { table } }
        );
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        problems.push(`Gagal reset sequence ${table}.id — ${msg}`);
    }
}

export function askConfirmation(question: string): Promise<boolean> {
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

export function shouldSkipConfirm(): boolean {
    return process.argv.includes('--yes') || process.argv.includes('-y');
}

/**
 * Jalankan reset. TIDAK memanggil process.exit dan TIDAK meminta konfirmasi —
 * kedua hal itu tanggung jawab pemanggil, supaya fungsi ini bisa dipakai ulang
 * oleh reset-and-seed.ts.
 *
 * @throws bila verifikasi akhir gagal.
 */
export async function performReset(opts: ResetOptions = {}): Promise<ResetSummary> {
    const kept = keptTables(opts);
    const problems: string[] = [];

    // ---- Ambil jumlah baris SEBELUM, sebagai dasar verifikasi ----
    const before: Record<string, number> = {};
    for (const table of kept) {
        const n = await countRows(table);
        if (n !== null) before[table] = n;
    }

    // Baris soft-delete pada master data HR yang dipertahankan akan dibersihkan,
    // jadi harus dikurangkan dari angka harapan.
    const softDeletedBefore: Record<string, number> = {};
    if (!opts.includeHrMaster) {
        for (const table of KEEP_HR_MASTER_TABLES) {
            softDeletedBefore[table] = await countSoftDeleted(table);
        }
    }

    // ---- Fase 1: TRUNCATE tabel yang aman ----
    console.log('\n=== FASE 1: Kosongkan tabel operasional (TRUNCATE) ===');
    const truncated: string[] = [];
    const skipped: string[] = [];
    for (let i = 0; i < TABLES_TO_TRUNCATE.length; i++) {
        const table = TABLES_TO_TRUNCATE[i];
        const label = `[${i + 1}/${TABLES_TO_TRUNCATE.length}] ${table}`;
        try {
            await sequelize.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
            console.log(`  ${label} ... selesai`);
            truncated.push(table);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.log(`  ${label} ... DILEWATI (${msg.split('\n')[0]})`);
            skipped.push(table);
        }
    }
    console.log(`  Total: ${truncated.length} dikosongkan, ${skipped.length} dilewati`);

    // ---- Fase 2: bereskan kaitan yang tidak ditegakkan database ----
    // `department.manager_id` dideklarasikan di hr/models/associations.ts tapi
    // TIDAK punya FK constraint di database. Tanpa langkah ini kolomnya akan
    // menyimpan id karyawan yang sudah tidak ada, tanpa protes dari PostgreSQL.
    console.log('\n=== FASE 2: Bereskan kaitan tanpa FK constraint ===');
    if (!opts.includeHrMaster) {
        try {
            await sequelize.query(
                'UPDATE "department" SET "manager_id" = NULL WHERE "manager_id" IS NOT NULL'
            );
            console.log('  department.manager_id → NULL');
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            problems.push(`Gagal meng-NULL-kan department.manager_id — ${msg}`);
        }
    } else {
        console.log('  Dilewati (master data HR ikut dikosongkan).');
    }

    // ---- Fase 3: DELETE employees ----
    // Sengaja DELETE, bukan TRUNCATE: FK users.employee_id → employees bertanda
    // ON DELETE SET NULL, sehingga baris `users` tidak tersentuh sama sekali.
    console.log('\n=== FASE 3: Hapus data karyawan (DELETE) ===');
    const employeesBefore = (await countRows('employees')) ?? 0;
    await sequelize.query('DELETE FROM "employees"');
    await resetIdSequence('employees', problems);
    console.log(`  ${employeesBefore} karyawan dihapus, sequence dikembalikan ke 1`);

    // ---- Fase 4: master data HR ----
    let hrMasterDeleted = 0;
    let softDeletedRemoved = 0;

    if (opts.includeHrMaster) {
        console.log('\n=== FASE 4: Hapus master data HR (DELETE, anak → induk) ===');
        for (const table of KEEP_HR_MASTER_TABLES) {
            const n = (await countRows(table)) ?? 0;
            try {
                await sequelize.query(`DELETE FROM "${table}"`);
                await resetIdSequence(table, problems);
                hrMasterDeleted += n;
                console.log(`  ${table} ... ${n} baris dihapus`);
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                problems.push(`Gagal menghapus ${table} — ${msg.split('\n')[0]}`);
                console.log(`  ${table} ... GAGAL`);
            }
        }
    } else {
        console.log('\n=== FASE 4: Bersihkan baris soft-delete master data HR ===');
        // Urutan anak → induk penting: FK internal posisi_jabatan → department →
        // divisi bersifat RESTRICT. Bila ada induk ber-soft-delete sementara
        // anaknya masih aktif, DELETE akan ditolak database — itu dilaporkan,
        // bukan ditelan diam-diam.
        for (const table of KEEP_HR_MASTER_TABLES) {
            const n = softDeletedBefore[table] ?? 0;
            if (n === 0) continue;
            try {
                await sequelize.query(`DELETE FROM "${table}" WHERE deleted_at IS NOT NULL`);
                softDeletedRemoved += n;
                console.log(`  ${table} ... ${n} baris soft-delete dihapus`);
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                problems.push(
                    `Gagal membersihkan baris soft-delete ${table} — ${msg.split('\n')[0]}`
                );
                console.log(`  ${table} ... GAGAL`);
            }
        }
        if (softDeletedRemoved === 0) {
            console.log('  Tidak ada baris soft-delete. Tidak ada yang dihapus.');
        }
    }

    // ---- Fase 5: verifikasi ketat ----
    console.log('\n=== FASE 5: Verifikasi ===');

    // 5a. Tabel yang dikosongkan harus benar-benar 0 baris.
    for (const table of clearedTables(opts)) {
        const n = await countRows(table);
        if (n === null) continue;
        if (n !== 0) {
            problems.push(`${table} seharusnya kosong tetapi masih berisi ${n} baris`);
        }
    }

    // 5b. Tabel yang dipertahankan harus sama seperti sebelumnya, dikurangi
    //     baris soft-delete yang memang dibersihkan.
    const keptCounts: Record<string, number> = {};
    for (const table of kept) {
        const n = await countRows(table);
        if (n === null) continue;
        keptCounts[table] = n;

        const expected = (before[table] ?? 0) - (softDeletedBefore[table] ?? 0);
        if (n !== expected) {
            problems.push(
                `${table} seharusnya berisi ${expected} baris tetapi berisi ${n} ` +
                `(sebelum reset: ${before[table] ?? 0})`
            );
        }
    }

    const verified = problems.length === 0;
    if (verified) {
        console.log(`  Semua ${clearedTables(opts).length} tabel target kosong.`);
        console.log(`  Semua ${kept.length} tabel yang dipertahankan utuh.`);
    } else {
        console.log(`  ${problems.length} masalah ditemukan:`);
        for (const p of problems) console.log(`    - ${p}`);
    }

    const summary: ResetSummary = {
        truncated,
        skipped,
        employeesDeleted: employeesBefore,
        hrMasterDeleted,
        softDeletedRemoved,
        keptCounts,
        verified,
        problems,
    };

    if (!verified) {
        throw Object.assign(
            new Error(`Verifikasi reset GAGAL — ${problems.length} masalah. Lihat daftar di atas.`),
            { summary }
        );
    }

    return summary;
}

async function main() {
    const includeHrMaster = process.argv.includes('--include-hr-master');
    const opts: ResetOptions = { includeHrMaster };
    const kept = keptTables(opts);
    const cleared = clearedTables(opts);

    try {
        await sequelize.authenticate();
        console.log(`\nTerhubung ke database: ${env.db.name}`);
        console.log(`Host: ${env.db.host}:${env.db.port}\n`);

        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║  PERINGATAN: RESET DATA — TIDAK BISA DIBATALKAN          ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');

        console.log(`Tabel yang DIPERTAHANKAN (${kept.length}):`);
        for (const table of kept) {
            const n = await countRows(table);
            console.log(`  ${table.padEnd(24)} ${n === null ? '(tabel tidak ada)' : `${n} baris`}`);
        }

        console.log(`\nTabel yang DIKOSONGKAN (${cleared.length}):`);
        let totalToDelete = 0;
        for (const table of cleared) {
            const n = await countRows(table);
            if (n === null) continue;
            totalToDelete += n;
            if (n > 0) console.log(`  ${table.padEnd(24)} ${n} baris`);
        }
        console.log(`  ... plus tabel lain yang sudah kosong`);
        console.log(`\n  TOTAL YANG DIHAPUS: ${totalToDelete} baris\n`);

        if (includeHrMaster) {
            console.log('  Mode --include-hr-master: MASTER DATA HR IKUT DIHAPUS.\n');
        }

        console.log('  Pastikan sudah membuat backup:');
        console.log(`    pg_dump -h ${env.db.host} -p ${env.db.port} -U <user> ` +
                    `-d ${env.db.name} -F c -f backups/pre-reset.dump\n`);

        if (!shouldSkipConfirm()) {
            const confirmed = await askConfirmation(
                'Apakah Anda yakin? Ketik "yes" untuk melanjutkan: '
            );
            if (!confirmed) {
                console.log('\nDibatalkan. Tidak ada data yang dihapus.');
                process.exit(0);
            }
        } else {
            console.log('Flag --yes terdeteksi, melewati konfirmasi interaktif.');
        }

        const summary = await performReset(opts);

        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║              RESET DATA BERHASIL                        ║');
        console.log('╠══════════════════════════════════════════════════════════╣');
        console.log(`║  Dikosongkan     : ${summary.truncated.length} tabel (TRUNCATE)`);
        console.log(`║  Karyawan        : ${summary.employeesDeleted} baris dihapus (DELETE)`);
        if (includeHrMaster) {
            console.log(`║  Master data HR  : ${summary.hrMasterDeleted} baris dihapus`);
        } else {
            console.log(`║  Soft-delete     : ${summary.softDeletedRemoved} baris dibersihkan`);
        }
        console.log('║  Dipertahankan   :');
        for (const [table, n] of Object.entries(summary.keptCounts)) {
            console.log(`║    - ${table.padEnd(24)} ${n} baris`);
        }
        console.log('╚══════════════════════════════════════════════════════════╝');

        console.log('\nCatatan:');
        console.log('  - Kredensial login TIDAK pernah dihapus. Password lama tetap berlaku.');
        console.log('  - users.employee_id kini NULL — tautkan ulang lewat UI Manajemen User');
        console.log('    setelah data karyawan yang baru diinput.');
        if (!includeHrMaster) {
            console.log('  - Master data Inventory (satuan, kategori, sub-kategori, merek) ikut');
            console.log('    terhapus. Isi ulang lebih dulu sebelum membuat produk.');
        }
        console.log('  - Berkas di backend/uploads/employees/ menjadi orphan; hapus manual bila');
        console.log('    perlu. JANGAN hapus uploads/company/ (logo perusahaan masih dipakai).');
        console.log('  - Di browser: hard refresh (Ctrl+Shift+R) agar cache React Query bersih.\n');

        process.exit(0);
    } catch (error) {
        console.error('\nReset GAGAL:', error instanceof Error ? error.message : error);
        console.error('\nDatabase mungkin dalam keadaan setengah jalan. Pulihkan dari backup:');
        console.error(`  pg_restore -h ${env.db.host} -p ${env.db.port} -U <user> ` +
                      `-d ${env.db.name} -c backups/pre-reset.dump\n`);
        process.exit(1);
    }
}

// Hanya jalan otomatis bila dieksekusi langsung, bukan saat di-import oleh
// reset-and-seed.ts.
if (require.main === module) {
    main();
}
