import sequelize from '../config/database';
import {
    Divisi,
    Department,
    PosisiJabatan,
    KategoriPangkat,
    Golongan,
    SubGolongan,
    JenisHubunganKerja,
    Tag,
    LokasiKerja,
    StatusKaryawan,
    Employee,
    EmployeePersonalInfo,
    EmployeeHRInfo,
    EmployeeFamilyInfo
} from '../modules/hr/models';

const seed = async () => {
    try {
        // Note: Assuming master data is already seeded by previous migrations/seeders. 
        // If not, we would need to check/create them here.
        // For this seed, we will query existing master data to assume valid IDs.
        // If IDs are auto-increment and consistent, we can guess, but finding one is safer.

        // Check if we have master data, otherwise we might fail.
        // Ideally, master data seeders should run before this.
        // We will attempt to create dummy employees using IDs 1, if available, or create minimal master data if missing (optional, but good for standalone testing)

        // For simplicity, assuming standard initial seed has run.

        // Create Employee 1 (Manager)
        const manager = await Employee.create({
            nama_lengkap: 'Budi Santoso',
            nomor_induk_karyawan: 'EMP001',
            email_perusahaan: 'budi.santoso@company.com',
            nomor_handphone: '081234567890',
            divisi_id: 1, // Assuming id 1 exists
            department_id: 1,
            posisi_jabatan_id: 1,
            status_karyawan_id: 1,
            lokasi_kerja_id: 1,
            tag_id: 1
        });

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
        });

        await EmployeeHRInfo.create({
            employee_id: manager.id,
            jenis_hubungan_kerja_id: 1,
            tanggal_masuk: '2010-01-01',
            tingkat_pendidikan: 'S1',
            nama_sekolah: 'Universitas Indonesia',
            kategori_pangkat_id: 1,
            golongan_pangkat_id: 1
        });

        await EmployeeFamilyInfo.create({
            employee_id: manager.id,
            nama_ayah_mertua: 'H. Abdul',
            data_anak: [
                { nama: 'Anak 1', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2010-05-05' },
                { nama: 'Anak 2', jenis_kelamin: 'Perempuan', tanggal_lahir: '2012-06-06' }
            ]
        });


        // Create Employee 2 (Staff)
        const staff = await Employee.create({
            nama_lengkap: 'Ani Lestari',
            nomor_induk_karyawan: 'EMP002',
            email_perusahaan: 'ani.lestari@company.com',
            nomor_handphone: '089876543210',
            divisi_id: 1,
            department_id: 1,
            posisi_jabatan_id: 2,
            status_karyawan_id: 1,
            lokasi_kerja_id: 1,
            tag_id: 1,
            manager_id: manager.id, // Set manager
            atasan_langsung_id: manager.id
        });

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
        });

        await EmployeeHRInfo.create({
            employee_id: staff.id,
            jenis_hubungan_kerja_id: 2,
            tanggal_masuk: '2020-03-01',
            tingkat_pendidikan: 'D3',
            nama_sekolah: 'Politeknik Negeri Bandung'
        });

        await EmployeeFamilyInfo.create({
            employee_id: staff.id,
            jumlah_saudara_kandung: 1,
            data_saudara_kandung: [
                { nama: 'Budi Kecil', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2000-01-01', pekerjaan: 'Mahasiswa' }
            ]
        });

        console.log('Seed data created successfully');
    } catch (error) {
        console.error('Error creating seed data:', error);
    }
};

// Execute if run directly
if (require.main === module) {
    seed().then(() => {
        console.log('Done');
        process.exit(0);
    });
}

export default seed;
