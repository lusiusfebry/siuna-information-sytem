import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';
import sequelize from '../../config/database';

export const up: Migration = async ({ context: queryInterface }) => {
    // 1. Renames
    // Using raw queries because renameColumn function is reported missing in runtime
    await sequelize.query('ALTER TABLE "employees" RENAME COLUMN "name" TO "nama_lengkap";');
    await sequelize.query('ALTER TABLE "employees" RENAME COLUMN "nik" TO "nomor_induk_karyawan";');
    await sequelize.query('ALTER TABLE "employees" RENAME COLUMN "email" TO "email_perusahaan";');
    await sequelize.query('ALTER TABLE "employees" RENAME COLUMN "phone" TO "nomor_handphone";');

    // 2. Remove columns
    await sequelize.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "position";');
    await sequelize.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "department";');
    await sequelize.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "joinDate";');
    await sequelize.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "photo";');

    // 3. Add new columns
    await sequelize.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "foto_karyawan" TEXT;');

    // Add Foreign Key Columns
    // Note: referencing tables 'divisi', 'department', 'posisi_jabatan', etc.
    await sequelize.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "divisi_id" INTEGER REFERENCES "divisi" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;');
    await sequelize.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "department_id" INTEGER REFERENCES "department" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;');
    await sequelize.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "posisi_jabatan_id" INTEGER REFERENCES "posisi_jabatan" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;');
    await sequelize.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "status_karyawan_id" INTEGER REFERENCES "status_karyawan" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;');
    await sequelize.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "lokasi_kerja_id" INTEGER REFERENCES "lokasi_kerja" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;');
    await sequelize.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "tag_id" INTEGER REFERENCES "tag" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;');

    await sequelize.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "manager_id" INTEGER REFERENCES "employees" ("id") ON UPDATE CASCADE ON DELETE SET NULL;');
    await sequelize.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "atasan_langsung_id" INTEGER REFERENCES "employees" ("id") ON UPDATE CASCADE ON DELETE SET NULL;');

    // 4. Constraints and Indexes
    await sequelize.query('ALTER TABLE "employees" ALTER COLUMN "nama_lengkap" SET NOT NULL;');
    await sequelize.query('ALTER TABLE "employees" ALTER COLUMN "nomor_induk_karyawan" SET NOT NULL;');

    // Add Indexes
    await sequelize.query('CREATE INDEX IF NOT EXISTS "employees_divisi_id_idx" ON "employees" ("divisi_id");');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "employees_department_id_idx" ON "employees" ("department_id");');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "employees_status_karyawan_id_idx" ON "employees" ("status_karyawan_id");');
};

export const down: Migration = async ({ context: queryInterface }) => {
    // Revert changes (simplified)
    await sequelize.query('DROP INDEX IF EXISTS "employees_divisi_id_idx";');
    await sequelize.query('DROP INDEX IF EXISTS "employees_department_id_idx";');
    await sequelize.query('DROP INDEX IF EXISTS "employees_status_karyawan_id_idx";');

    await sequelize.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "divisi_id";');
    await sequelize.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "department_id";');
    await sequelize.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "posisi_jabatan_id";');
    await sequelize.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "status_karyawan_id";');
    await sequelize.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "lokasi_kerja_id";');
    await sequelize.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "tag_id";');
    await sequelize.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "manager_id";');
    await sequelize.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "atasan_langsung_id";');
    await sequelize.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "foto_karyawan";');

    // Revert Renames
    await sequelize.query('ALTER TABLE "employees" RENAME COLUMN "nama_lengkap" TO "name";');
    await sequelize.query('ALTER TABLE "employees" RENAME COLUMN "nomor_induk_karyawan" TO "nik";');
    await sequelize.query('ALTER TABLE "employees" RENAME COLUMN "email_perusahaan" TO "email";');
    await sequelize.query('ALTER TABLE "employees" RENAME COLUMN "nomor_handphone" TO "phone";');

    await sequelize.query('ALTER TABLE "employees" ADD COLUMN "position" VARCHAR(100);');
    await sequelize.query('ALTER TABLE "employees" ADD COLUMN "department" VARCHAR(100);');
    await sequelize.query('ALTER TABLE "employees" ADD COLUMN "joinDate" DATE;');
    await sequelize.query('ALTER TABLE "employees" ADD COLUMN "photo" TEXT;');
};
