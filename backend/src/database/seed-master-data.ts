import sequelize from '../config/database';
import {
    Divisi,
    Department,
    StatusKaryawan,
    LokasiKerja,
    PosisiJabatan,
    KategoriPangkat,
    Golongan,
    SubGolongan,
    JenisHubunganKerja,
    Tag
} from '../modules/hr/models';

async function seedMasterData() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // 1. Seed Divisi
        const divSDM = await Divisi.findOrCreate({ where: { nama: 'SDM & Umum' }, defaults: { keterangan: 'Human Resources and General Affairs', status: 'Aktif' } });
        const divIT = await Divisi.findOrCreate({ where: { nama: 'Information Technology' }, defaults: { keterangan: 'IT Infrastructure and Development', status: 'Aktif' } });
        await Divisi.findOrCreate({ where: { nama: 'Operasional' }, defaults: { keterangan: 'Production and Operations', status: 'Aktif' } });
        console.log('✅ Seeded Divisi');

        // 2. Seed Department
        const deptRecruitment = await Department.findOrCreate({
            where: { nama: 'Recruitment' },
            defaults: { divisi_id: divSDM[0].id, status: 'Aktif' }
        });
        await Department.findOrCreate({
            where: { nama: 'Training & Development' },
            defaults: { divisi_id: divSDM[0].id, status: 'Aktif' }
        });
        const deptInfra = await Department.findOrCreate({
            where: { nama: 'IT Infrastructure' },
            defaults: { divisi_id: divIT[0].id, status: 'Aktif' }
        });
        console.log('✅ Seeded Department');

        // 3. Seed Status Karyawan
        await StatusKaryawan.findOrCreate({ where: { nama: 'Aktif' }, defaults: { keterangan: 'Karyawan Aktif', status: 'Aktif' } });
        await StatusKaryawan.findOrCreate({ where: { nama: 'Resign' }, defaults: { keterangan: 'Karyawan Mengundurkan Diri', status: 'Aktif' } });
        await StatusKaryawan.findOrCreate({ where: { nama: 'Cuti' }, defaults: { keterangan: 'Karyawan sedang Cuti', status: 'Aktif' } });
        console.log('✅ Seeded Status Karyawan');

        // 4. Seed Lokasi Kerja
        await LokasiKerja.findOrCreate({ where: { nama: 'Kantor Pusat' }, defaults: { alamat: 'Jakarta', status: 'Aktif' } });
        await LokasiKerja.findOrCreate({ where: { nama: 'Site Jakarta' }, defaults: { alamat: 'Bekasi', status: 'Aktif' } });
        await LokasiKerja.findOrCreate({ where: { nama: 'Site Bandung' }, defaults: { alamat: 'Bandung', status: 'Aktif' } });
        console.log('✅ Seeded Lokasi Kerja');

        // 5. Seed Posisi Jabatan
        await PosisiJabatan.findOrCreate({ where: { nama: 'HR Manager' }, defaults: { department_id: deptRecruitment[0].id, status: 'Aktif' } });
        await PosisiJabatan.findOrCreate({ where: { nama: 'Recruiter' }, defaults: { department_id: deptRecruitment[0].id, status: 'Aktif' } });
        await PosisiJabatan.findOrCreate({ where: { nama: 'IT Support' }, defaults: { department_id: deptInfra[0].id, status: 'Aktif' } });
        await PosisiJabatan.findOrCreate({ where: { nama: 'Network Engineer' }, defaults: { department_id: deptInfra[0].id, status: 'Aktif' } });
        console.log('✅ Seeded Posisi Jabatan');

        // 6. Seed Kategori Pangkat
        await KategoriPangkat.findOrCreate({ where: { nama: 'Managerial' }, defaults: { keterangan: 'Level Manager', status: 'Aktif' } });
        await KategoriPangkat.findOrCreate({ where: { nama: 'Staff' }, defaults: { keterangan: 'Level Staff', status: 'Aktif' } });
        console.log('✅ Seeded Kategori Pangkat');

        // 7. Seed Golongan
        await Golongan.findOrCreate({ where: { nama: 'Golongan I' }, defaults: { keterangan: 'Golongan Rendah', status: 'Aktif' } });
        await Golongan.findOrCreate({ where: { nama: 'Golongan II' }, defaults: { keterangan: 'Golongan Menengah', status: 'Aktif' } });
        await Golongan.findOrCreate({ where: { nama: 'Golongan III' }, defaults: { keterangan: 'Golongan Tinggi', status: 'Aktif' } });
        console.log('✅ Seeded Golongan');

        // 8. Seed Sub Golongan
        await SubGolongan.findOrCreate({ where: { nama: 'IA' }, defaults: { keterangan: 'Sub Golongan IA', status: 'Aktif' } });
        await SubGolongan.findOrCreate({ where: { nama: 'IB' }, defaults: { keterangan: 'Sub Golongan IB', status: 'Aktif' } });
        await SubGolongan.findOrCreate({ where: { nama: 'IIA' }, defaults: { keterangan: 'Sub Golongan IIA', status: 'Aktif' } });
        console.log('✅ Seeded Sub Golongan');

        // 9. Seed Jenis Hubungan Kerja
        await JenisHubunganKerja.findOrCreate({ where: { nama: 'PKWT' }, defaults: { keterangan: 'Perjanjian Kerja Waktu Tertentu', status: 'Aktif' } });
        await JenisHubunganKerja.findOrCreate({ where: { nama: 'PKWTT' }, defaults: { keterangan: 'Perjanjian Kerja Waktu Tidak Tertentu', status: 'Aktif' } });
        await JenisHubunganKerja.findOrCreate({ where: { nama: 'Harian' }, defaults: { keterangan: 'Pekerja Harian Lepas', status: 'Aktif' } });
        console.log('✅ Seeded Jenis Hubungan Kerja');

        // 10. Seed Tag
        await Tag.findOrCreate({ where: { nama: 'Urgent' }, defaults: { warna_tag: '#EF4444', keterangan: 'High Priority', status: 'Aktif' } });
        await Tag.findOrCreate({ where: { nama: 'New Hire' }, defaults: { warna_tag: '#10B981', keterangan: 'Karyawan Baru', status: 'Aktif' } });
        await Tag.findOrCreate({ where: { nama: 'Remote' }, defaults: { warna_tag: '#3B82F6', keterangan: 'Remote Worker', status: 'Aktif' } });
        console.log('✅ Seeded Tag');

        console.log('🌟 Extended Master data seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}

seedMasterData();
