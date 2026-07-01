import sequelize from '../config/database';
import {
    Divisi,
    Department,
    PosisiJabatan,
    KategoriPangkat,
    Golongan,
    JenisHubunganKerja,
    Tag,
    LokasiKerja,
    StatusKaryawan,
    Employee,
    EmployeePersonalInfo,
    EmployeeHRInfo
} from '../modules/hr/models';

async function seedEmployees() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        // Fetch valid IDs dynamically
        const divisi = await Divisi.findOne();
        const dept = await Department.findOne();
        const posisi = await PosisiJabatan.findOne();
        const status = await StatusKaryawan.findOne({ where: { nama: 'Aktif' } }) || await StatusKaryawan.findOne();
        const lokasi = await LokasiKerja.findOne();
        const tag = await Tag.findOne();
        const jhk = await JenisHubunganKerja.findOne();
        const katPangkat = await KategoriPangkat.findOne();
        const golPangkat = await Golongan.findOne();

        if (!divisi || !dept || !posisi || !status || !lokasi) {
            console.error('❌ Master data missing. Please seed master data first.');
            process.exit(1);
        }

        console.log('🌱 Seeding Employees...');

        // 1. Create Manager
        const manager = await Employee.create({
            nama_lengkap: 'Budi Santoso',
            nomor_induk_karyawan: 'EMP001',
            email_perusahaan: 'budi.santoso@company.com',
            nomor_handphone: '081234567890',
            divisi_id: divisi.id,
            department_id: dept.id,
            posisi_jabatan_id: posisi.id,
            status_karyawan_id: status.id,
            lokasi_kerja_id: lokasi.id,
            tag_id: tag?.id // Use optional chaining to get undefined if null
        } as any);

        await EmployeePersonalInfo.create({
            employee_id: manager.id,
            jenis_kelamin: 'Laki-laki',
            tempat_lahir: 'Jakarta',
            tanggal_lahir: '1980-01-01',
            email_pribadi: 'budi.personal@gmail.com',
            agama: 'Islam',
            golongan_darah: 'O',
            nomor_ktp: '1234567890123456',
            alamat_domisili: 'Jl. Sudirman No. 1',
            kota_domisili: 'Jakarta Selatan',
            status_pernikahan: 'Menikah',
            nama_pasangan: 'Siti Aminah',
            jumlah_anak: 2
        } as any);

        await EmployeeHRInfo.create({
            employee_id: manager.id,
            jenis_hubungan_kerja_id: jhk?.id,
            tanggal_masuk: '2010-01-01',
            tingkat_pendidikan: 'S1',
            nama_sekolah: 'Universitas Indonesia',
            kategori_pangkat_id: katPangkat?.id,
            golongan_pangkat_id: golPangkat?.id
        } as any);

        // 2. Create Staff
        const staff = await Employee.create({
            nama_lengkap: 'Ani Lestari',
            nomor_induk_karyawan: 'EMP002',
            email_perusahaan: 'ani.lestari@company.com',
            nomor_handphone: '089876543210',
            divisi_id: divisi.id,
            department_id: dept.id,
            posisi_jabatan_id: posisi.id,
            status_karyawan_id: status.id,
            lokasi_kerja_id: lokasi.id,
            tag_id: tag?.id,
            manager_id: manager.id,
            atasan_langsung_id: manager.id
        } as any);

        await EmployeePersonalInfo.create({
            employee_id: staff.id,
            jenis_kelamin: 'Perempuan',
            tempat_lahir: 'Bandung',
            tanggal_lahir: '1995-02-15',
            email_pribadi: 'ani.l@gmail.com',
            agama: 'Kristen',
            golongan_darah: 'A',
            nomor_ktp: '9876543210987654',
            alamat_domisili: 'Jl. Asia Afrika No. 10',
            kota_domisili: 'Bandung',
            status_pernikahan: 'Belum Menikah'
        } as any);

        await EmployeeHRInfo.create({
            employee_id: staff.id,
            jenis_hubungan_kerja_id: jhk?.id,
            tanggal_masuk: '2020-03-01',
            tingkat_pendidikan: 'D3',
            nama_sekolah: 'Politeknik Negeri Bandung'
        } as any);

        console.log('✅ Seeded 2 Employees successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}

seedEmployees();
