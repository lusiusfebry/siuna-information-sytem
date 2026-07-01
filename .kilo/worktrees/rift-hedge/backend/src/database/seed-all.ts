import sequelize from '../config/database';
import { RESOURCES, ACTIONS } from '../shared/constants/permissions';
import {
    Divisi, Department, PosisiJabatan, KategoriPangkat, Golongan, SubGolongan,
    JenisHubunganKerja, Tag, LokasiKerja, StatusKaryawan,
    Employee, EmployeePersonalInfo, EmployeeHRInfo, EmployeeFamilyInfo
} from '../modules/hr/models';
import { Role } from '../modules/auth/models/Role';
import { Permission } from '../modules/auth/models/Permission';
import User from '../modules/auth/models/User';
import {
    InvKategori, InvSubKategori, InvBrand, InvUom, InvProduk, InvGudang,
    InvStok, InvTransaksi, InvTransaksiDetail, InvSerialNumber
} from '../modules/inventory/models';

async function seedAll() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.\n');

        // ═══════════════════════════════════════════
        // LAYER 1: RBAC — Permissions & Roles
        // ═══════════════════════════════════════════
        console.log('--- Layer 1: RBAC ---');

        const permissionsData = [
            { resource: RESOURCES.EMPLOYEES, action: ACTIONS.CREATE },
            { resource: RESOURCES.EMPLOYEES, action: ACTIONS.READ },
            { resource: RESOURCES.EMPLOYEES, action: ACTIONS.UPDATE },
            { resource: RESOURCES.EMPLOYEES, action: ACTIONS.DELETE },
            { resource: RESOURCES.EMPLOYEES, action: ACTIONS.VIEW_ALL },
            { resource: RESOURCES.EMPLOYEES, action: ACTIONS.VIEW_DEPARTMENT },
            { resource: RESOURCES.MASTER_DATA, action: ACTIONS.CREATE },
            { resource: RESOURCES.MASTER_DATA, action: ACTIONS.READ },
            { resource: RESOURCES.MASTER_DATA, action: ACTIONS.UPDATE },
            { resource: RESOURCES.MASTER_DATA, action: ACTIONS.DELETE },
            { resource: RESOURCES.DOCUMENTS, action: ACTIONS.CREATE },
            { resource: RESOURCES.DOCUMENTS, action: ACTIONS.READ },
            { resource: RESOURCES.DOCUMENTS, action: ACTIONS.DELETE },
            { resource: RESOURCES.AUDIT_LOGS, action: ACTIONS.READ },
            { resource: RESOURCES.DASHBOARD, action: ACTIONS.READ },
            { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW_ALL },
            { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW_DEPARTMENT },
            { resource: RESOURCES.IMPORT, action: ACTIONS.IMPORT },
            { resource: RESOURCES.EXPORT, action: ACTIONS.EXPORT },
            { resource: RESOURCES.ROLES, action: ACTIONS.CREATE },
            { resource: RESOURCES.ROLES, action: ACTIONS.READ },
            { resource: RESOURCES.ROLES, action: ACTIONS.UPDATE },
            { resource: RESOURCES.ROLES, action: ACTIONS.DELETE },
            { resource: RESOURCES.USERS, action: ACTIONS.CREATE },
            { resource: RESOURCES.USERS, action: ACTIONS.READ },
            { resource: RESOURCES.USERS, action: ACTIONS.UPDATE },
            { resource: RESOURCES.USERS, action: ACTIONS.DELETE },
            { resource: RESOURCES.INVENTORY_MASTER_DATA, action: ACTIONS.CREATE },
            { resource: RESOURCES.INVENTORY_MASTER_DATA, action: ACTIONS.READ },
            { resource: RESOURCES.INVENTORY_MASTER_DATA, action: ACTIONS.UPDATE },
            { resource: RESOURCES.INVENTORY_MASTER_DATA, action: ACTIONS.DELETE },
            { resource: RESOURCES.INVENTORY_STOCK, action: ACTIONS.CREATE },
            { resource: RESOURCES.INVENTORY_STOCK, action: ACTIONS.READ },
            { resource: RESOURCES.INVENTORY_STOCK, action: ACTIONS.UPDATE },
            { resource: RESOURCES.INVENTORY_STOCK, action: ACTIONS.DELETE },
        ];

        for (const p of permissionsData) {
            await Permission.findOrCreate({ where: { resource: p.resource, action: p.action }, defaults: p });
        }
        console.log('  Permissions seeded');

        const rolesData = [
            { name: 'superadmin', display_name: 'Super Administrator', is_system_role: true },
            { name: 'admin', display_name: 'HR Admin', is_system_role: true },
            { name: 'staff', display_name: 'HR Staff', is_system_role: true },
            { name: 'manager', display_name: 'Manager', is_system_role: true },
            { name: 'employee', display_name: 'Employee', is_system_role: true },
        ];
        for (const r of rolesData) {
            await Role.findOrCreate({ where: { name: r.name }, defaults: r });
        }

        const allPermissions = await Permission.findAll();
        const superadminRole = await Role.findOne({ where: { name: 'superadmin' } });
        if (superadminRole) await superadminRole.setPermissions(allPermissions);

        const adminRole = await Role.findOne({ where: { name: 'admin' } });
        if (adminRole) {
            const findPerms = (res: string, acts?: string[]) =>
                allPermissions.filter(p => p.resource === res && (!acts || acts.includes(p.action)));
            const adminPerms = [
                ...findPerms(RESOURCES.EMPLOYEES), ...findPerms(RESOURCES.MASTER_DATA),
                ...findPerms(RESOURCES.DOCUMENTS), ...findPerms(RESOURCES.AUDIT_LOGS),
                ...findPerms(RESOURCES.DASHBOARD), ...findPerms(RESOURCES.IMPORT), ...findPerms(RESOURCES.EXPORT),
                ...findPerms(RESOURCES.USERS, [ACTIONS.READ, ACTIONS.UPDATE]),
                ...findPerms(RESOURCES.ROLES, [ACTIONS.READ]),
                ...findPerms(RESOURCES.INVENTORY_MASTER_DATA), ...findPerms(RESOURCES.INVENTORY_STOCK),
            ];
            await adminRole.setPermissions(adminPerms);
        }
        console.log('  Roles seeded & permissions assigned');

        // ═══════════════════════════════════════════
        // LAYER 2: HR Master Data
        // ═══════════════════════════════════════════
        console.log('\n--- Layer 2: HR Master Data ---');

        const [divSDM] = await Divisi.findOrCreate({ where: { code: 'DIV001' }, defaults: { code: 'DIV001', nama: 'SDM & Umum', keterangan: 'Human Resources and General Affairs', status: 'Aktif' } as any });
        const [divIT] = await Divisi.findOrCreate({ where: { code: 'DIV002' }, defaults: { code: 'DIV002', nama: 'Information Technology', keterangan: 'IT Infrastructure and Development', status: 'Aktif' } as any });
        const [divOps] = await Divisi.findOrCreate({ where: { code: 'DIV003' }, defaults: { code: 'DIV003', nama: 'Operasional', keterangan: 'Production and Operations', status: 'Aktif' } as any });
        await Divisi.findOrCreate({ where: { code: 'DIV004' }, defaults: { code: 'DIV004', nama: 'Keuangan', keterangan: 'Finance and Accounting', status: 'Aktif' } as any });
        console.log('  Divisi: 4');

        const [deptRecruit] = await Department.findOrCreate({ where: { code: 'DEP001' }, defaults: { code: 'DEP001', nama: 'Recruitment', divisi_id: divSDM.id, status: 'Aktif' } as any });
        await Department.findOrCreate({ where: { code: 'DEP002' }, defaults: { code: 'DEP002', nama: 'Training & Development', divisi_id: divSDM.id, status: 'Aktif' } as any });
        const [deptInfra] = await Department.findOrCreate({ where: { code: 'DEP003' }, defaults: { code: 'DEP003', nama: 'IT Infrastructure', divisi_id: divIT.id, status: 'Aktif' } as any });
        const [deptDev] = await Department.findOrCreate({ where: { code: 'DEP004' }, defaults: { code: 'DEP004', nama: 'IT Development', divisi_id: divIT.id, status: 'Aktif' } as any });
        const [deptProd] = await Department.findOrCreate({ where: { code: 'DEP005' }, defaults: { code: 'DEP005', nama: 'Produksi', divisi_id: divOps.id, status: 'Aktif' } as any });
        await Department.findOrCreate({ where: { code: 'DEP006' }, defaults: { code: 'DEP006', nama: 'Finance', divisi_id: divOps.id, status: 'Aktif' } as any });
        console.log('  Department: 6');

        const [posHRMgr] = await PosisiJabatan.findOrCreate({ where: { code: 'POS001' }, defaults: { code: 'POS001', nama: 'HR Manager', department_id: deptRecruit.id, status: 'Aktif' } as any });
        const [posRecruiter] = await PosisiJabatan.findOrCreate({ where: { code: 'POS002' }, defaults: { code: 'POS002', nama: 'Recruiter', department_id: deptRecruit.id, status: 'Aktif' } as any });
        const [posITSupport] = await PosisiJabatan.findOrCreate({ where: { code: 'POS003' }, defaults: { code: 'POS003', nama: 'IT Support', department_id: deptInfra.id, status: 'Aktif' } as any });
        await PosisiJabatan.findOrCreate({ where: { code: 'POS004' }, defaults: { code: 'POS004', nama: 'Network Engineer', department_id: deptInfra.id, status: 'Aktif' } as any });
        const [posProgrammer] = await PosisiJabatan.findOrCreate({ where: { code: 'POS005' }, defaults: { code: 'POS005', nama: 'Programmer', department_id: deptDev.id, status: 'Aktif' } as any });
        const [posOperator] = await PosisiJabatan.findOrCreate({ where: { code: 'POS006' }, defaults: { code: 'POS006', nama: 'Operator Produksi', department_id: deptProd.id, status: 'Aktif' } as any });
        await PosisiJabatan.findOrCreate({ where: { code: 'POS007' }, defaults: { code: 'POS007', nama: 'Finance Staff', department_id: deptProd.id, status: 'Aktif' } as any });
        console.log('  PosisiJabatan: 7');

        const [katMgr] = await KategoriPangkat.findOrCreate({ where: { code: 'KAT001' }, defaults: { code: 'KAT001', nama: 'Managerial', keterangan: 'Level Manager', status: 'Aktif' } as any });
        const [katSpv] = await KategoriPangkat.findOrCreate({ where: { code: 'KAT002' }, defaults: { code: 'KAT002', nama: 'Supervisor', keterangan: 'Level Supervisor', status: 'Aktif' } as any });
        const [katStaff] = await KategoriPangkat.findOrCreate({ where: { code: 'KAT003' }, defaults: { code: 'KAT003', nama: 'Staff', keterangan: 'Level Staff', status: 'Aktif' } as any });
        console.log('  KategoriPangkat: 3');

        const [golI] = await Golongan.findOrCreate({ where: { code: 'GOL001' }, defaults: { code: 'GOL001', nama: 'Golongan I', keterangan: 'Golongan Rendah', status: 'Aktif' } as any });
        const [golII] = await Golongan.findOrCreate({ where: { code: 'GOL002' }, defaults: { code: 'GOL002', nama: 'Golongan II', keterangan: 'Golongan Menengah', status: 'Aktif' } as any });
        const [golIII] = await Golongan.findOrCreate({ where: { code: 'GOL003' }, defaults: { code: 'GOL003', nama: 'Golongan III', keterangan: 'Golongan Tinggi', status: 'Aktif' } as any });
        await Golongan.findOrCreate({ where: { code: 'GOL004' }, defaults: { code: 'GOL004', nama: 'Golongan IV', keterangan: 'Golongan Tertinggi', status: 'Aktif' } as any });
        console.log('  Golongan: 4');

        const [subIA] = await SubGolongan.findOrCreate({ where: { code: 'SUB001' }, defaults: { code: 'SUB001', nama: 'IA', keterangan: 'Sub Golongan IA', status: 'Aktif' } as any });
        await SubGolongan.findOrCreate({ where: { code: 'SUB002' }, defaults: { code: 'SUB002', nama: 'IB', keterangan: 'Sub Golongan IB', status: 'Aktif' } as any });
        const [subIIA] = await SubGolongan.findOrCreate({ where: { code: 'SUB003' }, defaults: { code: 'SUB003', nama: 'IIA', keterangan: 'Sub Golongan IIA', status: 'Aktif' } as any });
        await SubGolongan.findOrCreate({ where: { code: 'SUB004' }, defaults: { code: 'SUB004', nama: 'IIB', keterangan: 'Sub Golongan IIB', status: 'Aktif' } as any });
        await SubGolongan.findOrCreate({ where: { code: 'SUB005' }, defaults: { code: 'SUB005', nama: 'IIIA', keterangan: 'Sub Golongan IIIA', status: 'Aktif' } as any });
        console.log('  SubGolongan: 5');

        const [jhkPKWT] = await JenisHubunganKerja.findOrCreate({ where: { code: 'JHK001' }, defaults: { code: 'JHK001', nama: 'PKWT', keterangan: 'Perjanjian Kerja Waktu Tertentu', status: 'Aktif' } as any });
        const [jhkPKWTT] = await JenisHubunganKerja.findOrCreate({ where: { code: 'JHK002' }, defaults: { code: 'JHK002', nama: 'PKWTT', keterangan: 'Perjanjian Kerja Waktu Tidak Tertentu', status: 'Aktif' } as any });
        await JenisHubunganKerja.findOrCreate({ where: { code: 'JHK003' }, defaults: { code: 'JHK003', nama: 'Harian', keterangan: 'Pekerja Harian Lepas', status: 'Aktif' } as any });
        console.log('  JenisHubunganKerja: 3');

        const [tagUrgent] = await Tag.findOrCreate({ where: { code: 'TAG001' }, defaults: { code: 'TAG001', nama: 'Urgent', warna_tag: '#EF4444', keterangan: 'High Priority', status: 'Aktif' } as any });
        const [tagNewHire] = await Tag.findOrCreate({ where: { code: 'TAG002' }, defaults: { code: 'TAG002', nama: 'New Hire', warna_tag: '#10B981', keterangan: 'Karyawan Baru', status: 'Aktif' } as any });
        await Tag.findOrCreate({ where: { code: 'TAG003' }, defaults: { code: 'TAG003', nama: 'Remote', warna_tag: '#3B82F6', keterangan: 'Remote Worker', status: 'Aktif' } as any });
        console.log('  Tag: 3');

        const [lokPusat] = await LokasiKerja.findOrCreate({ where: { code: 'LOK001' }, defaults: { code: 'LOK001', nama: 'Kantor Pusat', alamat: 'Jl. Sudirman No. 1, Jakarta Selatan', status: 'Aktif' } as any });
        const [lokJkt] = await LokasiKerja.findOrCreate({ where: { code: 'LOK002' }, defaults: { code: 'LOK002', nama: 'Site Jakarta', alamat: 'Jl. Industri No. 5, Bekasi', status: 'Aktif' } as any });
        await LokasiKerja.findOrCreate({ where: { code: 'LOK003' }, defaults: { code: 'LOK003', nama: 'Site Bandung', alamat: 'Jl. Soekarno Hatta No. 100, Bandung', status: 'Aktif' } as any });
        console.log('  LokasiKerja: 3');

        const [stsAktif] = await StatusKaryawan.findOrCreate({ where: { code: 'STK001' }, defaults: { code: 'STK001', nama: 'Aktif', keterangan: 'Karyawan Aktif', status: 'Aktif' } as any });
        await StatusKaryawan.findOrCreate({ where: { code: 'STK002' }, defaults: { code: 'STK002', nama: 'Resign', keterangan: 'Karyawan Mengundurkan Diri', status: 'Aktif' } as any });
        await StatusKaryawan.findOrCreate({ where: { code: 'STK003' }, defaults: { code: 'STK003', nama: 'Cuti', keterangan: 'Karyawan sedang Cuti', status: 'Aktif' } as any });
        await StatusKaryawan.findOrCreate({ where: { code: 'STK004' }, defaults: { code: 'STK004', nama: 'Pensiun', keterangan: 'Karyawan Pensiun', status: 'Aktif' } as any });
        console.log('  StatusKaryawan: 4');

        // ═══════════════════════════════════════════
        // LAYER 3: Employees (5 karyawan)
        // ═══════════════════════════════════════════
        console.log('\n--- Layer 3: Employees ---');

        const [emp1] = await Employee.findOrCreate({ where: { nomor_induk_karyawan: 'EMP001' }, defaults: {
            nama_lengkap: 'Budi Santoso', nomor_induk_karyawan: 'EMP001', email_perusahaan: 'budi.santoso@company.com',
            nomor_handphone: '081234567890', divisi_id: divSDM.id, department_id: deptRecruit.id,
            posisi_jabatan_id: posHRMgr.id, status_karyawan_id: stsAktif.id, lokasi_kerja_id: lokPusat.id, tag_id: tagUrgent.id,
        } as any });

        const [emp2] = await Employee.findOrCreate({ where: { nomor_induk_karyawan: 'EMP002' }, defaults: {
            nama_lengkap: 'Ani Lestari', nomor_induk_karyawan: 'EMP002', email_perusahaan: 'ani.lestari@company.com',
            nomor_handphone: '089876543210', divisi_id: divSDM.id, department_id: deptRecruit.id,
            posisi_jabatan_id: posRecruiter.id, status_karyawan_id: stsAktif.id, lokasi_kerja_id: lokPusat.id,
            tag_id: tagNewHire.id, manager_id: emp1.id, atasan_langsung_id: emp1.id,
        } as any });

        const [emp3] = await Employee.findOrCreate({ where: { nomor_induk_karyawan: 'EMP003' }, defaults: {
            nama_lengkap: 'Cahyo Wibowo', nomor_induk_karyawan: 'EMP003', email_perusahaan: 'cahyo.wibowo@company.com',
            nomor_handphone: '081345678901', divisi_id: divIT.id, department_id: deptInfra.id,
            posisi_jabatan_id: posITSupport.id, status_karyawan_id: stsAktif.id, lokasi_kerja_id: lokPusat.id,
        } as any });

        const [emp4] = await Employee.findOrCreate({ where: { nomor_induk_karyawan: 'EMP004' }, defaults: {
            nama_lengkap: 'Dewi Rahmawati', nomor_induk_karyawan: 'EMP004', email_perusahaan: 'dewi.rahmawati@company.com',
            nomor_handphone: '082456789012', divisi_id: divIT.id, department_id: deptDev.id,
            posisi_jabatan_id: posProgrammer.id, status_karyawan_id: stsAktif.id, lokasi_kerja_id: lokJkt.id,
            manager_id: emp3.id, atasan_langsung_id: emp3.id,
        } as any });

        const [emp5] = await Employee.findOrCreate({ where: { nomor_induk_karyawan: 'EMP005' }, defaults: {
            nama_lengkap: 'Eko Prasetyo', nomor_induk_karyawan: 'EMP005', email_perusahaan: 'eko.prasetyo@company.com',
            nomor_handphone: '083567890123', divisi_id: divOps.id, department_id: deptProd.id,
            posisi_jabatan_id: posOperator.id, status_karyawan_id: stsAktif.id, lokasi_kerja_id: lokJkt.id,
        } as any });

        console.log('  Employees: 5');

        // Personal Info
        const personalData = [
            { employee_id: emp1.id, jenis_kelamin: 'Laki-laki', tempat_lahir: 'Jakarta', tanggal_lahir: '1980-05-15', email_pribadi: 'budi.personal@gmail.com', agama: 'Islam', golongan_darah: 'O', nomor_ktp: '3171051505800001', alamat_domisili: 'Jl. Sudirman No. 1, Kebayoran Baru', kota_domisili: 'Jakarta Selatan', provinsi_domisili: 'DKI Jakarta', status_pernikahan: 'Menikah', nama_pasangan: 'Siti Aminah', jumlah_anak: 2, nomor_rekening: '1234567890', nama_pemegang_rekening: 'Budi Santoso', nama_bank: 'BCA', cabang_bank: 'KCP Sudirman' },
            { employee_id: emp2.id, jenis_kelamin: 'Perempuan', tempat_lahir: 'Bandung', tanggal_lahir: '1995-02-20', email_pribadi: 'ani.lestari@gmail.com', agama: 'Kristen', golongan_darah: 'A', nomor_ktp: '3273062002950002', alamat_domisili: 'Jl. Asia Afrika No. 10', kota_domisili: 'Bandung', provinsi_domisili: 'Jawa Barat', status_pernikahan: 'Belum Menikah', jumlah_anak: 0, nomor_rekening: '0987654321', nama_pemegang_rekening: 'Ani Lestari', nama_bank: 'Mandiri', cabang_bank: 'KCP Bandung' },
            { employee_id: emp3.id, jenis_kelamin: 'Laki-laki', tempat_lahir: 'Semarang', tanggal_lahir: '1988-11-03', email_pribadi: 'cahyo.w@gmail.com', agama: 'Islam', golongan_darah: 'B', nomor_ktp: '3374030311880003', alamat_domisili: 'Jl. Pemuda No. 45', kota_domisili: 'Semarang', provinsi_domisili: 'Jawa Tengah', status_pernikahan: 'Menikah', nama_pasangan: 'Rina Kusuma', jumlah_anak: 1 },
            { employee_id: emp4.id, jenis_kelamin: 'Perempuan', tempat_lahir: 'Surabaya', tanggal_lahir: '1992-07-25', email_pribadi: 'dewi.r@gmail.com', agama: 'Hindu', golongan_darah: 'AB', nomor_ktp: '3578066507920004', alamat_domisili: 'Jl. Darmo No. 22', kota_domisili: 'Surabaya', provinsi_domisili: 'Jawa Timur', status_pernikahan: 'Belum Menikah', jumlah_anak: 0 },
            { employee_id: emp5.id, jenis_kelamin: 'Laki-laki', tempat_lahir: 'Yogyakarta', tanggal_lahir: '1990-01-10', email_pribadi: 'eko.p@gmail.com', agama: 'Islam', golongan_darah: 'O', nomor_ktp: '3471011001900005', alamat_domisili: 'Jl. Malioboro No. 88', kota_domisili: 'Yogyakarta', provinsi_domisili: 'DI Yogyakarta', status_pernikahan: 'Menikah', nama_pasangan: 'Sri Wahyuni', jumlah_anak: 3 },
        ];
        for (const p of personalData) {
            await EmployeePersonalInfo.findOrCreate({ where: { employee_id: p.employee_id }, defaults: p as any });
        }
        console.log('  PersonalInfo: 5');

        // HR Info
        const hrData = [
            { employee_id: emp1.id, jenis_hubungan_kerja_id: jhkPKWTT.id, tanggal_masuk_group: '2008-01-01', tanggal_masuk: '2010-03-01', tanggal_permanent: '2011-03-01', tingkat_pendidikan: 'S1', bidang_studi: 'Manajemen SDM', nama_sekolah: 'Universitas Indonesia', kota_sekolah: 'Depok', kategori_pangkat_id: katMgr.id, golongan_pangkat_id: golIII.id, sub_golongan_pangkat_id: subIA.id },
            { employee_id: emp2.id, jenis_hubungan_kerja_id: jhkPKWT.id, tanggal_masuk: '2022-06-01', tanggal_kontrak: '2022-06-01', tanggal_akhir_kontrak: '2024-06-01', tingkat_pendidikan: 'D3', bidang_studi: 'Administrasi', nama_sekolah: 'Politeknik Negeri Bandung', kota_sekolah: 'Bandung', kategori_pangkat_id: katStaff.id, golongan_pangkat_id: golI.id },
            { employee_id: emp3.id, jenis_hubungan_kerja_id: jhkPKWTT.id, tanggal_masuk: '2015-08-15', tanggal_permanent: '2016-08-15', tingkat_pendidikan: 'S1', bidang_studi: 'Teknik Informatika', nama_sekolah: 'Universitas Diponegoro', kota_sekolah: 'Semarang', kategori_pangkat_id: katSpv.id, golongan_pangkat_id: golII.id, sub_golongan_pangkat_id: subIIA.id },
            { employee_id: emp4.id, jenis_hubungan_kerja_id: jhkPKWT.id, tanggal_masuk: '2023-01-10', tanggal_kontrak: '2023-01-10', tanggal_akhir_kontrak: '2025-01-10', tingkat_pendidikan: 'S1', bidang_studi: 'Ilmu Komputer', nama_sekolah: 'Institut Teknologi Sepuluh Nopember', kota_sekolah: 'Surabaya', kategori_pangkat_id: katStaff.id, golongan_pangkat_id: golI.id },
            { employee_id: emp5.id, jenis_hubungan_kerja_id: jhkPKWTT.id, tanggal_masuk: '2018-04-01', tanggal_permanent: '2019-04-01', tingkat_pendidikan: 'SMA', nama_sekolah: 'SMA Negeri 1 Yogyakarta', kota_sekolah: 'Yogyakarta', kategori_pangkat_id: katStaff.id, golongan_pangkat_id: golI.id },
        ];
        for (const h of hrData) {
            await EmployeeHRInfo.findOrCreate({ where: { employee_id: h.employee_id }, defaults: h as any });
        }
        console.log('  HRInfo: 5');

        // Family Info
        const familyData = [
            { employee_id: emp1.id, nama_ayah_kandung: 'H. Suharto', nama_ibu_kandung: 'Hj. Kartini', jumlah_saudara_kandung: 2, data_anak: [{ nama: 'Ahmad Budi Jr', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2012-03-15' }, { nama: 'Sari Budianti', jenis_kelamin: 'Perempuan', tanggal_lahir: '2015-09-20' }] },
            { employee_id: emp2.id, nama_ayah_kandung: 'Agus Lestari', nama_ibu_kandung: 'Maria Lestari', jumlah_saudara_kandung: 1, data_saudara_kandung: [{ nama: 'Andi Lestari', jenis_kelamin: 'Laki-laki', tanggal_lahir: '1998-05-10', pekerjaan: 'Mahasiswa' }] },
            { employee_id: emp3.id, nama_ayah_kandung: 'Wibowo Sr', nama_ibu_kandung: 'Nurhayati', jumlah_saudara_kandung: 3, data_anak: [{ nama: 'Cahyo Jr', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2020-12-01' }] },
            { employee_id: emp4.id, nama_ayah_kandung: 'I Nyoman Rahmat', nama_ibu_kandung: 'Ni Wayan Dewi', jumlah_saudara_kandung: 2 },
            { employee_id: emp5.id, nama_ayah_kandung: 'Prasetyo Sr', nama_ibu_kandung: 'Endang', jumlah_saudara_kandung: 4, data_anak: [{ nama: 'Eko Jr', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2019-06-10' }, { nama: 'Putri Eko', jenis_kelamin: 'Perempuan', tanggal_lahir: '2021-02-14' }, { nama: 'Bayu Eko', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2023-08-30' }] },
        ];
        for (const f of familyData) {
            await EmployeeFamilyInfo.findOrCreate({ where: { employee_id: f.employee_id }, defaults: f as any });
        }
        console.log('  FamilyInfo: 5');

        // ═══════════════════════════════════════════
        // LAYER 4: Users
        // ═══════════════════════════════════════════
        console.log('\n--- Layer 4: Users ---');

        if (superadminRole) {
            await User.findOrCreate({ where: { nik: '111111' }, defaults: { nama: 'Superadmin', nik: '111111', password: 'password123', role_id: superadminRole.id, employee_id: emp1.id, is_active: true } as any });
            await User.findOrCreate({ where: { nik: '1234567890123456' }, defaults: { nama: 'Superadmin Full', nik: '1234567890123456', password: 'password123', role_id: superadminRole.id, is_active: true } as any });
        }
        console.log('  Users: 2 (superadmin)');

        // ═══════════════════════════════════════════
        // LAYER 5: Inventory Master Data
        // ═══════════════════════════════════════════
        console.log('\n--- Layer 5: Inventory Master Data ---');

        const [ikatInventory] = await InvKategori.findOrCreate({ where: { code: 'IKAT001' }, defaults: { code: 'IKAT001', nama: 'Inventory', keterangan: 'Barang inventaris umum', status: 'Aktif' } as any });
        const [ikatFixedAsset] = await InvKategori.findOrCreate({ where: { code: 'IKAT002' }, defaults: { code: 'IKAT002', nama: 'Fixed Asset', keterangan: 'Aset tetap perusahaan', status: 'Aktif' } as any });
        const [ikatConsumable] = await InvKategori.findOrCreate({ where: { code: 'IKAT003' }, defaults: { code: 'IKAT003', nama: 'Consumable Asset', keterangan: 'Barang habis pakai', status: 'Aktif' } as any });
        console.log('  InvKategori: 3');

        const [isubLaptop] = await InvSubKategori.findOrCreate({ where: { code: 'ISUB001' }, defaults: { code: 'ISUB001', nama: 'Laptop', kategori_id: ikatInventory.id, status: 'Aktif' } as any });
        const [isubDesktop] = await InvSubKategori.findOrCreate({ where: { code: 'ISUB002' }, defaults: { code: 'ISUB002', nama: 'Desktop', kategori_id: ikatInventory.id, status: 'Aktif' } as any });
        const [isubPrinter] = await InvSubKategori.findOrCreate({ where: { code: 'ISUB003' }, defaults: { code: 'ISUB003', nama: 'Printer', kategori_id: ikatInventory.id, status: 'Aktif' } as any });
        const [isubATK] = await InvSubKategori.findOrCreate({ where: { code: 'ISUB004' }, defaults: { code: 'ISUB004', nama: 'ATK', kategori_id: ikatConsumable.id, status: 'Aktif' } as any });
        const [isubKertas] = await InvSubKategori.findOrCreate({ where: { code: 'ISUB005' }, defaults: { code: 'ISUB005', nama: 'Kertas', kategori_id: ikatConsumable.id, status: 'Aktif' } as any });
        const [isubMeja] = await InvSubKategori.findOrCreate({ where: { code: 'ISUB006' }, defaults: { code: 'ISUB006', nama: 'Meja', kategori_id: ikatFixedAsset.id, status: 'Aktif' } as any });
        const [isubKursi] = await InvSubKategori.findOrCreate({ where: { code: 'ISUB007' }, defaults: { code: 'ISUB007', nama: 'Kursi', kategori_id: ikatFixedAsset.id, status: 'Aktif' } as any });
        console.log('  InvSubKategori: 7');

        const [ibrnLenovo] = await InvBrand.findOrCreate({ where: { code: 'IBRN001' }, defaults: { code: 'IBRN001', nama: 'Lenovo', sub_kategori_id: isubLaptop.id, status: 'Aktif' } as any });
        const [ibrnDell] = await InvBrand.findOrCreate({ where: { code: 'IBRN002' }, defaults: { code: 'IBRN002', nama: 'Dell', sub_kategori_id: isubDesktop.id, status: 'Aktif' } as any });
        const [ibrnHP] = await InvBrand.findOrCreate({ where: { code: 'IBRN003' }, defaults: { code: 'IBRN003', nama: 'HP', sub_kategori_id: isubPrinter.id, status: 'Aktif' } as any });
        const [ibrnCanon] = await InvBrand.findOrCreate({ where: { code: 'IBRN004' }, defaults: { code: 'IBRN004', nama: 'Canon', sub_kategori_id: isubPrinter.id, status: 'Aktif' } as any });
        const [ibrnPaperOne] = await InvBrand.findOrCreate({ where: { code: 'IBRN005' }, defaults: { code: 'IBRN005', nama: 'PaperOne', sub_kategori_id: isubKertas.id, status: 'Aktif' } as any });
        const [ibrnIKEA] = await InvBrand.findOrCreate({ where: { code: 'IBRN006' }, defaults: { code: 'IBRN006', nama: 'IKEA', sub_kategori_id: isubMeja.id, status: 'Aktif' } as any });
        const [ibrnPilot] = await InvBrand.findOrCreate({ where: { code: 'IBRN007' }, defaults: { code: 'IBRN007', nama: 'Pilot', sub_kategori_id: isubATK.id, status: 'Aktif' } as any });
        const [ibrnIKEAKursi] = await InvBrand.findOrCreate({ where: { code: 'IBRN008' }, defaults: { code: 'IBRN008', nama: 'IKEA Ergonomic', sub_kategori_id: isubKursi.id, status: 'Aktif' } as any });
        console.log('  InvBrand: 8');

        const [uomUnit] = await InvUom.findOrCreate({ where: { code: 'IUOM001' }, defaults: { code: 'IUOM001', nama: 'Unit', status: 'Aktif' } as any });
        const [uomPcs] = await InvUom.findOrCreate({ where: { code: 'IUOM002' }, defaults: { code: 'IUOM002', nama: 'Pcs', status: 'Aktif' } as any });
        const [uomRim] = await InvUom.findOrCreate({ where: { code: 'IUOM003' }, defaults: { code: 'IUOM003', nama: 'Rim', status: 'Aktif' } as any });
        const [uomBox] = await InvUom.findOrCreate({ where: { code: 'IUOM004' }, defaults: { code: 'IUOM004', nama: 'Box', status: 'Aktif' } as any });
        const [uomSet] = await InvUom.findOrCreate({ where: { code: 'IUOM005' }, defaults: { code: 'IUOM005', nama: 'Set', status: 'Aktif' } as any });
        console.log('  InvUom: 5');

        const [prdLaptop] = await InvProduk.findOrCreate({ where: { code: 'IPRD001' }, defaults: { code: 'IPRD001', nama: 'Lenovo ThinkPad T14', brand_id: ibrnLenovo.id, has_serial_number: true, status: 'Aktif' } as any });
        const [prdDesktop] = await InvProduk.findOrCreate({ where: { code: 'IPRD002' }, defaults: { code: 'IPRD002', nama: 'Dell OptiPlex 3090', brand_id: ibrnDell.id, has_serial_number: true, status: 'Aktif' } as any });
        const [prdHPPrinter] = await InvProduk.findOrCreate({ where: { code: 'IPRD003' }, defaults: { code: 'IPRD003', nama: 'HP LaserJet Pro M404dn', brand_id: ibrnHP.id, has_serial_number: true, status: 'Aktif' } as any });
        const [prdCanon] = await InvProduk.findOrCreate({ where: { code: 'IPRD004' }, defaults: { code: 'IPRD004', nama: 'Canon PIXMA G3020', brand_id: ibrnCanon.id, has_serial_number: true, status: 'Aktif' } as any });
        const [prdKertas] = await InvProduk.findOrCreate({ where: { code: 'IPRD005' }, defaults: { code: 'IPRD005', nama: 'Kertas A4 70gsm', brand_id: ibrnPaperOne.id, has_serial_number: false, status: 'Aktif' } as any });
        const [prdPulpen] = await InvProduk.findOrCreate({ where: { code: 'IPRD006' }, defaults: { code: 'IPRD006', nama: 'Pulpen Pilot G-2', brand_id: ibrnPilot.id, has_serial_number: false, status: 'Aktif' } as any });
        const [prdMeja] = await InvProduk.findOrCreate({ where: { code: 'IPRD007' }, defaults: { code: 'IPRD007', nama: 'Meja Kerja 120x60', brand_id: ibrnIKEA.id, has_serial_number: true, status: 'Aktif' } as any });
        const [prdKursi] = await InvProduk.findOrCreate({ where: { code: 'IPRD008' }, defaults: { code: 'IPRD008', nama: 'Kursi Ergonomic Mesh', brand_id: ibrnIKEAKursi.id, has_serial_number: true, status: 'Aktif' } as any });
        const [prdTinta] = await InvProduk.findOrCreate({ where: { code: 'IPRD009' }, defaults: { code: 'IPRD009', nama: 'Tinta Printer Canon GI-71', brand_id: ibrnCanon.id, has_serial_number: false, status: 'Aktif' } as any });
        const [prdAmplop] = await InvProduk.findOrCreate({ where: { code: 'IPRD010' }, defaults: { code: 'IPRD010', nama: 'Amplop Coklat A4', brand_id: ibrnPilot.id, has_serial_number: false, status: 'Aktif' } as any });
        console.log('  InvProduk: 10');

        const [gudUtama] = await InvGudang.findOrCreate({ where: { code: 'IGUD001' }, defaults: { code: 'IGUD001', nama: 'Gudang Utama Jakarta', lokasi: 'Gedung A Lantai 1, Kantor Pusat', penanggung_jawab_id: emp1.id, department_id: deptRecruit.id, status: 'Aktif' } as any });
        const [gudIT] = await InvGudang.findOrCreate({ where: { code: 'IGUD002' }, defaults: { code: 'IGUD002', nama: 'Gudang IT Bandung', lokasi: 'Gedung B, Site Bandung', penanggung_jawab_id: emp3.id, department_id: deptInfra.id, status: 'Aktif' } as any });
        await InvGudang.findOrCreate({ where: { code: 'IGUD003' }, defaults: { code: 'IGUD003', nama: 'Gudang Operasional', lokasi: 'Gedung C, Site Jakarta', penanggung_jawab_id: emp5.id, department_id: deptProd.id, status: 'Aktif' } as any });
        console.log('  InvGudang: 3');

        // ═══════════════════════════════════════════
        // LAYER 6: Inventory Transactions & Stock
        // ═══════════════════════════════════════════
        console.log('\n--- Layer 6: Inventory Transactions & Stock ---');

        const seedUser = await User.findOne({ where: { nik: '111111' } });
        const createdBy = seedUser?.id || null;
        const today = new Date().toISOString().split('T')[0];

        // --- Transaksi Masuk 1: IT Equipment ke Gudang Utama ---
        const [trxIn1] = await InvTransaksi.findOrCreate({ where: { code: 'TRX-IN-001' }, defaults: {
            code: 'TRX-IN-001', tipe: 'Masuk', sub_tipe: 'Supplier', tanggal: today,
            gudang_id: gudUtama.id, supplier_nama: 'PT Techno Indonesia', no_referensi: 'PO-2026-001',
            catatan: 'Pengadaan laptop dan desktop Q1 2026', created_by: createdBy,
        } as any });

        await InvTransaksiDetail.findOrCreate({ where: { transaksi_id: trxIn1.id, produk_id: prdLaptop.id }, defaults: { transaksi_id: trxIn1.id, produk_id: prdLaptop.id, uom_id: uomUnit.id, jumlah: 5 } as any });
        await InvTransaksiDetail.findOrCreate({ where: { transaksi_id: trxIn1.id, produk_id: prdDesktop.id }, defaults: { transaksi_id: trxIn1.id, produk_id: prdDesktop.id, uom_id: uomUnit.id, jumlah: 3 } as any });

        // --- Transaksi Masuk 2: Office Supplies ke Gudang Utama ---
        const [trxIn2] = await InvTransaksi.findOrCreate({ where: { code: 'TRX-IN-002' }, defaults: {
            code: 'TRX-IN-002', tipe: 'Masuk', sub_tipe: 'Supplier', tanggal: today,
            gudang_id: gudUtama.id, supplier_nama: 'CV Alat Tulis Jaya', no_referensi: 'PO-2026-002',
            catatan: 'Pengadaan ATK bulanan', created_by: createdBy,
        } as any });

        await InvTransaksiDetail.findOrCreate({ where: { transaksi_id: trxIn2.id, produk_id: prdKertas.id }, defaults: { transaksi_id: trxIn2.id, produk_id: prdKertas.id, uom_id: uomRim.id, jumlah: 50 } as any });
        await InvTransaksiDetail.findOrCreate({ where: { transaksi_id: trxIn2.id, produk_id: prdPulpen.id }, defaults: { transaksi_id: trxIn2.id, produk_id: prdPulpen.id, uom_id: uomPcs.id, jumlah: 100 } as any });
        await InvTransaksiDetail.findOrCreate({ where: { transaksi_id: trxIn2.id, produk_id: prdAmplop.id }, defaults: { transaksi_id: trxIn2.id, produk_id: prdAmplop.id, uom_id: uomBox.id, jumlah: 20 } as any });

        // --- Transaksi Masuk 3: Furniture + Printer ke Gudang IT Bandung ---
        const [trxIn3] = await InvTransaksi.findOrCreate({ where: { code: 'TRX-IN-003' }, defaults: {
            code: 'TRX-IN-003', tipe: 'Masuk', sub_tipe: 'Supplier', tanggal: today,
            gudang_id: gudIT.id, supplier_nama: 'PT Furnitek Indonesia', no_referensi: 'PO-2026-003',
            catatan: 'Setup ruang kerja baru Bandung', created_by: createdBy,
        } as any });

        await InvTransaksiDetail.findOrCreate({ where: { transaksi_id: trxIn3.id, produk_id: prdMeja.id }, defaults: { transaksi_id: trxIn3.id, produk_id: prdMeja.id, uom_id: uomSet.id, jumlah: 10 } as any });
        await InvTransaksiDetail.findOrCreate({ where: { transaksi_id: trxIn3.id, produk_id: prdKursi.id }, defaults: { transaksi_id: trxIn3.id, produk_id: prdKursi.id, uom_id: uomSet.id, jumlah: 15 } as any });
        await InvTransaksiDetail.findOrCreate({ where: { transaksi_id: trxIn3.id, produk_id: prdHPPrinter.id }, defaults: { transaksi_id: trxIn3.id, produk_id: prdHPPrinter.id, uom_id: uomUnit.id, jumlah: 4 } as any });

        console.log('  Transaksi Masuk: 3');

        // --- Transaksi Keluar 1: Laptop ke Karyawan ---
        const [trxOut1] = await InvTransaksi.findOrCreate({ where: { code: 'TRX-OUT-001' }, defaults: {
            code: 'TRX-OUT-001', tipe: 'Keluar', sub_tipe: 'Ke Karyawan', tanggal: today,
            gudang_id: gudUtama.id, karyawan_id: emp3.id,
            catatan: 'Distribusi laptop ke tim IT', created_by: createdBy,
        } as any });

        await InvTransaksiDetail.findOrCreate({ where: { transaksi_id: trxOut1.id, produk_id: prdLaptop.id }, defaults: { transaksi_id: trxOut1.id, produk_id: prdLaptop.id, uom_id: uomUnit.id, jumlah: 2 } as any });

        // --- Transaksi Keluar 2: Transfer Gudang Desktop ---
        const [trxOut2] = await InvTransaksi.findOrCreate({ where: { code: 'TRX-OUT-002' }, defaults: {
            code: 'TRX-OUT-002', tipe: 'Keluar', sub_tipe: 'Transfer Gudang', tanggal: today,
            gudang_id: gudUtama.id, gudang_tujuan_id: gudIT.id,
            catatan: 'Transfer desktop ke Bandung', created_by: createdBy,
        } as any });

        await InvTransaksiDetail.findOrCreate({ where: { transaksi_id: trxOut2.id, produk_id: prdDesktop.id }, defaults: { transaksi_id: trxOut2.id, produk_id: prdDesktop.id, uom_id: uomUnit.id, jumlah: 1 } as any });

        // --- Transaksi Adjustment: Opname Pulpen ---
        const [trxAdj1] = await InvTransaksi.findOrCreate({ where: { code: 'TRX-ADJ-001' }, defaults: {
            code: 'TRX-ADJ-001', tipe: 'Adjustment', sub_tipe: 'Opname', tanggal: today,
            gudang_id: gudUtama.id,
            catatan: 'Hasil stock opname: selisih -5 pulpen', created_by: createdBy,
        } as any });

        await InvTransaksiDetail.findOrCreate({ where: { transaksi_id: trxAdj1.id, produk_id: prdPulpen.id }, defaults: { transaksi_id: trxAdj1.id, produk_id: prdPulpen.id, uom_id: uomPcs.id, jumlah: -5 } as any });

        console.log('  Transaksi Keluar: 2, Adjustment: 1');

        // --- Serial Numbers ---
        const snHelper = async (prefix: string, produkId: number, gudangId: number | null, count: number, trxMasukId: number, overrides?: Partial<{ karyawan_id: number | null; status: string; transaksi_terakhir_id: number }>[]) => {
            for (let i = 1; i <= count; i++) {
                const sn = `${prefix}-${String(i).padStart(3, '0')}`;
                const ov = overrides?.[i - 1] || {};
                await InvSerialNumber.findOrCreate({ where: { produk_id: produkId, serial_number: sn }, defaults: {
                    produk_id: produkId, serial_number: sn,
                    gudang_id: ov.karyawan_id ? null : gudangId,
                    karyawan_id: ov.karyawan_id || null,
                    status: ov.status || 'Tersedia',
                    transaksi_masuk_id: trxMasukId,
                    transaksi_terakhir_id: ov.transaksi_terakhir_id || trxMasukId,
                } as any });
            }
        };

        await snHelper('SN-LNV', prdLaptop.id, gudUtama.id, 5, trxIn1.id, [
            { karyawan_id: emp3.id, status: 'Digunakan', transaksi_terakhir_id: trxOut1.id },
            { karyawan_id: emp4.id, status: 'Digunakan', transaksi_terakhir_id: trxOut1.id },
            {}, {}, {},
        ]);
        await snHelper('SN-DEL', prdDesktop.id, gudUtama.id, 3, trxIn1.id, [
            { karyawan_id: null, status: 'Tersedia' },
            { karyawan_id: null, status: 'Tersedia' },
            { karyawan_id: null, status: 'Tersedia' },
        ]);
        // Fix: SN-DEL-003 transferred to Gudang IT
        await InvSerialNumber.update(
            { gudang_id: gudIT.id, transaksi_terakhir_id: trxOut2.id } as any,
            { where: { serial_number: 'SN-DEL-003', produk_id: prdDesktop.id } }
        );

        await snHelper('SN-HPL', prdHPPrinter.id, gudIT.id, 4, trxIn3.id);
        await snHelper('SN-MJK', prdMeja.id, gudIT.id, 10, trxIn3.id);
        await snHelper('SN-KRS', prdKursi.id, gudIT.id, 15, trxIn3.id);

        console.log('  Serial Numbers: 37');

        // --- Stock Balances (final computed values) ---
        const stokData = [
            { produk_id: prdLaptop.id, gudang_id: gudUtama.id, uom_id: uomUnit.id, jumlah: 3 },
            { produk_id: prdDesktop.id, gudang_id: gudUtama.id, uom_id: uomUnit.id, jumlah: 2 },
            { produk_id: prdDesktop.id, gudang_id: gudIT.id, uom_id: uomUnit.id, jumlah: 1 },
            { produk_id: prdHPPrinter.id, gudang_id: gudIT.id, uom_id: uomUnit.id, jumlah: 4 },
            { produk_id: prdKertas.id, gudang_id: gudUtama.id, uom_id: uomRim.id, jumlah: 50 },
            { produk_id: prdPulpen.id, gudang_id: gudUtama.id, uom_id: uomPcs.id, jumlah: 95 },
            { produk_id: prdAmplop.id, gudang_id: gudUtama.id, uom_id: uomBox.id, jumlah: 20 },
            { produk_id: prdMeja.id, gudang_id: gudIT.id, uom_id: uomSet.id, jumlah: 10 },
            { produk_id: prdKursi.id, gudang_id: gudIT.id, uom_id: uomSet.id, jumlah: 15 },
        ];

        for (const s of stokData) {
            const [stok, created] = await InvStok.findOrCreate({
                where: { produk_id: s.produk_id, gudang_id: s.gudang_id },
                defaults: s as any,
            });
            if (!created) {
                await stok.update({ jumlah: s.jumlah });
            }
        }
        console.log('  Stock Balances: 9 records');

        // ═══════════════════════════════════════════
        console.log('\n=== Seed completed successfully! ===');
        console.log('Login: NIK 1234567890123456 / password123');
        process.exit(0);
    } catch (error) {
        console.error('\nSeed failed:', error);
        process.exit(1);
    }
}

seedAll();
