import sequelize from '../config/database';
import { env } from '../config/env';
import {
    performReset,
    keptTables,
    clearedTables,
    askConfirmation,
    shouldSkipConfirm,
    ResetOptions,
} from './reset-data';

/**
 * Reset & Seed — kosongkan database lalu isi ulang dengan data demo.
 *
 * Berbeda dari `npm run reset-data`, script ini MENGHAPUS master data HR juga,
 * karena tujuannya menghasilkan database demo yang benar-benar segar
 * (`includeHrMaster: true`).
 *
 * Daftar tabel dan seluruh logika pengosongan berasal dari `reset-data.ts` —
 * sengaja tidak diduplikasi lagi di sini. Versi lama menyalin kedua daftar dan
 * mencantumkan `users` sebagai "dipertahankan" tanpa mekanisme apa pun yang
 * benar-benar menjaganya, sehingga `TRUNCATE employees CASCADE` justru
 * mengosongkan tabel kredensial. Kini `users` dipertahankan secara nyata:
 * `employees` dihapus dengan `DELETE` sehingga FK ON DELETE SET NULL hanya
 * meng-NULL-kan `users.employee_id`. Akun yang sudah ada tetap dengan password
 * aslinya, dan `seed-complete` menambah akun demo lewat `findOrCreate` by NIK.
 */

const RESET_OPTIONS: ResetOptions = { includeHrMaster: true };

async function resetAndSeed() {
    try {
        await sequelize.authenticate();
        console.log(`\nTerhubung ke database: ${env.db.name}`);
        console.log(`Host: ${env.db.host}:${env.db.port}\n`);

        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║  RESET & SEED — Hapus data lalu isi ulang data demo      ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');

        const kept = keptTables(RESET_OPTIONS);
        const cleared = clearedTables(RESET_OPTIONS);
        console.log(`Tabel yang DIPERTAHANKAN (${kept.length}): ${kept.join(', ')}`);
        console.log(`Tabel yang DIKOSONGKAN (${cleared.length}), termasuk MASTER DATA HR.\n`);
        console.log('  Bila Anda hanya ingin mengosongkan data operasional dan MEMPERTAHANKAN');
        console.log('  master data HR, hentikan sekarang dan jalankan: npm run reset-data\n');

        if (!shouldSkipConfirm()) {
            const confirmed = await askConfirmation(
                'Lanjutkan reset + seed? Ketik "yes" untuk melanjutkan: '
            );
            if (!confirmed) {
                console.log('\nDibatalkan. Tidak ada data yang dihapus.');
                process.exit(0);
            }
        }

        console.log('\n=== TAHAP 1: Reset Data ===');
        const summary = await performReset(RESET_OPTIONS);
        console.log(
            `\n  Ringkasan: ${summary.truncated.length} tabel di-TRUNCATE, ` +
            `${summary.employeesDeleted} karyawan + ${summary.hrMasterDeleted} baris master data HR dihapus.`
        );

        console.log('\n=== TAHAP 2: Seed Data ===');
        console.log('  Menjalankan seed-complete...\n');

        // Import dinamis agar seeder baru dimuat setelah database bersih.
        // Catatan: seedComplete() memanggil process.exit() sendiri di akhir.
        const { seedComplete } = await import('./seed-complete');
        await seedComplete();
    } catch (error) {
        console.error('\nReset & Seed GAGAL:', error instanceof Error ? error.message : error);
        console.error('  Seeding TIDAK dijalankan. Periksa pesan di atas sebelum mencoba lagi.\n');
        process.exit(1);
    }
}

resetAndSeed();
