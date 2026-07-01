import sequelize from '../config/database';
import { RESOURCES, ACTIONS } from '../shared/constants/permissions';
import {
    Divisi, Department, PosisiJabatan, KategoriPangkat, Golongan, SubGolongan,
    JenisHubunganKerja, Tag, LokasiKerja, StatusKaryawan,
    Employee, EmployeePersonalInfo, EmployeeHRInfo, EmployeeFamilyInfo,
} from '../modules/hr/models';
import { Role } from '../modules/auth/models/Role';
import { Permission } from '../modules/auth/models/Permission';
import User from '../modules/auth/models/User';
import {
    InvKategori, InvSubKategori, InvBrand, InvUom, InvProduk,
    InvGudang, InvStok, InvTransaksi, InvTransaksiDetail, InvSerialNumber,
} from '../modules/inventory/models';
import {
    FacilityBuilding, FacilityRoomType, FacilityRoom,
    FacilityMaintenanceCategory, FacilityOccupant, FacilityAsset, FacilityWorkOrder,
} from '../modules/facility/models';

async function seedComplete() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.\n');

        // ═══════════════════════════════════════════════════════════════
        // CLEANUP
        // ═══════════════════════════════════════════════════════════════
        console.log('=== CLEANUP ===');
        await sequelize.query('SET session_replication_role = replica;');

        const tablesToClean = [
            'facility_work_orders', 'facility_assets', 'facility_occupants',
            'facility_maintenance_categories', 'facility_rooms', 'facility_room_types', 'facility_buildings',
            'inv_serial_number', 'inv_transaksi_detail', 'inv_transaksi',
            'inv_stok', 'inv_produk', 'inv_gudang', 'inv_brand',
            'inv_sub_kategori', 'inv_kategori', 'inv_uom',
            'audit_logs', 'notifications',
            'employee_documents', 'employee_family_info', 'employee_hr_info',
            'employee_personal_info', 'leaves', 'attendances', 'employees',
            'posisi_jabatan', 'department', 'divisi',
            'kategori_pangkat', 'golongan', 'sub_golongan',
            'jenis_hubungan_kerja', 'tag', 'lokasi_kerja', 'status_karyawan',
            'role_permissions', 'permissions', 'users', 'roles',
        ];

        for (const table of tablesToClean) {
            try {
                await sequelize.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
            } catch { /* table mungkin belum ada */ }
        }

        await sequelize.query('SET session_replication_role = DEFAULT;');
        console.log('  Semua tabel dibersihkan.\n');

        // ═══════════════════════════════════════════════════════════════
        // LAYER 1: RBAC — Permissions, Roles, Role-Permissions
        // ═══════════════════════════════════════════════════════════════
        console.log('=== LAYER 1: RBAC ===');

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
            { resource: RESOURCES.FACILITY_MASTER_DATA, action: ACTIONS.CREATE },
            { resource: RESOURCES.FACILITY_MASTER_DATA, action: ACTIONS.READ },
            { resource: RESOURCES.FACILITY_MASTER_DATA, action: ACTIONS.UPDATE },
            { resource: RESOURCES.FACILITY_MASTER_DATA, action: ACTIONS.DELETE },
            { resource: RESOURCES.FACILITY_WORK_ORDER, action: ACTIONS.CREATE },
            { resource: RESOURCES.FACILITY_WORK_ORDER, action: ACTIONS.READ },
            { resource: RESOURCES.FACILITY_WORK_ORDER, action: ACTIONS.UPDATE },
            { resource: RESOURCES.FACILITY_WORK_ORDER, action: ACTIONS.DELETE },
        ];

        for (const p of permissionsData) {
            await Permission.findOrCreate({ where: { resource: p.resource, action: p.action }, defaults: p });
        }
        const allPermissions = await Permission.findAll();
        console.log(`  ${allPermissions.length} permissions created`);

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

        const fp = (res: string, acts?: string[]) =>
            allPermissions.filter(p => p.resource === res && (!acts || acts.includes(p.action)));

        const superadminRole = await Role.findOne({ where: { name: 'superadmin' } });
        if (superadminRole) await superadminRole.setPermissions(allPermissions);

        const adminRole = await Role.findOne({ where: { name: 'admin' } });
        if (adminRole) {
            await adminRole.setPermissions([
                ...fp(RESOURCES.EMPLOYEES), ...fp(RESOURCES.MASTER_DATA),
                ...fp(RESOURCES.DOCUMENTS), ...fp(RESOURCES.AUDIT_LOGS),
                ...fp(RESOURCES.DASHBOARD), ...fp(RESOURCES.IMPORT), ...fp(RESOURCES.EXPORT),
                ...fp(RESOURCES.USERS, [ACTIONS.READ, ACTIONS.UPDATE]),
                ...fp(RESOURCES.ROLES, [ACTIONS.READ]),
                ...fp(RESOURCES.INVENTORY_MASTER_DATA), ...fp(RESOURCES.INVENTORY_STOCK),
                ...fp(RESOURCES.FACILITY_MASTER_DATA), ...fp(RESOURCES.FACILITY_WORK_ORDER),
            ]);
        }

        const staffRole = await Role.findOne({ where: { name: 'staff' } });
        if (staffRole) {
            await staffRole.setPermissions([
                ...fp(RESOURCES.EMPLOYEES, [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.VIEW_ALL]),
                ...fp(RESOURCES.MASTER_DATA, [ACTIONS.READ]),
                ...fp(RESOURCES.DOCUMENTS, [ACTIONS.CREATE, ACTIONS.READ]),
                ...fp(RESOURCES.AUDIT_LOGS, [ACTIONS.READ]),
                ...fp(RESOURCES.DASHBOARD, [ACTIONS.READ, ACTIONS.VIEW_ALL]),
                ...fp(RESOURCES.EXPORT, [ACTIONS.EXPORT]),
                ...fp(RESOURCES.FACILITY_MASTER_DATA, [ACTIONS.READ]),
                ...fp(RESOURCES.FACILITY_WORK_ORDER, [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE]),
            ]);
        }

        const managerRole = await Role.findOne({ where: { name: 'manager' } });
        if (managerRole) {
            await managerRole.setPermissions([
                ...fp(RESOURCES.EMPLOYEES, [ACTIONS.READ, ACTIONS.VIEW_DEPARTMENT]),
                ...fp(RESOURCES.MASTER_DATA, [ACTIONS.READ]),
                ...fp(RESOURCES.DASHBOARD, [ACTIONS.READ, ACTIONS.VIEW_DEPARTMENT]),
                ...fp(RESOURCES.DOCUMENTS, [ACTIONS.READ]),
                ...fp(RESOURCES.FACILITY_MASTER_DATA, [ACTIONS.READ]),
                ...fp(RESOURCES.FACILITY_WORK_ORDER, [ACTIONS.READ]),
            ]);
        }

        const employeeRole = await Role.findOne({ where: { name: 'employee' } });
        if (employeeRole) {
            await employeeRole.setPermissions([
                ...fp(RESOURCES.EMPLOYEES, [ACTIONS.READ]),
                ...fp(RESOURCES.MASTER_DATA, [ACTIONS.READ]),
                ...fp(RESOURCES.DOCUMENTS, [ACTIONS.READ]),
            ]);
        }
        console.log('  5 roles created & permissions assigned\n');

        // ═══════════════════════════════════════════════════════════════
        // LAYER 2: HR MASTER DATA
        // ═══════════════════════════════════════════════════════════════
        console.log('=== LAYER 2: HR MASTER DATA ===');

        // --- Divisi (6) ---
        const divisiData = [
            { code: 'DIV-001', nama: 'SDM & Umum', keterangan: 'Divisi Sumber Daya Manusia dan Umum' },
            { code: 'DIV-002', nama: 'Information Technology', keterangan: 'Divisi Teknologi Informasi' },
            { code: 'DIV-003', nama: 'Operasional', keterangan: 'Divisi Operasional Lapangan' },
            { code: 'DIV-004', nama: 'Keuangan & Akuntansi', keterangan: 'Divisi Keuangan dan Akuntansi' },
            { code: 'DIV-005', nama: 'Marketing & Sales', keterangan: 'Divisi Pemasaran dan Penjualan' },
            { code: 'DIV-006', nama: 'Legal & Compliance', keterangan: 'Divisi Hukum dan Kepatuhan' },
        ];
        const divisiMap: Record<string, any> = {};
        for (const d of divisiData) {
            const [row] = await Divisi.findOrCreate({ where: { code: d.code }, defaults: d as any });
            divisiMap[d.code] = row;
        }
        console.log(`  ${divisiData.length} divisi`);

        // --- Department (12) ---
        const departmentData = [
            { code: 'DEP-001', nama: 'Recruitment', divisi_code: 'DIV-001', keterangan: 'Departemen Rekrutmen' },
            { code: 'DEP-002', nama: 'Training & Development', divisi_code: 'DIV-001', keterangan: 'Pelatihan dan Pengembangan SDM' },
            { code: 'DEP-003', nama: 'General Affairs', divisi_code: 'DIV-001', keterangan: 'Urusan Umum dan Administrasi' },
            { code: 'DEP-004', nama: 'IT Infrastructure', divisi_code: 'DIV-002', keterangan: 'Infrastruktur dan Jaringan IT' },
            { code: 'DEP-005', nama: 'Software Development', divisi_code: 'DIV-002', keterangan: 'Pengembangan Perangkat Lunak' },
            { code: 'DEP-006', nama: 'IT Support', divisi_code: 'DIV-002', keterangan: 'Dukungan Teknis IT' },
            { code: 'DEP-007', nama: 'Produksi', divisi_code: 'DIV-003', keterangan: 'Departemen Produksi' },
            { code: 'DEP-008', nama: 'Quality Control', divisi_code: 'DIV-003', keterangan: 'Pengendalian Mutu' },
            { code: 'DEP-009', nama: 'Finance', divisi_code: 'DIV-004', keterangan: 'Departemen Keuangan' },
            { code: 'DEP-010', nama: 'Accounting', divisi_code: 'DIV-004', keterangan: 'Departemen Akuntansi' },
            { code: 'DEP-011', nama: 'Sales', divisi_code: 'DIV-005', keterangan: 'Departemen Penjualan' },
            { code: 'DEP-012', nama: 'Legal', divisi_code: 'DIV-006', keterangan: 'Departemen Hukum' },
        ];
        const deptMap: Record<string, any> = {};
        for (const d of departmentData) {
            const [row] = await Department.findOrCreate({
                where: { code: d.code },
                defaults: { code: d.code, nama: d.nama, keterangan: d.keterangan, divisi_id: divisiMap[d.divisi_code].id } as any,
            });
            deptMap[d.code] = row;
        }
        console.log(`  ${departmentData.length} department`);

        // --- Status Karyawan (5) ---
        const statusKaryawanData = [
            { code: 'SK-001', nama: 'Aktif', keterangan: 'Karyawan aktif bekerja' },
            { code: 'SK-002', nama: 'Resign', keterangan: 'Karyawan mengundurkan diri' },
            { code: 'SK-003', nama: 'Cuti Panjang', keterangan: 'Karyawan sedang cuti panjang' },
            { code: 'SK-004', nama: 'PHK', keterangan: 'Pemutusan Hubungan Kerja' },
            { code: 'SK-005', nama: 'Pensiun', keterangan: 'Karyawan pensiun' },
        ];
        const statusMap: Record<string, any> = {};
        for (const d of statusKaryawanData) {
            const [row] = await StatusKaryawan.findOrCreate({ where: { code: d.code }, defaults: d as any });
            statusMap[d.code] = row;
        }
        console.log(`  ${statusKaryawanData.length} status karyawan`);

        // --- Lokasi Kerja (5) ---
        const lokasiKerjaData = [
            { code: 'LOK-001', nama: 'Kantor Pusat Jakarta', kode_site: 'JKT-HQ', alamat: 'Jl. Jend. Sudirman No. 1, Jakarta Selatan 12190', keterangan: 'Head Office' },
            { code: 'LOK-002', nama: 'Site Bekasi', kode_site: 'BKS-01', alamat: 'Jl. Industri Raya No. 5, Bekasi 17530', keterangan: 'Pabrik Bekasi' },
            { code: 'LOK-003', nama: 'Site Bandung', kode_site: 'BDG-01', alamat: 'Jl. Soekarno-Hatta No. 88, Bandung 40286', keterangan: 'Cabang Bandung' },
            { code: 'LOK-004', nama: 'Site Surabaya', kode_site: 'SBY-01', alamat: 'Jl. Raya Darmo No. 25, Surabaya 60241', keterangan: 'Cabang Surabaya' },
            { code: 'LOK-005', nama: 'Site Semarang', kode_site: 'SMG-01', alamat: 'Jl. Pandanaran No. 10, Semarang 50134', keterangan: 'Cabang Semarang' },
        ];
        const lokasiMap: Record<string, any> = {};
        for (const d of lokasiKerjaData) {
            const [row] = await LokasiKerja.findOrCreate({ where: { code: d.code }, defaults: d as any });
            lokasiMap[d.code] = row;
        }
        console.log(`  ${lokasiKerjaData.length} lokasi kerja`);

        // --- Posisi Jabatan (18) ---
        const posisiData = [
            { code: 'POS-001', nama: 'Direktur Utama', dept_code: 'DEP-001' },
            { code: 'POS-002', nama: 'HR Manager', dept_code: 'DEP-001' },
            { code: 'POS-003', nama: 'Recruiter', dept_code: 'DEP-001' },
            { code: 'POS-004', nama: 'Training Officer', dept_code: 'DEP-002' },
            { code: 'POS-005', nama: 'Admin GA', dept_code: 'DEP-003' },
            { code: 'POS-006', nama: 'IT Manager', dept_code: 'DEP-004' },
            { code: 'POS-007', nama: 'Network Engineer', dept_code: 'DEP-004' },
            { code: 'POS-008', nama: 'System Administrator', dept_code: 'DEP-004' },
            { code: 'POS-009', nama: 'Software Engineer', dept_code: 'DEP-005' },
            { code: 'POS-010', nama: 'QA Engineer', dept_code: 'DEP-005' },
            { code: 'POS-011', nama: 'IT Helpdesk', dept_code: 'DEP-006' },
            { code: 'POS-012', nama: 'Production Manager', dept_code: 'DEP-007' },
            { code: 'POS-013', nama: 'Operator Produksi', dept_code: 'DEP-007' },
            { code: 'POS-014', nama: 'QC Inspector', dept_code: 'DEP-008' },
            { code: 'POS-015', nama: 'Finance Manager', dept_code: 'DEP-009' },
            { code: 'POS-016', nama: 'Accountant', dept_code: 'DEP-010' },
            { code: 'POS-017', nama: 'Sales Executive', dept_code: 'DEP-011' },
            { code: 'POS-018', nama: 'Legal Officer', dept_code: 'DEP-012' },
        ];
        const posisiMap: Record<string, any> = {};
        for (const d of posisiData) {
            const [row] = await PosisiJabatan.findOrCreate({
                where: { code: d.code },
                defaults: { code: d.code, nama: d.nama, department_id: deptMap[d.dept_code].id } as any,
            });
            posisiMap[d.code] = row;
        }
        console.log(`  ${posisiData.length} posisi jabatan`);

        // --- Kategori Pangkat (4) ---
        const katPangkatData = [
            { code: 'KP-001', nama: 'Eksekutif', keterangan: 'Level Direksi' },
            { code: 'KP-002', nama: 'Managerial', keterangan: 'Level Manager dan Supervisor' },
            { code: 'KP-003', nama: 'Staff', keterangan: 'Level Staff' },
            { code: 'KP-004', nama: 'Non-Staff', keterangan: 'Level Non-Staff / Operator' },
        ];
        const katPangkatMap: Record<string, any> = {};
        for (const d of katPangkatData) {
            const [row] = await KategoriPangkat.findOrCreate({ where: { code: d.code }, defaults: d as any });
            katPangkatMap[d.code] = row;
        }
        console.log(`  ${katPangkatData.length} kategori pangkat`);

        // --- Golongan (5) ---
        const golonganData = [
            { code: 'GOL-I', nama: 'Golongan I', keterangan: 'Golongan pertama' },
            { code: 'GOL-II', nama: 'Golongan II', keterangan: 'Golongan kedua' },
            { code: 'GOL-III', nama: 'Golongan III', keterangan: 'Golongan ketiga' },
            { code: 'GOL-IV', nama: 'Golongan IV', keterangan: 'Golongan keempat' },
            { code: 'GOL-V', nama: 'Golongan V', keterangan: 'Golongan kelima (direksi)' },
        ];
        const golMap: Record<string, any> = {};
        for (const d of golonganData) {
            const [row] = await Golongan.findOrCreate({ where: { code: d.code }, defaults: d as any });
            golMap[d.code] = row;
        }
        console.log(`  ${golonganData.length} golongan`);

        // --- Sub Golongan (10) ---
        const subGolData = [
            { code: 'SG-IA', nama: 'IA' }, { code: 'SG-IB', nama: 'IB' },
            { code: 'SG-IIA', nama: 'IIA' }, { code: 'SG-IIB', nama: 'IIB' },
            { code: 'SG-IIIA', nama: 'IIIA' }, { code: 'SG-IIIB', nama: 'IIIB' },
            { code: 'SG-IVA', nama: 'IVA' }, { code: 'SG-IVB', nama: 'IVB' },
            { code: 'SG-VA', nama: 'VA' }, { code: 'SG-VB', nama: 'VB' },
        ];
        const subGolMap: Record<string, any> = {};
        for (const d of subGolData) {
            const [row] = await SubGolongan.findOrCreate({ where: { code: d.code }, defaults: d as any });
            subGolMap[d.code] = row;
        }
        console.log(`  ${subGolData.length} sub golongan`);

        // --- Jenis Hubungan Kerja (4) ---
        const jhkData = [
            { code: 'JHK-001', nama: 'PKWTT', keterangan: 'Perjanjian Kerja Waktu Tidak Tertentu (Tetap)' },
            { code: 'JHK-002', nama: 'PKWT', keterangan: 'Perjanjian Kerja Waktu Tertentu (Kontrak)' },
            { code: 'JHK-003', nama: 'Harian', keterangan: 'Pekerja Harian Lepas' },
            { code: 'JHK-004', nama: 'Magang', keterangan: 'Program Magang / Internship' },
        ];
        const jhkMap: Record<string, any> = {};
        for (const d of jhkData) {
            const [row] = await JenisHubunganKerja.findOrCreate({ where: { code: d.code }, defaults: d as any });
            jhkMap[d.code] = row;
        }
        console.log(`  ${jhkData.length} jenis hubungan kerja`);

        // --- Tag (6) ---
        const tagData = [
            { code: 'TAG-001', nama: 'Urgent', warna_tag: '#EF4444', keterangan: 'Perlu perhatian segera' },
            { code: 'TAG-002', nama: 'New Hire', warna_tag: '#10B981', keterangan: 'Karyawan baru' },
            { code: 'TAG-003', nama: 'Remote', warna_tag: '#3B82F6', keterangan: 'Bekerja remote / WFH' },
            { code: 'TAG-004', nama: 'Probation', warna_tag: '#F59E0B', keterangan: 'Masa percobaan' },
            { code: 'TAG-005', nama: 'High Performer', warna_tag: '#8B5CF6', keterangan: 'Karyawan berprestasi' },
            { code: 'TAG-006', nama: 'Training', warna_tag: '#EC4899', keterangan: 'Sedang dalam pelatihan' },
        ];
        const tagMap: Record<string, any> = {};
        for (const d of tagData) {
            const [row] = await Tag.findOrCreate({ where: { code: d.code }, defaults: d as any });
            tagMap[d.code] = row;
        }
        console.log(`  ${tagData.length} tag\n`);

        // ═══════════════════════════════════════════════════════════════
        // LAYER 3: EMPLOYEES (20 karyawan lengkap)
        // ═══════════════════════════════════════════════════════════════
        console.log('=== LAYER 3: EMPLOYEES ===');

        const employeesData = [
            // --- Direksi & Manager ---
            {
                emp: { nomor_induk_karyawan: 'EMP-001', nama_lengkap: 'Ahmad Surya Wijaya', email_perusahaan: 'ahmad.surya@company.com', nomor_handphone: '081200000001', divisi_code: 'DIV-001', dept_code: 'DEP-001', posisi_code: 'POS-001', status_code: 'SK-001', lokasi_code: 'LOK-001', tag_code: 'TAG-005' },
                personal: { jenis_kelamin: 'Laki-laki', tempat_lahir: 'Jakarta', tanggal_lahir: '1970-03-15', email_pribadi: 'ahmad.surya@gmail.com', agama: 'Islam', golongan_darah: 'O', nomor_ktp: '3174011503700001', nomor_npwp: '01.234.567.8-001.000', nomor_bpjs: '0001234567890', alamat_domisili: 'Jl. Menteng Raya No. 10', kota_domisili: 'Jakarta Pusat', provinsi_domisili: 'DKI Jakarta', alamat_ktp: 'Jl. Menteng Raya No. 10', kota_ktp: 'Jakarta Pusat', provinsi_ktp: 'DKI Jakarta', status_pernikahan: 'Menikah', nama_pasangan: 'Ratna Dewi', tanggal_menikah: '1998-06-20', jumlah_anak: 3, nomor_rekening: '1234567890', nama_pemegang_rekening: 'Ahmad Surya Wijaya', nama_bank: 'Bank Mandiri', cabang_bank: 'KCP Menteng', nomor_wa: '081200000001', kode_pos: '10310' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk_group: '1995-01-10', tanggal_masuk: '1995-01-10', tanggal_permanent: '1996-01-10', tingkat_pendidikan: 'S2', bidang_studi: 'Manajemen Bisnis', nama_sekolah: 'Universitas Indonesia', kota_sekolah: 'Depok', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-001', gol_code: 'GOL-V', sub_gol_code: 'SG-VA', nama_kontak_darurat_1: 'Ratna Dewi', nomor_telepon_kontak_darurat_1: '081200000099', hubungan_kontak_darurat_1: 'Istri', alamat_kontak_darurat_1: 'Jl. Menteng Raya No. 10, Jakarta Pusat', ukuran_seragam_kerja: 'XL', ukuran_sepatu_kerja: '42', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Hasan Wijaya', nama_ibu_kandung: 'Siti Maryam', alamat_orang_tua: 'Jl. Cempaka No. 5, Jakarta', anak_ke: 1, jumlah_saudara_kandung: 2, data_anak: [{ nama: 'Dimas Surya', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2000-04-10' }, { nama: 'Anisa Surya', jenis_kelamin: 'Perempuan', tanggal_lahir: '2003-08-22' }, { nama: 'Rizky Surya', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2008-12-01' }] },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-002', nama_lengkap: 'Siti Nurhaliza Rahman', email_perusahaan: 'siti.nurhaliza@company.com', nomor_handphone: '081200000002', divisi_code: 'DIV-001', dept_code: 'DEP-001', posisi_code: 'POS-002', status_code: 'SK-001', lokasi_code: 'LOK-001', tag_code: 'TAG-005' },
                personal: { jenis_kelamin: 'Perempuan', tempat_lahir: 'Bandung', tanggal_lahir: '1982-07-25', email_pribadi: 'siti.nr@gmail.com', agama: 'Islam', golongan_darah: 'A', nomor_ktp: '3273016507820001', nomor_npwp: '02.345.678.9-002.000', nomor_bpjs: '0001234567891', alamat_domisili: 'Jl. Kemang Raya No. 22', kota_domisili: 'Jakarta Selatan', provinsi_domisili: 'DKI Jakarta', alamat_ktp: 'Jl. Braga No. 15, Bandung', kota_ktp: 'Bandung', provinsi_ktp: 'Jawa Barat', status_pernikahan: 'Menikah', nama_pasangan: 'Budi Rahman', tanggal_menikah: '2008-04-15', jumlah_anak: 2, nomor_rekening: '2345678901', nama_pemegang_rekening: 'Siti Nurhaliza Rahman', nama_bank: 'Bank BCA', cabang_bank: 'KCP Kemang', nomor_wa: '081200000002', kode_pos: '12730' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk_group: '2005-03-01', tanggal_masuk: '2005-03-01', tanggal_permanent: '2006-03-01', tingkat_pendidikan: 'S1', bidang_studi: 'Psikologi', nama_sekolah: 'Universitas Padjadjaran', kota_sekolah: 'Bandung', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-002', gol_code: 'GOL-IV', sub_gol_code: 'SG-IVA', nama_kontak_darurat_1: 'Budi Rahman', nomor_telepon_kontak_darurat_1: '081200000098', hubungan_kontak_darurat_1: 'Suami', alamat_kontak_darurat_1: 'Jl. Kemang Raya No. 22', ukuran_seragam_kerja: 'M', ukuran_sepatu_kerja: '37', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'H. Abdul Rahman', nama_ibu_kandung: 'Hj. Nurjannah', alamat_orang_tua: 'Jl. Braga No. 15, Bandung', anak_ke: 2, jumlah_saudara_kandung: 3, data_anak: [{ nama: 'Faisal Rahman', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2010-01-05' }, { nama: 'Nabila Rahman', jenis_kelamin: 'Perempuan', tanggal_lahir: '2013-09-18' }] },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-003', nama_lengkap: 'Bambang Prasetyo', email_perusahaan: 'bambang.prasetyo@company.com', nomor_handphone: '081200000003', divisi_code: 'DIV-002', dept_code: 'DEP-004', posisi_code: 'POS-006', status_code: 'SK-001', lokasi_code: 'LOK-001' },
                personal: { jenis_kelamin: 'Laki-laki', tempat_lahir: 'Surabaya', tanggal_lahir: '1978-11-08', email_pribadi: 'bambang.p@gmail.com', agama: 'Kristen', golongan_darah: 'B', nomor_ktp: '3578010811780001', nomor_npwp: '03.456.789.0-003.000', nomor_bpjs: '0001234567892', alamat_domisili: 'Jl. Pondok Indah No. 33', kota_domisili: 'Jakarta Selatan', provinsi_domisili: 'DKI Jakarta', alamat_ktp: 'Jl. Tunjungan No. 8, Surabaya', kota_ktp: 'Surabaya', provinsi_ktp: 'Jawa Timur', status_pernikahan: 'Menikah', nama_pasangan: 'Maria Christina', tanggal_menikah: '2005-12-25', jumlah_anak: 1, nomor_rekening: '3456789012', nama_pemegang_rekening: 'Bambang Prasetyo', nama_bank: 'Bank BNI', cabang_bank: 'KCP Pondok Indah', nomor_wa: '081200000003', kode_pos: '12310' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk_group: '2003-06-15', tanggal_masuk: '2003-06-15', tanggal_permanent: '2004-06-15', tingkat_pendidikan: 'S2', bidang_studi: 'Teknik Informatika', nama_sekolah: 'Institut Teknologi Bandung', kota_sekolah: 'Bandung', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-002', gol_code: 'GOL-IV', sub_gol_code: 'SG-IVB', nama_kontak_darurat_1: 'Maria Christina', nomor_telepon_kontak_darurat_1: '081200000097', hubungan_kontak_darurat_1: 'Istri', alamat_kontak_darurat_1: 'Jl. Pondok Indah No. 33', ukuran_seragam_kerja: 'L', ukuran_sepatu_kerja: '43', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Susilo Prasetyo', nama_ibu_kandung: 'Endang Lestari', alamat_orang_tua: 'Jl. Tunjungan No. 8, Surabaya', anak_ke: 1, jumlah_saudara_kandung: 1, data_anak: [{ nama: 'Kevin Prasetyo', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2008-05-20' }] },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-004', nama_lengkap: 'Dewi Kartika Sari', email_perusahaan: 'dewi.kartika@company.com', nomor_handphone: '081200000004', divisi_code: 'DIV-004', dept_code: 'DEP-009', posisi_code: 'POS-015', status_code: 'SK-001', lokasi_code: 'LOK-001' },
                personal: { jenis_kelamin: 'Perempuan', tempat_lahir: 'Semarang', tanggal_lahir: '1980-05-12', email_pribadi: 'dewi.ks@gmail.com', agama: 'Islam', golongan_darah: 'AB', nomor_ktp: '3374015205800001', nomor_npwp: '04.567.890.1-004.000', nomor_bpjs: '0001234567893', alamat_domisili: 'Jl. Gatot Subroto No. 44', kota_domisili: 'Jakarta Selatan', provinsi_domisili: 'DKI Jakarta', alamat_ktp: 'Jl. Pandanaran No. 3, Semarang', kota_ktp: 'Semarang', provinsi_ktp: 'Jawa Tengah', status_pernikahan: 'Menikah', nama_pasangan: 'Eko Prabowo', tanggal_menikah: '2006-10-10', jumlah_anak: 2, nomor_rekening: '4567890123', nama_pemegang_rekening: 'Dewi Kartika Sari', nama_bank: 'Bank Mandiri', cabang_bank: 'KCP Gatot Subroto', nomor_wa: '081200000004', kode_pos: '12930' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk_group: '2004-08-01', tanggal_masuk: '2004-08-01', tanggal_permanent: '2005-08-01', tingkat_pendidikan: 'S1', bidang_studi: 'Akuntansi', nama_sekolah: 'Universitas Diponegoro', kota_sekolah: 'Semarang', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-002', gol_code: 'GOL-IV', sub_gol_code: 'SG-IVA', nama_kontak_darurat_1: 'Eko Prabowo', nomor_telepon_kontak_darurat_1: '081200000096', hubungan_kontak_darurat_1: 'Suami', alamat_kontak_darurat_1: 'Jl. Gatot Subroto No. 44', ukuran_seragam_kerja: 'M', ukuran_sepatu_kerja: '38', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Hartono', nama_ibu_kandung: 'Sri Mulyani', alamat_orang_tua: 'Jl. Pandanaran No. 3, Semarang', anak_ke: 1, jumlah_saudara_kandung: 2, data_anak: [{ nama: 'Aditya Prabowo', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2008-02-14' }, { nama: 'Maya Prabowo', jenis_kelamin: 'Perempuan', tanggal_lahir: '2011-07-30' }] },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-005', nama_lengkap: 'Rizky Ramadhan Putra', email_perusahaan: 'rizky.ramadhan@company.com', nomor_handphone: '081200000005', divisi_code: 'DIV-003', dept_code: 'DEP-007', posisi_code: 'POS-012', status_code: 'SK-001', lokasi_code: 'LOK-002' },
                personal: { jenis_kelamin: 'Laki-laki', tempat_lahir: 'Bekasi', tanggal_lahir: '1985-12-20', email_pribadi: 'rizky.rp@gmail.com', agama: 'Islam', golongan_darah: 'A', nomor_ktp: '3216012012850001', nomor_npwp: '05.678.901.2-005.000', nomor_bpjs: '0001234567894', alamat_domisili: 'Jl. Ahmad Yani No. 55', kota_domisili: 'Bekasi', provinsi_domisili: 'Jawa Barat', alamat_ktp: 'Jl. Ahmad Yani No. 55, Bekasi', kota_ktp: 'Bekasi', provinsi_ktp: 'Jawa Barat', status_pernikahan: 'Menikah', nama_pasangan: 'Rina Wulandari', tanggal_menikah: '2012-08-17', jumlah_anak: 2, nomor_rekening: '5678901234', nama_pemegang_rekening: 'Rizky Ramadhan Putra', nama_bank: 'Bank BRI', cabang_bank: 'KCP Bekasi', nomor_wa: '081200000005', kode_pos: '17148' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk_group: '2008-02-01', tanggal_masuk: '2008-02-01', tanggal_permanent: '2009-02-01', tingkat_pendidikan: 'S1', bidang_studi: 'Teknik Mesin', nama_sekolah: 'Universitas Trisakti', kota_sekolah: 'Jakarta', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-002', gol_code: 'GOL-III', sub_gol_code: 'SG-IIIB', nama_kontak_darurat_1: 'Rina Wulandari', nomor_telepon_kontak_darurat_1: '081200000095', hubungan_kontak_darurat_1: 'Istri', alamat_kontak_darurat_1: 'Jl. Ahmad Yani No. 55, Bekasi', ukuran_seragam_kerja: 'L', ukuran_sepatu_kerja: '42', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Suherman', nama_ibu_kandung: 'Yanti', alamat_orang_tua: 'Jl. Raya Bekasi No. 12', anak_ke: 2, jumlah_saudara_kandung: 3, data_anak: [{ nama: 'Arif Ramadhan', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2014-05-10' }, { nama: 'Zahra Ramadhan', jenis_kelamin: 'Perempuan', tanggal_lahir: '2017-11-25' }] },
            },
            // --- Staff level ---
            {
                emp: { nomor_induk_karyawan: 'EMP-006', nama_lengkap: 'Andi Firmansyah', email_perusahaan: 'andi.firmansyah@company.com', nomor_handphone: '081200000006', divisi_code: 'DIV-001', dept_code: 'DEP-001', posisi_code: 'POS-003', status_code: 'SK-001', lokasi_code: 'LOK-001', tag_code: 'TAG-002', manager_nik: 'EMP-002' },
                personal: { jenis_kelamin: 'Laki-laki', tempat_lahir: 'Yogyakarta', tanggal_lahir: '1993-04-18', email_pribadi: 'andi.f@gmail.com', agama: 'Islam', golongan_darah: 'B', nomor_ktp: '3404011804930001', nomor_npwp: '06.789.012.3-006.000', nomor_bpjs: '0001234567895', alamat_domisili: 'Jl. TB Simatupang No. 66', kota_domisili: 'Jakarta Selatan', provinsi_domisili: 'DKI Jakarta', status_pernikahan: 'Belum Menikah', jumlah_anak: 0, nomor_rekening: '6789012345', nama_pemegang_rekening: 'Andi Firmansyah', nama_bank: 'Bank BCA', cabang_bank: 'KCP TB Simatupang', nomor_wa: '081200000006', kode_pos: '12530' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk: '2018-07-01', tanggal_permanent: '2019-07-01', tingkat_pendidikan: 'S1', bidang_studi: 'Psikologi', nama_sekolah: 'Universitas Gadjah Mada', kota_sekolah: 'Yogyakarta', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-003', gol_code: 'GOL-II', sub_gol_code: 'SG-IIB', ukuran_seragam_kerja: 'L', ukuran_sepatu_kerja: '42', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Darmawan', nama_ibu_kandung: 'Suryati', alamat_orang_tua: 'Jl. Malioboro No. 20, Yogyakarta', anak_ke: 1, jumlah_saudara_kandung: 1 },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-007', nama_lengkap: 'Putri Ayu Lestari', email_perusahaan: 'putri.ayu@company.com', nomor_handphone: '081200000007', divisi_code: 'DIV-001', dept_code: 'DEP-002', posisi_code: 'POS-004', status_code: 'SK-001', lokasi_code: 'LOK-001', manager_nik: 'EMP-002' },
                personal: { jenis_kelamin: 'Perempuan', tempat_lahir: 'Malang', tanggal_lahir: '1991-09-30', email_pribadi: 'putri.al@gmail.com', agama: 'Kristen', golongan_darah: 'O', nomor_ktp: '3573016909910001', nomor_npwp: '07.890.123.4-007.000', nomor_bpjs: '0001234567896', alamat_domisili: 'Jl. Casablanca No. 77', kota_domisili: 'Jakarta Selatan', provinsi_domisili: 'DKI Jakarta', status_pernikahan: 'Menikah', nama_pasangan: 'Hendra Gunawan', tanggal_menikah: '2018-05-05', jumlah_anak: 1, nomor_rekening: '7890123456', nama_pemegang_rekening: 'Putri Ayu Lestari', nama_bank: 'Bank CIMB Niaga', cabang_bank: 'KCP Casablanca', nomor_wa: '081200000007', kode_pos: '12870' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk: '2016-01-15', tanggal_permanent: '2017-01-15', tingkat_pendidikan: 'S1', bidang_studi: 'Pendidikan', nama_sekolah: 'Universitas Negeri Malang', kota_sekolah: 'Malang', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-003', gol_code: 'GOL-III', sub_gol_code: 'SG-IIIA', ukuran_seragam_kerja: 'S', ukuran_sepatu_kerja: '37', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Sugiarto', nama_ibu_kandung: 'Lilis', alamat_orang_tua: 'Jl. Ijen No. 8, Malang', anak_ke: 2, jumlah_saudara_kandung: 2, data_anak: [{ nama: 'Kenji Gunawan', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2020-02-14' }] },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-008', nama_lengkap: 'Reza Mahendra', email_perusahaan: 'reza.mahendra@company.com', nomor_handphone: '081200000008', divisi_code: 'DIV-002', dept_code: 'DEP-004', posisi_code: 'POS-007', status_code: 'SK-001', lokasi_code: 'LOK-001', manager_nik: 'EMP-003' },
                personal: { jenis_kelamin: 'Laki-laki', tempat_lahir: 'Bogor', tanggal_lahir: '1990-06-14', email_pribadi: 'reza.m@gmail.com', agama: 'Islam', golongan_darah: 'A', nomor_ktp: '3271011406900001', nomor_npwp: '08.901.234.5-008.000', nomor_bpjs: '0001234567897', alamat_domisili: 'Jl. Dago No. 88', kota_domisili: 'Jakarta Barat', provinsi_domisili: 'DKI Jakarta', status_pernikahan: 'Belum Menikah', jumlah_anak: 0, nomor_rekening: '8901234567', nama_pemegang_rekening: 'Reza Mahendra', nama_bank: 'Bank Mandiri', cabang_bank: 'KCP Dago', nomor_wa: '081200000008', kode_pos: '11520' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk: '2017-03-01', tanggal_permanent: '2018-03-01', tingkat_pendidikan: 'S1', bidang_studi: 'Teknik Komputer', nama_sekolah: 'Institut Pertanian Bogor', kota_sekolah: 'Bogor', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-003', gol_code: 'GOL-II', sub_gol_code: 'SG-IIB', ukuran_seragam_kerja: 'L', ukuran_sepatu_kerja: '43', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Fauzi Mahendra', nama_ibu_kandung: 'Aminah', alamat_orang_tua: 'Jl. Pajajaran No. 30, Bogor', anak_ke: 1, jumlah_saudara_kandung: 2 },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-009', nama_lengkap: 'Dian Permata Sari', email_perusahaan: 'dian.permata@company.com', nomor_handphone: '081200000009', divisi_code: 'DIV-002', dept_code: 'DEP-005', posisi_code: 'POS-009', status_code: 'SK-001', lokasi_code: 'LOK-001', tag_code: 'TAG-003', manager_nik: 'EMP-003' },
                personal: { jenis_kelamin: 'Perempuan', tempat_lahir: 'Depok', tanggal_lahir: '1994-01-22', email_pribadi: 'dian.ps@gmail.com', agama: 'Islam', golongan_darah: 'B', nomor_ktp: '3276016201940001', nomor_npwp: '09.012.345.6-009.000', nomor_bpjs: '0001234567898', alamat_domisili: 'Jl. Margonda Raya No. 99', kota_domisili: 'Depok', provinsi_domisili: 'Jawa Barat', status_pernikahan: 'Belum Menikah', jumlah_anak: 0, nomor_rekening: '9012345678', nama_pemegang_rekening: 'Dian Permata Sari', nama_bank: 'Bank BCA', cabang_bank: 'KCP Margonda', nomor_wa: '081200000009', kode_pos: '16431' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk: '2019-09-01', tanggal_permanent: '2020-09-01', tingkat_pendidikan: 'S1', bidang_studi: 'Ilmu Komputer', nama_sekolah: 'Universitas Indonesia', kota_sekolah: 'Depok', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-003', gol_code: 'GOL-II', sub_gol_code: 'SG-IIA', ukuran_seragam_kerja: 'S', ukuran_sepatu_kerja: '37', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Wahyudi', nama_ibu_kandung: 'Nurhasanah', alamat_orang_tua: 'Jl. Margonda Raya No. 50, Depok', anak_ke: 1, jumlah_saudara_kandung: 1 },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-010', nama_lengkap: 'Fajar Nugroho', email_perusahaan: 'fajar.nugroho@company.com', nomor_handphone: '081200000010', divisi_code: 'DIV-002', dept_code: 'DEP-005', posisi_code: 'POS-010', status_code: 'SK-001', lokasi_code: 'LOK-001', tag_code: 'TAG-003', manager_nik: 'EMP-003' },
                personal: { jenis_kelamin: 'Laki-laki', tempat_lahir: 'Tangerang', tanggal_lahir: '1995-08-05', email_pribadi: 'fajar.n@gmail.com', agama: 'Islam', golongan_darah: 'O', nomor_ktp: '3603010508950001', nomor_npwp: '10.123.456.7-010.000', nomor_bpjs: '0001234567899', alamat_domisili: 'Jl. BSD No. 12', kota_domisili: 'Tangerang Selatan', provinsi_domisili: 'Banten', status_pernikahan: 'Menikah', nama_pasangan: 'Fitri Handayani', tanggal_menikah: '2022-02-22', jumlah_anak: 0, nomor_rekening: '0123456789', nama_pemegang_rekening: 'Fajar Nugroho', nama_bank: 'Bank BCA', cabang_bank: 'KCP BSD', nomor_wa: '081200000010', kode_pos: '15322' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk: '2020-01-06', tanggal_permanent: '2021-01-06', tingkat_pendidikan: 'S1', bidang_studi: 'Sistem Informasi', nama_sekolah: 'Binus University', kota_sekolah: 'Jakarta', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-003', gol_code: 'GOL-II', sub_gol_code: 'SG-IIA', ukuran_seragam_kerja: 'M', ukuran_sepatu_kerja: '41', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Supriyanto', nama_ibu_kandung: 'Wati', alamat_orang_tua: 'Jl. Raya Serpong No. 5, Tangerang', anak_ke: 2, jumlah_saudara_kandung: 2 },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-011', nama_lengkap: 'Hendra Setiawan', email_perusahaan: 'hendra.setiawan@company.com', nomor_handphone: '081200000011', divisi_code: 'DIV-002', dept_code: 'DEP-006', posisi_code: 'POS-011', status_code: 'SK-001', lokasi_code: 'LOK-001', manager_nik: 'EMP-003' },
                personal: { jenis_kelamin: 'Laki-laki', tempat_lahir: 'Medan', tanggal_lahir: '1996-02-28', email_pribadi: 'hendra.s@gmail.com', agama: 'Kristen', golongan_darah: 'AB', nomor_ktp: '1271012802960001', nomor_npwp: '11.234.567.8-011.000', nomor_bpjs: '0001234567900', alamat_domisili: 'Jl. Kuningan No. 14', kota_domisili: 'Jakarta Selatan', provinsi_domisili: 'DKI Jakarta', status_pernikahan: 'Belum Menikah', jumlah_anak: 0, nomor_rekening: '1122334455', nama_pemegang_rekening: 'Hendra Setiawan', nama_bank: 'Bank Mandiri', cabang_bank: 'KCP Kuningan', nomor_wa: '081200000011', kode_pos: '12950' },
                hr: { jhk_code: 'JHK-002', tanggal_masuk: '2022-06-01', tanggal_kontrak: '2022-06-01', tanggal_akhir_kontrak: '2024-06-01', tingkat_pendidikan: 'D3', bidang_studi: 'Teknik Komputer', nama_sekolah: 'Politeknik Negeri Medan', kota_sekolah: 'Medan', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-003', gol_code: 'GOL-I', sub_gol_code: 'SG-IB', ukuran_seragam_kerja: 'M', ukuran_sepatu_kerja: '42', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Tulus Setiawan', nama_ibu_kandung: 'Rosita', alamat_orang_tua: 'Jl. Asia No. 5, Medan', anak_ke: 3, jumlah_saudara_kandung: 3 },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-012', nama_lengkap: 'Wahyu Hidayat', email_perusahaan: 'wahyu.hidayat@company.com', nomor_handphone: '081200000012', divisi_code: 'DIV-003', dept_code: 'DEP-007', posisi_code: 'POS-013', status_code: 'SK-001', lokasi_code: 'LOK-002', manager_nik: 'EMP-005' },
                personal: { jenis_kelamin: 'Laki-laki', tempat_lahir: 'Karawang', tanggal_lahir: '1988-10-10', email_pribadi: 'wahyu.h@gmail.com', agama: 'Islam', golongan_darah: 'A', nomor_ktp: '3215011010880001', nomor_npwp: '12.345.678.9-012.000', nomor_bpjs: '0001234567901', alamat_domisili: 'Jl. Industri No. 7', kota_domisili: 'Bekasi', provinsi_domisili: 'Jawa Barat', status_pernikahan: 'Menikah', nama_pasangan: 'Yuliana', tanggal_menikah: '2015-03-15', jumlah_anak: 3, nomor_rekening: '2233445566', nama_pemegang_rekening: 'Wahyu Hidayat', nama_bank: 'Bank BRI', cabang_bank: 'KCP Bekasi Timur', nomor_wa: '081200000012', kode_pos: '17530' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk: '2012-04-01', tanggal_permanent: '2013-04-01', tingkat_pendidikan: 'SMA', bidang_studi: 'IPA', nama_sekolah: 'SMA Negeri 1 Karawang', kota_sekolah: 'Karawang', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-004', gol_code: 'GOL-I', sub_gol_code: 'SG-IA', ukuran_seragam_kerja: 'L', ukuran_sepatu_kerja: '43', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Sugeng', nama_ibu_kandung: 'Patimah', alamat_orang_tua: 'Jl. Raya Karawang No. 15', anak_ke: 1, jumlah_saudara_kandung: 4, data_anak: [{ nama: 'Raffi Hidayat', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2016-01-20' }, { nama: 'Nisa Hidayat', jenis_kelamin: 'Perempuan', tanggal_lahir: '2018-06-15' }, { nama: 'Ilham Hidayat', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2021-09-03' }] },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-013', nama_lengkap: 'Mega Puspita', email_perusahaan: 'mega.puspita@company.com', nomor_handphone: '081200000013', divisi_code: 'DIV-003', dept_code: 'DEP-008', posisi_code: 'POS-014', status_code: 'SK-001', lokasi_code: 'LOK-002', manager_nik: 'EMP-005' },
                personal: { jenis_kelamin: 'Perempuan', tempat_lahir: 'Cirebon', tanggal_lahir: '1992-12-03', email_pribadi: 'mega.p@gmail.com', agama: 'Islam', golongan_darah: 'B', nomor_ktp: '3209016212920001', nomor_npwp: '13.456.789.0-013.000', nomor_bpjs: '0001234567902', alamat_domisili: 'Jl. Raya Cikarang No. 21', kota_domisili: 'Bekasi', provinsi_domisili: 'Jawa Barat', status_pernikahan: 'Menikah', nama_pasangan: 'Agus Santosa', tanggal_menikah: '2019-11-11', jumlah_anak: 1, nomor_rekening: '3344556677', nama_pemegang_rekening: 'Mega Puspita', nama_bank: 'Bank BNI', cabang_bank: 'KCP Cikarang', nomor_wa: '081200000013', kode_pos: '17550' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk: '2017-08-15', tanggal_permanent: '2018-08-15', tingkat_pendidikan: 'S1', bidang_studi: 'Teknik Kimia', nama_sekolah: 'Universitas Sultan Ageng Tirtayasa', kota_sekolah: 'Serang', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-003', gol_code: 'GOL-II', sub_gol_code: 'SG-IIA', ukuran_seragam_kerja: 'M', ukuran_sepatu_kerja: '38', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Supardi', nama_ibu_kandung: 'Kartini', alamat_orang_tua: 'Jl. Siliwangi No. 10, Cirebon', anak_ke: 2, jumlah_saudara_kandung: 2, data_anak: [{ nama: 'Daffa Santosa', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2021-04-08' }] },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-014', nama_lengkap: 'Taufik Ismail', email_perusahaan: 'taufik.ismail@company.com', nomor_handphone: '081200000014', divisi_code: 'DIV-004', dept_code: 'DEP-010', posisi_code: 'POS-016', status_code: 'SK-001', lokasi_code: 'LOK-001', manager_nik: 'EMP-004' },
                personal: { jenis_kelamin: 'Laki-laki', tempat_lahir: 'Palembang', tanggal_lahir: '1989-03-08', email_pribadi: 'taufik.i@gmail.com', agama: 'Islam', golongan_darah: 'O', nomor_ktp: '1671010803890001', nomor_npwp: '14.567.890.1-014.000', nomor_bpjs: '0001234567903', alamat_domisili: 'Jl. Tebet Raya No. 45', kota_domisili: 'Jakarta Selatan', provinsi_domisili: 'DKI Jakarta', status_pernikahan: 'Menikah', nama_pasangan: 'Lestari Dewi', tanggal_menikah: '2016-07-07', jumlah_anak: 2, nomor_rekening: '4455667788', nama_pemegang_rekening: 'Taufik Ismail', nama_bank: 'Bank Mandiri', cabang_bank: 'KCP Tebet', nomor_wa: '081200000014', kode_pos: '12810' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk: '2014-05-01', tanggal_permanent: '2015-05-01', tingkat_pendidikan: 'S1', bidang_studi: 'Akuntansi', nama_sekolah: 'Universitas Sriwijaya', kota_sekolah: 'Palembang', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-003', gol_code: 'GOL-III', sub_gol_code: 'SG-IIIA', ukuran_seragam_kerja: 'L', ukuran_sepatu_kerja: '42', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Ismail', nama_ibu_kandung: 'Fatimah', alamat_orang_tua: 'Jl. Merdeka No. 20, Palembang', anak_ke: 1, jumlah_saudara_kandung: 2, data_anak: [{ nama: 'Aisha Ismail', jenis_kelamin: 'Perempuan', tanggal_lahir: '2018-03-12' }, { nama: 'Rafi Ismail', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2021-08-25' }] },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-015', nama_lengkap: 'Novita Anggraini', email_perusahaan: 'novita.anggraini@company.com', nomor_handphone: '081200000015', divisi_code: 'DIV-005', dept_code: 'DEP-011', posisi_code: 'POS-017', status_code: 'SK-001', lokasi_code: 'LOK-001', tag_code: 'TAG-005' },
                personal: { jenis_kelamin: 'Perempuan', tempat_lahir: 'Surabaya', tanggal_lahir: '1991-06-17', email_pribadi: 'novita.a@gmail.com', agama: 'Katolik', golongan_darah: 'A', nomor_ktp: '3578016706910001', nomor_npwp: '15.678.901.2-015.000', nomor_bpjs: '0001234567904', alamat_domisili: 'Jl. Sudirman No. 120', kota_domisili: 'Jakarta Pusat', provinsi_domisili: 'DKI Jakarta', status_pernikahan: 'Belum Menikah', jumlah_anak: 0, nomor_rekening: '5566778899', nama_pemegang_rekening: 'Novita Anggraini', nama_bank: 'Bank BCA', cabang_bank: 'KCP Sudirman', nomor_wa: '081200000015', kode_pos: '10220' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk: '2015-02-01', tanggal_permanent: '2016-02-01', tingkat_pendidikan: 'S1', bidang_studi: 'Manajemen Pemasaran', nama_sekolah: 'Universitas Airlangga', kota_sekolah: 'Surabaya', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-003', gol_code: 'GOL-III', sub_gol_code: 'SG-IIIA', ukuran_seragam_kerja: 'S', ukuran_sepatu_kerja: '37', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Sutrisno', nama_ibu_kandung: 'Melinda', alamat_orang_tua: 'Jl. Raya Darmo No. 50, Surabaya', anak_ke: 1, jumlah_saudara_kandung: 1 },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-016', nama_lengkap: 'Irfan Hakim', email_perusahaan: 'irfan.hakim@company.com', nomor_handphone: '081200000016', divisi_code: 'DIV-006', dept_code: 'DEP-012', posisi_code: 'POS-018', status_code: 'SK-001', lokasi_code: 'LOK-001' },
                personal: { jenis_kelamin: 'Laki-laki', tempat_lahir: 'Jakarta', tanggal_lahir: '1987-11-11', email_pribadi: 'irfan.h@gmail.com', agama: 'Islam', golongan_darah: 'B', nomor_ktp: '3174011111870001', nomor_npwp: '16.789.012.3-016.000', nomor_bpjs: '0001234567905', alamat_domisili: 'Jl. Rasuna Said No. 8', kota_domisili: 'Jakarta Selatan', provinsi_domisili: 'DKI Jakarta', status_pernikahan: 'Menikah', nama_pasangan: 'Winda Sari', tanggal_menikah: '2014-09-09', jumlah_anak: 1, nomor_rekening: '6677889900', nama_pemegang_rekening: 'Irfan Hakim', nama_bank: 'Bank BNI', cabang_bank: 'KCP Kuningan', nomor_wa: '081200000016', kode_pos: '12940' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk: '2013-10-01', tanggal_permanent: '2014-10-01', tingkat_pendidikan: 'S1', bidang_studi: 'Hukum', nama_sekolah: 'Universitas Indonesia', kota_sekolah: 'Depok', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-003', gol_code: 'GOL-III', sub_gol_code: 'SG-IIIA', ukuran_seragam_kerja: 'L', ukuran_sepatu_kerja: '43', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Hakim', nama_ibu_kandung: 'Saleha', alamat_orang_tua: 'Jl. Menteng Atas No. 12, Jakarta', anak_ke: 2, jumlah_saudara_kandung: 3, data_anak: [{ nama: 'Zara Hakim', jenis_kelamin: 'Perempuan', tanggal_lahir: '2016-12-12' }] },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-017', nama_lengkap: 'Sari Indah Permatasari', email_perusahaan: 'sari.indah@company.com', nomor_handphone: '081200000017', divisi_code: 'DIV-001', dept_code: 'DEP-003', posisi_code: 'POS-005', status_code: 'SK-001', lokasi_code: 'LOK-001', manager_nik: 'EMP-002' },
                personal: { jenis_kelamin: 'Perempuan', tempat_lahir: 'Solo', tanggal_lahir: '1997-04-04', email_pribadi: 'sari.ip@gmail.com', agama: 'Islam', golongan_darah: 'O', nomor_ktp: '3372016404970001', nomor_npwp: '17.890.123.4-017.000', nomor_bpjs: '0001234567906', alamat_domisili: 'Jl. Pejaten Raya No. 5', kota_domisili: 'Jakarta Selatan', provinsi_domisili: 'DKI Jakarta', status_pernikahan: 'Belum Menikah', jumlah_anak: 0, nomor_rekening: '7788990011', nama_pemegang_rekening: 'Sari Indah Permatasari', nama_bank: 'Bank BCA', cabang_bank: 'KCP Pejaten', nomor_wa: '081200000017', kode_pos: '12530' },
                hr: { jhk_code: 'JHK-002', tanggal_masuk: '2023-01-09', tanggal_kontrak: '2023-01-09', tanggal_akhir_kontrak: '2025-01-09', tingkat_pendidikan: 'D3', bidang_studi: 'Administrasi Bisnis', nama_sekolah: 'Politeknik Negeri Solo', kota_sekolah: 'Solo', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-003', gol_code: 'GOL-I', sub_gol_code: 'SG-IA', ukuran_seragam_kerja: 'S', ukuran_sepatu_kerja: '37', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Joko', nama_ibu_kandung: 'Murti', alamat_orang_tua: 'Jl. Slamet Riyadi No. 30, Solo', anak_ke: 1, jumlah_saudara_kandung: 1 },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-018', nama_lengkap: 'Budi Hartono', email_perusahaan: 'budi.hartono@company.com', nomor_handphone: '081200000018', divisi_code: 'DIV-002', dept_code: 'DEP-004', posisi_code: 'POS-008', status_code: 'SK-001', lokasi_code: 'LOK-003', tag_code: 'TAG-004', manager_nik: 'EMP-003' },
                personal: { jenis_kelamin: 'Laki-laki', tempat_lahir: 'Bandung', tanggal_lahir: '1998-07-19', email_pribadi: 'budi.h@gmail.com', agama: 'Islam', golongan_darah: 'A', nomor_ktp: '3273011907980001', nomor_npwp: '18.901.234.5-018.000', nomor_bpjs: '0001234567907', alamat_domisili: 'Jl. Dipatiukur No. 35', kota_domisili: 'Bandung', provinsi_domisili: 'Jawa Barat', status_pernikahan: 'Belum Menikah', jumlah_anak: 0, nomor_rekening: '8899001122', nama_pemegang_rekening: 'Budi Hartono', nama_bank: 'Bank Mandiri', cabang_bank: 'KCP Dago Bandung', nomor_wa: '081200000018', kode_pos: '40132' },
                hr: { jhk_code: 'JHK-002', tanggal_masuk: '2024-03-01', tanggal_kontrak: '2024-03-01', tanggal_akhir_kontrak: '2026-03-01', tingkat_pendidikan: 'S1', bidang_studi: 'Teknik Informatika', nama_sekolah: 'Institut Teknologi Bandung', kota_sekolah: 'Bandung', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-003', gol_code: 'GOL-I', sub_gol_code: 'SG-IB', ukuran_seragam_kerja: 'M', ukuran_sepatu_kerja: '41', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Hartono', nama_ibu_kandung: 'Sumiati', alamat_orang_tua: 'Jl. Setiabudi No. 10, Bandung', anak_ke: 2, jumlah_saudara_kandung: 2 },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-019', nama_lengkap: 'Yulia Rahmawati', email_perusahaan: 'yulia.rahmawati@company.com', nomor_handphone: '081200000019', divisi_code: 'DIV-003', dept_code: 'DEP-007', posisi_code: 'POS-013', status_code: 'SK-001', lokasi_code: 'LOK-004', manager_nik: 'EMP-005' },
                personal: { jenis_kelamin: 'Perempuan', tempat_lahir: 'Surabaya', tanggal_lahir: '1993-02-14', email_pribadi: 'yulia.r@gmail.com', agama: 'Islam', golongan_darah: 'AB', nomor_ktp: '3578016202930001', nomor_npwp: '19.012.345.6-019.000', nomor_bpjs: '0001234567908', alamat_domisili: 'Jl. Raya Darmo No. 65', kota_domisili: 'Surabaya', provinsi_domisili: 'Jawa Timur', status_pernikahan: 'Cerai Hidup', tanggal_cerai: '2022-06-01', jumlah_anak: 1, nomor_rekening: '9900112233', nama_pemegang_rekening: 'Yulia Rahmawati', nama_bank: 'Bank BRI', cabang_bank: 'KCP Darmo', nomor_wa: '081200000019', kode_pos: '60241' },
                hr: { jhk_code: 'JHK-001', tanggal_masuk: '2016-11-01', tanggal_permanent: '2017-11-01', tingkat_pendidikan: 'SMA', bidang_studi: 'IPA', nama_sekolah: 'SMA Negeri 5 Surabaya', kota_sekolah: 'Surabaya', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-004', gol_code: 'GOL-I', sub_gol_code: 'SG-IA', ukuran_seragam_kerja: 'M', ukuran_sepatu_kerja: '38', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Slamet', nama_ibu_kandung: 'Rahmah', alamat_orang_tua: 'Jl. Kertajaya No. 25, Surabaya', anak_ke: 1, jumlah_saudara_kandung: 3, data_anak: [{ nama: 'Azzam', jenis_kelamin: 'Laki-laki', tanggal_lahir: '2019-08-17' }] },
            },
            {
                emp: { nomor_induk_karyawan: 'EMP-020', nama_lengkap: 'Galih Pratama', email_perusahaan: 'galih.pratama@company.com', nomor_handphone: '081200000020', divisi_code: 'DIV-002', dept_code: 'DEP-005', posisi_code: 'POS-009', status_code: 'SK-001', lokasi_code: 'LOK-001', tag_code: 'TAG-006', manager_nik: 'EMP-003' },
                personal: { jenis_kelamin: 'Laki-laki', tempat_lahir: 'Jakarta', tanggal_lahir: '1999-10-31', email_pribadi: 'galih.p@gmail.com', agama: 'Islam', golongan_darah: 'O', nomor_ktp: '3174013110990001', nomor_npwp: '20.123.456.7-020.000', nomor_bpjs: '0001234567909', alamat_domisili: 'Jl. Kelapa Gading No. 18', kota_domisili: 'Jakarta Utara', provinsi_domisili: 'DKI Jakarta', status_pernikahan: 'Belum Menikah', jumlah_anak: 0, nomor_rekening: '0011223344', nama_pemegang_rekening: 'Galih Pratama', nama_bank: 'Bank BCA', cabang_bank: 'KCP Kelapa Gading', nomor_wa: '081200000020', kode_pos: '14240' },
                hr: { jhk_code: 'JHK-004', tanggal_masuk: '2025-01-06', tanggal_kontrak: '2025-01-06', tanggal_akhir_kontrak: '2025-07-06', tingkat_pendidikan: 'S1', bidang_studi: 'Teknik Informatika', nama_sekolah: 'Universitas Bina Nusantara', kota_sekolah: 'Jakarta', status_kelulusan: 'Lulus', kat_pangkat_code: 'KP-004', gol_code: 'GOL-I', sub_gol_code: 'SG-IA', ukuran_seragam_kerja: 'M', ukuran_sepatu_kerja: '42', siklus_pembayaran_gaji: 'Bulanan' },
                family: { nama_ayah_kandung: 'Surya Pratama', nama_ibu_kandung: 'Dewi Anggraini', alamat_orang_tua: 'Jl. Kelapa Gading No. 18, Jakarta Utara', anak_ke: 1, jumlah_saudara_kandung: 0 },
            },
        ];

        const employeeMap: Record<string, any> = {};

        for (const data of employeesData) {
            const emp = await Employee.create({
                nomor_induk_karyawan: data.emp.nomor_induk_karyawan,
                nama_lengkap: data.emp.nama_lengkap,
                email_perusahaan: data.emp.email_perusahaan,
                nomor_handphone: data.emp.nomor_handphone,
                divisi_id: divisiMap[data.emp.divisi_code].id,
                department_id: deptMap[data.emp.dept_code].id,
                posisi_jabatan_id: posisiMap[data.emp.posisi_code].id,
                status_karyawan_id: statusMap[data.emp.status_code].id,
                lokasi_kerja_id: lokasiMap[data.emp.lokasi_code].id,
                tag_id: data.emp.tag_code ? tagMap[data.emp.tag_code]?.id : null,
            } as any);

            employeeMap[data.emp.nomor_induk_karyawan] = emp;

            await EmployeePersonalInfo.create({ employee_id: emp.id, ...data.personal } as any);

            const hrData: any = {
                employee_id: emp.id,
                tingkat_pendidikan: data.hr.tingkat_pendidikan,
                bidang_studi: data.hr.bidang_studi,
                nama_sekolah: data.hr.nama_sekolah,
                kota_sekolah: data.hr.kota_sekolah,
                status_kelulusan: data.hr.status_kelulusan,
                siklus_pembayaran_gaji: data.hr.siklus_pembayaran_gaji,
            };
            if (data.hr.jhk_code) hrData.jenis_hubungan_kerja_id = jhkMap[data.hr.jhk_code]?.id;
            if (data.hr.kat_pangkat_code) hrData.kategori_pangkat_id = katPangkatMap[data.hr.kat_pangkat_code]?.id;
            if (data.hr.gol_code) hrData.golongan_pangkat_id = golMap[data.hr.gol_code]?.id;
            if (data.hr.sub_gol_code) hrData.sub_golongan_pangkat_id = subGolMap[data.hr.sub_gol_code]?.id;
            if (data.hr.tanggal_masuk_group) hrData.tanggal_masuk_group = data.hr.tanggal_masuk_group;
            if (data.hr.tanggal_masuk) hrData.tanggal_masuk = data.hr.tanggal_masuk;
            if (data.hr.tanggal_permanent) hrData.tanggal_permanent = data.hr.tanggal_permanent;
            if (data.hr.tanggal_kontrak) hrData.tanggal_kontrak = data.hr.tanggal_kontrak;
            if (data.hr.tanggal_akhir_kontrak) hrData.tanggal_akhir_kontrak = data.hr.tanggal_akhir_kontrak;
            if (data.hr.nama_kontak_darurat_1) hrData.nama_kontak_darurat_1 = data.hr.nama_kontak_darurat_1;
            if (data.hr.nomor_telepon_kontak_darurat_1) hrData.nomor_telepon_kontak_darurat_1 = data.hr.nomor_telepon_kontak_darurat_1;
            if (data.hr.hubungan_kontak_darurat_1) hrData.hubungan_kontak_darurat_1 = data.hr.hubungan_kontak_darurat_1;
            if (data.hr.alamat_kontak_darurat_1) hrData.alamat_kontak_darurat_1 = data.hr.alamat_kontak_darurat_1;
            if (data.hr.ukuran_seragam_kerja) hrData.ukuran_seragam_kerja = data.hr.ukuran_seragam_kerja;
            if (data.hr.ukuran_sepatu_kerja) hrData.ukuran_sepatu_kerja = data.hr.ukuran_sepatu_kerja;
            await EmployeeHRInfo.create(hrData);

            await EmployeeFamilyInfo.create({ employee_id: emp.id, ...data.family } as any);

            console.log(`  [${data.emp.nomor_induk_karyawan}] ${data.emp.nama_lengkap}`);
        }

        // Set manager & atasan_langsung references
        for (const data of employeesData) {
            if (data.emp.manager_nik) {
                const emp = employeeMap[data.emp.nomor_induk_karyawan];
                const mgr = employeeMap[data.emp.manager_nik];
                if (emp && mgr) {
                    await emp.update({ manager_id: mgr.id, atasan_langsung_id: mgr.id });
                }
            }
        }

        // Set department managers
        await deptMap['DEP-001'].update({ manager_id: employeeMap['EMP-002'].id });
        await deptMap['DEP-004'].update({ manager_id: employeeMap['EMP-003'].id });
        await deptMap['DEP-005'].update({ manager_id: employeeMap['EMP-003'].id });
        await deptMap['DEP-006'].update({ manager_id: employeeMap['EMP-003'].id });
        await deptMap['DEP-007'].update({ manager_id: employeeMap['EMP-005'].id });
        await deptMap['DEP-008'].update({ manager_id: employeeMap['EMP-005'].id });
        await deptMap['DEP-009'].update({ manager_id: employeeMap['EMP-004'].id });
        await deptMap['DEP-010'].update({ manager_id: employeeMap['EMP-004'].id });
        console.log(`  20 karyawan created + manager references set\n`);

        // ═══════════════════════════════════════════════════════════════
        // LAYER 4: USERS (linked ke employees & roles)
        // ═══════════════════════════════════════════════════════════════
        console.log('=== LAYER 4: USERS ===');

        const usersData = [
            { nik: '111111', nama: 'Superadmin', password: 'password123', role: 'superadmin', emp_nik: null },
            { nik: '1234567890123456', nama: 'Superadmin Full', password: 'password123', role: 'superadmin', emp_nik: null },
            { nik: 'EMP-001', nama: 'Ahmad Surya Wijaya', password: 'password123', role: 'superadmin', emp_nik: 'EMP-001' },
            { nik: 'EMP-002', nama: 'Siti Nurhaliza Rahman', password: 'password123', role: 'admin', emp_nik: 'EMP-002' },
            { nik: 'EMP-003', nama: 'Bambang Prasetyo', password: 'password123', role: 'admin', emp_nik: 'EMP-003' },
            { nik: 'EMP-004', nama: 'Dewi Kartika Sari', password: 'password123', role: 'manager', emp_nik: 'EMP-004' },
            { nik: 'EMP-005', nama: 'Rizky Ramadhan Putra', password: 'password123', role: 'manager', emp_nik: 'EMP-005' },
            { nik: 'EMP-006', nama: 'Andi Firmansyah', password: 'password123', role: 'staff', emp_nik: 'EMP-006' },
            { nik: 'EMP-007', nama: 'Putri Ayu Lestari', password: 'password123', role: 'staff', emp_nik: 'EMP-007' },
            { nik: 'EMP-009', nama: 'Dian Permata Sari', password: 'password123', role: 'staff', emp_nik: 'EMP-009' },
            { nik: 'EMP-012', nama: 'Wahyu Hidayat', password: 'password123', role: 'employee', emp_nik: 'EMP-012' },
            { nik: 'EMP-015', nama: 'Novita Anggraini', password: 'password123', role: 'employee', emp_nik: 'EMP-015' },
        ];

        const roleMap: Record<string, any> = {};
        for (const name of ['superadmin', 'admin', 'staff', 'manager', 'employee']) {
            roleMap[name] = await Role.findOne({ where: { name } });
        }

        for (const u of usersData) {
            await User.findOrCreate({
                where: { nik: u.nik },
                defaults: {
                    nama: u.nama,
                    nik: u.nik,
                    password: u.password,
                    role_id: roleMap[u.role]?.id,
                    employee_id: u.emp_nik ? employeeMap[u.emp_nik]?.id : null,
                    is_active: true,
                } as any,
            });
        }
        console.log(`  ${usersData.length} users created\n`);

        // ═══════════════════════════════════════════════════════════════
        // LAYER 5: INVENTORY MASTER DATA
        // ═══════════════════════════════════════════════════════════════
        console.log('=== LAYER 5: INVENTORY MASTER DATA ===');

        // --- Kategori Inventory (5) ---
        const invKatData = [
            { code: 'IKAT-001', nama: 'Elektronik', keterangan: 'Perangkat elektronik kantor' },
            { code: 'IKAT-002', nama: 'Furniture', keterangan: 'Perabot kantor' },
            { code: 'IKAT-003', nama: 'ATK', keterangan: 'Alat Tulis Kantor' },
            { code: 'IKAT-004', nama: 'Safety Equipment', keterangan: 'Perlengkapan keselamatan kerja' },
            { code: 'IKAT-005', nama: 'Kendaraan', keterangan: 'Kendaraan operasional' },
        ];
        const invKatMap: Record<string, any> = {};
        for (const d of invKatData) {
            const [row] = await InvKategori.findOrCreate({ where: { code: d.code }, defaults: d as any });
            invKatMap[d.code] = row;
        }
        console.log(`  ${invKatData.length} inv kategori`);

        // --- Sub Kategori Inventory (12) ---
        const invSubKatData = [
            { code: 'ISUB-001', nama: 'Laptop', kategori_code: 'IKAT-001', prefix_tag: 'LPT' },
            { code: 'ISUB-002', nama: 'Desktop PC', kategori_code: 'IKAT-001', prefix_tag: 'DPC' },
            { code: 'ISUB-003', nama: 'Monitor', kategori_code: 'IKAT-001', prefix_tag: 'MON' },
            { code: 'ISUB-004', nama: 'Printer', kategori_code: 'IKAT-001', prefix_tag: 'PRT' },
            { code: 'ISUB-005', nama: 'Meja', kategori_code: 'IKAT-002', prefix_tag: 'MJA' },
            { code: 'ISUB-006', nama: 'Kursi', kategori_code: 'IKAT-002', prefix_tag: 'KRS' },
            { code: 'ISUB-007', nama: 'Lemari', kategori_code: 'IKAT-002', prefix_tag: 'LMR' },
            { code: 'ISUB-008', nama: 'Kertas', kategori_code: 'IKAT-003', prefix_tag: null },
            { code: 'ISUB-009', nama: 'Alat Tulis', kategori_code: 'IKAT-003', prefix_tag: null },
            { code: 'ISUB-010', nama: 'Helm Safety', kategori_code: 'IKAT-004', prefix_tag: 'HLM' },
            { code: 'ISUB-011', nama: 'Sepatu Safety', kategori_code: 'IKAT-004', prefix_tag: 'SPT' },
            { code: 'ISUB-012', nama: 'Mobil', kategori_code: 'IKAT-005', prefix_tag: 'MBL' },
        ];
        const invSubKatMap: Record<string, any> = {};
        for (const d of invSubKatData) {
            const [row] = await InvSubKategori.findOrCreate({
                where: { code: d.code },
                defaults: { code: d.code, nama: d.nama, kategori_id: invKatMap[d.kategori_code].id, prefix_tag: d.prefix_tag } as any,
            });
            invSubKatMap[d.code] = row;
        }
        console.log(`  ${invSubKatData.length} inv sub kategori`);

        // --- Brand Inventory (15) ---
        const invBrandData = [
            { code: 'IBR-001', nama: 'Lenovo', sub_code: 'ISUB-001' },
            { code: 'IBR-002', nama: 'Dell', sub_code: 'ISUB-001' },
            { code: 'IBR-003', nama: 'HP (Hewlett-Packard)', sub_code: 'ISUB-002' },
            { code: 'IBR-004', nama: 'Samsung', sub_code: 'ISUB-003' },
            { code: 'IBR-005', nama: 'LG', sub_code: 'ISUB-003' },
            { code: 'IBR-006', nama: 'Epson', sub_code: 'ISUB-004' },
            { code: 'IBR-007', nama: 'Informa', sub_code: 'ISUB-005' },
            { code: 'IBR-008', nama: 'IKEA', sub_code: 'ISUB-006' },
            { code: 'IBR-009', nama: 'Olympic', sub_code: 'ISUB-007' },
            { code: 'IBR-010', nama: 'Sinar Dunia', sub_code: 'ISUB-008' },
            { code: 'IBR-011', nama: 'Pilot', sub_code: 'ISUB-009' },
            { code: 'IBR-012', nama: 'Krisbow', sub_code: 'ISUB-010' },
            { code: 'IBR-013', nama: 'Cheetah', sub_code: 'ISUB-011' },
            { code: 'IBR-014', nama: 'Toyota', sub_code: 'ISUB-012' },
            { code: 'IBR-015', nama: 'ASUS', sub_code: 'ISUB-001' },
        ];
        const invBrandMap: Record<string, any> = {};
        for (const d of invBrandData) {
            const [row] = await InvBrand.findOrCreate({
                where: { code: d.code },
                defaults: { code: d.code, nama: d.nama, sub_kategori_id: invSubKatMap[d.sub_code].id } as any,
            });
            invBrandMap[d.code] = row;
        }
        console.log(`  ${invBrandData.length} inv brand`);

        // --- UOM (6) ---
        const invUomData = [
            { code: 'UOM-001', nama: 'Unit', keterangan: 'Satuan unit' },
            { code: 'UOM-002', nama: 'Rim', keterangan: 'Satuan rim (500 lembar)' },
            { code: 'UOM-003', nama: 'Lusin', keterangan: 'Satuan lusin (12 buah)' },
            { code: 'UOM-004', nama: 'Pak', keterangan: 'Satuan pak' },
            { code: 'UOM-005', nama: 'Set', keterangan: 'Satuan set' },
            { code: 'UOM-006', nama: 'Pasang', keterangan: 'Satuan pasang' },
        ];
        const invUomMap: Record<string, any> = {};
        for (const d of invUomData) {
            const [row] = await InvUom.findOrCreate({ where: { code: d.code }, defaults: d as any });
            invUomMap[d.code] = row;
        }
        console.log(`  ${invUomData.length} inv uom`);

        // --- Produk (15) ---
        const invProdukData = [
            { code: 'PRD-001', nama: 'Lenovo ThinkPad T14', brand_code: 'IBR-001', has_serial_number: true, has_tag_number: true, stok_minimum: 5, keterangan: 'Laptop bisnis 14 inch' },
            { code: 'PRD-002', nama: 'Dell Latitude 5540', brand_code: 'IBR-002', has_serial_number: true, has_tag_number: true, stok_minimum: 3, keterangan: 'Laptop bisnis Dell' },
            { code: 'PRD-003', nama: 'HP ProDesk 400 G7', brand_code: 'IBR-003', has_serial_number: true, has_tag_number: true, stok_minimum: 3, keterangan: 'Desktop PC kantor' },
            { code: 'PRD-004', nama: 'Samsung 27" Monitor', brand_code: 'IBR-004', has_serial_number: true, has_tag_number: true, stok_minimum: 5, keterangan: 'Monitor 27 inch FHD' },
            { code: 'PRD-005', nama: 'LG 24" Monitor', brand_code: 'IBR-005', has_serial_number: true, has_tag_number: true, stok_minimum: 5, keterangan: 'Monitor 24 inch FHD' },
            { code: 'PRD-006', nama: 'Epson L3210', brand_code: 'IBR-006', has_serial_number: true, has_tag_number: false, stok_minimum: 2, keterangan: 'Printer ink tank multifungsi' },
            { code: 'PRD-007', nama: 'Meja Kerja 120x60', brand_code: 'IBR-007', has_serial_number: false, has_tag_number: true, stok_minimum: 5, keterangan: 'Meja kerja standar' },
            { code: 'PRD-008', nama: 'Kursi Kantor Ergonomis', brand_code: 'IBR-008', has_serial_number: false, has_tag_number: true, stok_minimum: 5, keterangan: 'Kursi ergonomis dengan sandaran' },
            { code: 'PRD-009', nama: 'Lemari Arsip 4 Laci', brand_code: 'IBR-009', has_serial_number: false, has_tag_number: true, stok_minimum: 3, keterangan: 'Lemari arsip besi' },
            { code: 'PRD-010', nama: 'Kertas HVS A4 80gsm', brand_code: 'IBR-010', has_serial_number: false, has_tag_number: false, stok_minimum: 50, keterangan: 'Kertas HVS A4' },
            { code: 'PRD-011', nama: 'Pulpen Pilot G2', brand_code: 'IBR-011', has_serial_number: false, has_tag_number: false, stok_minimum: 24, keterangan: 'Pulpen gel 0.7mm' },
            { code: 'PRD-012', nama: 'Helm Safety Kuning', brand_code: 'IBR-012', has_serial_number: false, has_tag_number: false, stok_minimum: 20, keterangan: 'Helm safety warna kuning' },
            { code: 'PRD-013', nama: 'Sepatu Safety Hitam', brand_code: 'IBR-013', has_serial_number: false, has_tag_number: false, stok_minimum: 15, keterangan: 'Sepatu safety steel toe' },
            { code: 'PRD-014', nama: 'Toyota Avanza', brand_code: 'IBR-014', has_serial_number: true, has_tag_number: true, stok_minimum: 1, keterangan: 'Mobil operasional' },
            { code: 'PRD-015', nama: 'ASUS ZenBook 14', brand_code: 'IBR-015', has_serial_number: true, has_tag_number: true, stok_minimum: 3, keterangan: 'Laptop ultrabook' },
        ];
        const invProdukMap: Record<string, any> = {};
        for (const d of invProdukData) {
            const [row] = await InvProduk.findOrCreate({
                where: { code: d.code },
                defaults: {
                    code: d.code, nama: d.nama, brand_id: invBrandMap[d.brand_code].id,
                    has_serial_number: d.has_serial_number, has_tag_number: d.has_tag_number,
                    stok_minimum: d.stok_minimum, keterangan: d.keterangan,
                } as any,
            });
            invProdukMap[d.code] = row;
        }
        console.log(`  ${invProdukData.length} inv produk`);

        // --- Gudang (5) ---
        const invGudangData = [
            { code: 'GDG-001', nama: 'Gudang Utama Jakarta', lokasi: 'Lantai B1, Gedung Utama', lokasi_code: 'LOK-001', dept_code: 'DEP-003', pj_nik: 'EMP-017' },
            { code: 'GDG-002', nama: 'Gudang IT Jakarta', lokasi: 'Lantai 3, Ruang Server', lokasi_code: 'LOK-001', dept_code: 'DEP-004', pj_nik: 'EMP-008' },
            { code: 'GDG-003', nama: 'Gudang Produksi Bekasi', lokasi: 'Area Pabrik Bekasi', lokasi_code: 'LOK-002', dept_code: 'DEP-007', pj_nik: 'EMP-012' },
            { code: 'GDG-004', nama: 'Gudang Cabang Bandung', lokasi: 'Ruang Gudang Lt. 1', lokasi_code: 'LOK-003', dept_code: null, pj_nik: 'EMP-018' },
            { code: 'GDG-005', nama: 'Gudang Cabang Surabaya', lokasi: 'Area Gudang Belakang', lokasi_code: 'LOK-004', dept_code: null, pj_nik: null },
        ];
        const invGudangMap: Record<string, any> = {};
        for (const d of invGudangData) {
            const [row] = await InvGudang.findOrCreate({
                where: { code: d.code },
                defaults: {
                    code: d.code, nama: d.nama, lokasi: d.lokasi,
                    lokasi_kerja_id: lokasiMap[d.lokasi_code]?.id,
                    department_id: d.dept_code ? deptMap[d.dept_code]?.id : null,
                    penanggung_jawab_id: d.pj_nik ? employeeMap[d.pj_nik]?.id : null,
                } as any,
            });
            invGudangMap[d.code] = row;
        }
        console.log(`  ${invGudangData.length} inv gudang\n`);

        // ═══════════════════════════════════════════════════════════════
        // LAYER 6: INVENTORY TRANSAKSI & STOK
        // ═══════════════════════════════════════════════════════════════
        console.log('=== LAYER 6: INVENTORY TRANSAKSI & STOK ===');

        const superadminUser = await User.findOne({ where: { nik: '111111' } });
        const createdBy = superadminUser?.id || null;

        // --- Transaksi Masuk dari Supplier ---
        const trxMasuk1 = await InvTransaksi.create({
            code: 'TRX-001', tipe: 'Masuk', sub_tipe: 'Supplier', tanggal: '2025-01-15',
            gudang_id: invGudangMap['GDG-001'].id, supplier_nama: 'PT Mitra Solusi Teknologi',
            no_referensi: 'PO-2025-001', catatan: 'Pengadaan peralatan kantor Q1 2025', created_by: createdBy,
        } as any);
        const trx1Details = [
            { produk_code: 'PRD-001', uom_code: 'UOM-001', jumlah: 10 },
            { produk_code: 'PRD-004', uom_code: 'UOM-001', jumlah: 10 },
            { produk_code: 'PRD-006', uom_code: 'UOM-001', jumlah: 5 },
            { produk_code: 'PRD-007', uom_code: 'UOM-001', jumlah: 20 },
            { produk_code: 'PRD-008', uom_code: 'UOM-001', jumlah: 20 },
            { produk_code: 'PRD-010', uom_code: 'UOM-002', jumlah: 100 },
            { produk_code: 'PRD-011', uom_code: 'UOM-003', jumlah: 10 },
        ];
        for (const d of trx1Details) {
            await InvTransaksiDetail.create({
                transaksi_id: trxMasuk1.id, produk_id: invProdukMap[d.produk_code].id,
                uom_id: invUomMap[d.uom_code].id, jumlah: d.jumlah,
            } as any);
        }
        console.log('  TRX-001: Masuk Supplier (peralatan kantor)');

        const trxMasuk2 = await InvTransaksi.create({
            code: 'TRX-002', tipe: 'Masuk', sub_tipe: 'Supplier', tanggal: '2025-01-20',
            gudang_id: invGudangMap['GDG-002'].id, supplier_nama: 'PT Komputer Jaya',
            no_referensi: 'PO-2025-002', catatan: 'Pengadaan IT equipment', created_by: createdBy,
        } as any);
        const trx2Details = [
            { produk_code: 'PRD-002', uom_code: 'UOM-001', jumlah: 8 },
            { produk_code: 'PRD-003', uom_code: 'UOM-001', jumlah: 5 },
            { produk_code: 'PRD-005', uom_code: 'UOM-001', jumlah: 15 },
            { produk_code: 'PRD-015', uom_code: 'UOM-001', jumlah: 5 },
        ];
        for (const d of trx2Details) {
            await InvTransaksiDetail.create({
                transaksi_id: trxMasuk2.id, produk_id: invProdukMap[d.produk_code].id,
                uom_id: invUomMap[d.uom_code].id, jumlah: d.jumlah,
            } as any);
        }
        console.log('  TRX-002: Masuk Supplier (IT equipment)');

        const trxMasuk3 = await InvTransaksi.create({
            code: 'TRX-003', tipe: 'Masuk', sub_tipe: 'Supplier', tanggal: '2025-02-01',
            gudang_id: invGudangMap['GDG-003'].id, supplier_nama: 'PT Safety Nusantara',
            no_referensi: 'PO-2025-003', catatan: 'Pengadaan APD produksi', created_by: createdBy,
        } as any);
        const trx3Details = [
            { produk_code: 'PRD-009', uom_code: 'UOM-001', jumlah: 10 },
            { produk_code: 'PRD-012', uom_code: 'UOM-001', jumlah: 50 },
            { produk_code: 'PRD-013', uom_code: 'UOM-006', jumlah: 30 },
        ];
        for (const d of trx3Details) {
            await InvTransaksiDetail.create({
                transaksi_id: trxMasuk3.id, produk_id: invProdukMap[d.produk_code].id,
                uom_id: invUomMap[d.uom_code].id, jumlah: d.jumlah,
            } as any);
        }
        console.log('  TRX-003: Masuk Supplier (APD)');

        // --- Transaksi Keluar ke Karyawan ---
        const trxKeluar1 = await InvTransaksi.create({
            code: 'TRX-004', tipe: 'Keluar', sub_tipe: 'Ke Karyawan', tanggal: '2025-02-10',
            gudang_id: invGudangMap['GDG-002'].id, karyawan_id: employeeMap['EMP-009'].id,
            catatan: 'Laptop untuk developer baru', created_by: createdBy,
        } as any);
        await InvTransaksiDetail.create({
            transaksi_id: trxKeluar1.id, produk_id: invProdukMap['PRD-001'].id,
            uom_id: invUomMap['UOM-001'].id, jumlah: 1,
        } as any);
        console.log('  TRX-004: Keluar ke Karyawan (laptop)');

        const trxKeluar2 = await InvTransaksi.create({
            code: 'TRX-005', tipe: 'Keluar', sub_tipe: 'Ke Karyawan', tanggal: '2025-02-15',
            gudang_id: invGudangMap['GDG-003'].id, karyawan_id: employeeMap['EMP-012'].id,
            catatan: 'APD untuk operator produksi', created_by: createdBy,
        } as any);
        await InvTransaksiDetail.create({
            transaksi_id: trxKeluar2.id, produk_id: invProdukMap['PRD-012'].id,
            uom_id: invUomMap['UOM-001'].id, jumlah: 1,
        } as any);
        await InvTransaksiDetail.create({
            transaksi_id: trxKeluar2.id, produk_id: invProdukMap['PRD-013'].id,
            uom_id: invUomMap['UOM-006'].id, jumlah: 1,
        } as any);
        console.log('  TRX-005: Keluar ke Karyawan (APD)');

        // --- Transfer antar gudang ---
        const trxTransfer = await InvTransaksi.create({
            code: 'TRX-006', tipe: 'Keluar', sub_tipe: 'Transfer Gudang', tanggal: '2025-03-01',
            gudang_id: invGudangMap['GDG-001'].id, gudang_tujuan_id: invGudangMap['GDG-004'].id,
            catatan: 'Transfer furniture ke cabang Bandung', created_by: createdBy,
        } as any);
        await InvTransaksiDetail.create({
            transaksi_id: trxTransfer.id, produk_id: invProdukMap['PRD-007'].id,
            uom_id: invUomMap['UOM-001'].id, jumlah: 5,
        } as any);
        await InvTransaksiDetail.create({
            transaksi_id: trxTransfer.id, produk_id: invProdukMap['PRD-008'].id,
            uom_id: invUomMap['UOM-001'].id, jumlah: 5,
        } as any);
        console.log('  TRX-006: Transfer Gudang (ke Bandung)');

        // --- Transfer Masuk (sisi penerima) ---
        const trxTransferMasuk = await InvTransaksi.create({
            code: 'TRX-007', tipe: 'Masuk', sub_tipe: 'Transfer Masuk', tanggal: '2025-03-01',
            gudang_id: invGudangMap['GDG-004'].id,
            no_referensi: 'TRX-006', catatan: 'Terima transfer furniture dari Jakarta', created_by: createdBy,
        } as any);
        await InvTransaksiDetail.create({
            transaksi_id: trxTransferMasuk.id, produk_id: invProdukMap['PRD-007'].id,
            uom_id: invUomMap['UOM-001'].id, jumlah: 5,
        } as any);
        await InvTransaksiDetail.create({
            transaksi_id: trxTransferMasuk.id, produk_id: invProdukMap['PRD-008'].id,
            uom_id: invUomMap['UOM-001'].id, jumlah: 5,
        } as any);
        console.log('  TRX-007: Transfer Masuk (Bandung terima)');

        // --- Adjustment (Opname) ---
        const trxOpname = await InvTransaksi.create({
            code: 'TRX-008', tipe: 'Adjustment', sub_tipe: 'Opname', tanggal: '2025-03-15',
            gudang_id: invGudangMap['GDG-001'].id,
            catatan: 'Hasil stock opname Q1 — koreksi kertas', created_by: createdBy,
        } as any);
        await InvTransaksiDetail.create({
            transaksi_id: trxOpname.id, produk_id: invProdukMap['PRD-010'].id,
            uom_id: invUomMap['UOM-002'].id, jumlah: -5, catatan: 'Selisih kurang 5 rim',
        } as any);
        console.log('  TRX-008: Adjustment Opname');

        console.log('');

        // --- Stok aktual per gudang (cerminan akhir transaksi) ---
        console.log('  Menyiapkan stok...');
        const stokData = [
            // GDG-001 (Gudang Utama Jakarta)
            { gudang_code: 'GDG-001', produk_code: 'PRD-001', uom_code: 'UOM-001', jumlah: 10 },
            { gudang_code: 'GDG-001', produk_code: 'PRD-004', uom_code: 'UOM-001', jumlah: 10 },
            { gudang_code: 'GDG-001', produk_code: 'PRD-006', uom_code: 'UOM-001', jumlah: 5 },
            { gudang_code: 'GDG-001', produk_code: 'PRD-007', uom_code: 'UOM-001', jumlah: 15 },
            { gudang_code: 'GDG-001', produk_code: 'PRD-008', uom_code: 'UOM-001', jumlah: 15 },
            { gudang_code: 'GDG-001', produk_code: 'PRD-010', uom_code: 'UOM-002', jumlah: 95 },
            { gudang_code: 'GDG-001', produk_code: 'PRD-011', uom_code: 'UOM-003', jumlah: 10 },
            // GDG-002 (Gudang IT Jakarta)
            { gudang_code: 'GDG-002', produk_code: 'PRD-002', uom_code: 'UOM-001', jumlah: 8 },
            { gudang_code: 'GDG-002', produk_code: 'PRD-003', uom_code: 'UOM-001', jumlah: 5 },
            { gudang_code: 'GDG-002', produk_code: 'PRD-005', uom_code: 'UOM-001', jumlah: 15 },
            { gudang_code: 'GDG-002', produk_code: 'PRD-015', uom_code: 'UOM-001', jumlah: 5 },
            // GDG-003 (Gudang Produksi Bekasi)
            { gudang_code: 'GDG-003', produk_code: 'PRD-009', uom_code: 'UOM-001', jumlah: 10 },
            { gudang_code: 'GDG-003', produk_code: 'PRD-012', uom_code: 'UOM-001', jumlah: 49 },
            { gudang_code: 'GDG-003', produk_code: 'PRD-013', uom_code: 'UOM-006', jumlah: 29 },
            // GDG-004 (Gudang Cabang Bandung)
            { gudang_code: 'GDG-004', produk_code: 'PRD-007', uom_code: 'UOM-001', jumlah: 5 },
            { gudang_code: 'GDG-004', produk_code: 'PRD-008', uom_code: 'UOM-001', jumlah: 5 },
        ];
        for (const s of stokData) {
            await InvStok.create({
                produk_id: invProdukMap[s.produk_code].id,
                gudang_id: invGudangMap[s.gudang_code].id,
                uom_id: invUomMap[s.uom_code].id,
                jumlah: s.jumlah,
            } as any);
        }
        console.log(`  ${stokData.length} stok records\n`);

        // --- Serial Numbers untuk produk yang has_serial_number / has_tag_number ---
        console.log('  Menyiapkan serial numbers...');
        const serialData = [
            // Laptop Lenovo ThinkPad (GDG-001, 10 unit)
            ...Array.from({ length: 10 }, (_, i) => ({
                produk_code: 'PRD-001', serial_number: `LNV-T14-2025-${String(i + 1).padStart(4, '0')}`,
                tag_number: `LPT-JKT-${String(i + 1).padStart(4, '0')}`,
                gudang_code: 'GDG-001', status: 'Tersedia' as const, trx_masuk_code: 'TRX-001',
            })),
            // Dell Latitude (GDG-002, 8 unit)
            ...Array.from({ length: 8 }, (_, i) => ({
                produk_code: 'PRD-002', serial_number: `DELL-5540-2025-${String(i + 1).padStart(4, '0')}`,
                tag_number: `LPT-IT-${String(i + 1).padStart(4, '0')}`,
                gudang_code: 'GDG-002', status: 'Tersedia' as const, trx_masuk_code: 'TRX-002',
            })),
            // HP ProDesk (GDG-002, 5 unit)
            ...Array.from({ length: 5 }, (_, i) => ({
                produk_code: 'PRD-003', serial_number: `HP-PD400-2025-${String(i + 1).padStart(4, '0')}`,
                tag_number: `DPC-IT-${String(i + 1).padStart(4, '0')}`,
                gudang_code: 'GDG-002', status: 'Tersedia' as const, trx_masuk_code: 'TRX-002',
            })),
            // Samsung Monitor (GDG-001, 10 unit)
            ...Array.from({ length: 10 }, (_, i) => ({
                produk_code: 'PRD-004', serial_number: `SAM-27M-2025-${String(i + 1).padStart(4, '0')}`,
                tag_number: `MON-JKT-${String(i + 1).padStart(4, '0')}`,
                gudang_code: 'GDG-001', status: 'Tersedia' as const, trx_masuk_code: 'TRX-001',
            })),
            // LG Monitor (GDG-002, 15 unit)
            ...Array.from({ length: 15 }, (_, i) => ({
                produk_code: 'PRD-005', serial_number: `LG-24M-2025-${String(i + 1).padStart(4, '0')}`,
                tag_number: `MON-IT-${String(i + 1).padStart(4, '0')}`,
                gudang_code: 'GDG-002', status: 'Tersedia' as const, trx_masuk_code: 'TRX-002',
            })),
            // ASUS ZenBook (GDG-002, 5 unit)
            ...Array.from({ length: 5 }, (_, i) => ({
                produk_code: 'PRD-015', serial_number: `ASUS-ZB14-2025-${String(i + 1).padStart(4, '0')}`,
                tag_number: `LPT-IT2-${String(i + 1).padStart(4, '0')}`,
                gudang_code: 'GDG-002', status: 'Tersedia' as const, trx_masuk_code: 'TRX-002',
            })),
            // Epson L3210 - serial only (GDG-001, 5 unit)
            ...Array.from({ length: 5 }, (_, i) => ({
                produk_code: 'PRD-006', serial_number: `EPS-L3210-2025-${String(i + 1).padStart(4, '0')}`,
                tag_number: null,
                gudang_code: 'GDG-001', status: 'Tersedia' as const, trx_masuk_code: 'TRX-001',
            })),
            // Meja Kerja - tag only (GDG-001, 15 unit sisa setelah transfer 5 ke Bandung)
            ...Array.from({ length: 15 }, (_, i) => ({
                produk_code: 'PRD-007', serial_number: null,
                tag_number: `MJA-JKT-${String(i + 1).padStart(4, '0')}`,
                gudang_code: 'GDG-001', status: 'Tersedia' as const, trx_masuk_code: 'TRX-001',
            })),
            // Meja Kerja - tag only (GDG-004 Bandung, 5 unit transfer)
            ...Array.from({ length: 5 }, (_, i) => ({
                produk_code: 'PRD-007', serial_number: null,
                tag_number: `MJA-BDG-${String(i + 1).padStart(4, '0')}`,
                gudang_code: 'GDG-004', status: 'Tersedia' as const, trx_masuk_code: 'TRX-001',
            })),
            // Kursi Kantor - tag only (GDG-001, 15 unit sisa setelah transfer)
            ...Array.from({ length: 15 }, (_, i) => ({
                produk_code: 'PRD-008', serial_number: null,
                tag_number: `KRS-JKT-${String(i + 1).padStart(4, '0')}`,
                gudang_code: 'GDG-001', status: 'Tersedia' as const, trx_masuk_code: 'TRX-001',
            })),
            // Kursi Kantor - tag only (GDG-004 Bandung, 5 unit transfer)
            ...Array.from({ length: 5 }, (_, i) => ({
                produk_code: 'PRD-008', serial_number: null,
                tag_number: `KRS-BDG-${String(i + 1).padStart(4, '0')}`,
                gudang_code: 'GDG-004', status: 'Tersedia' as const, trx_masuk_code: 'TRX-001',
            })),
            // Lemari Arsip - tag only (GDG-003 Bekasi, 10 unit)
            ...Array.from({ length: 10 }, (_, i) => ({
                produk_code: 'PRD-009', serial_number: null,
                tag_number: `LMR-BKS-${String(i + 1).padStart(4, '0')}`,
                gudang_code: 'GDG-003', status: 'Tersedia' as const, trx_masuk_code: 'TRX-003',
            })),
            // Toyota Avanza (tidak ada stok di gudang — contoh kendaraan operasional)
        ];

        const trxCodeToId: Record<string, number> = {
            'TRX-001': trxMasuk1.id, 'TRX-002': trxMasuk2.id, 'TRX-003': trxMasuk3.id,
        };

        for (const sn of serialData) {
            await InvSerialNumber.create({
                produk_id: invProdukMap[sn.produk_code].id,
                serial_number: sn.serial_number,
                tag_number: sn.tag_number,
                gudang_id: invGudangMap[sn.gudang_code].id,
                status: sn.status,
                transaksi_masuk_id: trxCodeToId[sn.trx_masuk_code],
                transaksi_terakhir_id: trxCodeToId[sn.trx_masuk_code],
            } as any);
        }
        console.log(`  ${serialData.length} serial numbers\n`);

        // ═══════════════════════════════════════════════════════════════
        // LAYER 7: FACILITY MANAGEMENT
        // ═══════════════════════════════════════════════════════════════
        console.log('=== LAYER 7: FACILITY ===');

        // Get first superadmin user for created_by
        const adminUser = await User.findOne({ where: { nik: '111111' } });
        const createdById = adminUser?.id ?? 1;

        // --- Room Types (5) ---
        const roomTypeData = [
            { code: 'FRT-001', nama: 'Kamar Tidur Single', keterangan: 'Kamar tidur untuk 1 orang', status: 'Aktif' as const },
            { code: 'FRT-002', nama: 'Kamar Tidur Double', keterangan: 'Kamar tidur untuk 2 orang', status: 'Aktif' as const },
            { code: 'FRT-003', nama: 'Ruang Kantor', keterangan: 'Ruang kerja kantor', status: 'Aktif' as const },
            { code: 'FRT-004', nama: 'Ruang Meeting', keterangan: 'Ruang rapat/meeting', status: 'Aktif' as const },
            { code: 'FRT-005', nama: 'Gudang/Storage', keterangan: 'Ruang penyimpanan barang', status: 'Aktif' as const },
        ];
        const roomTypeMap: Record<string, any> = {};
        for (const d of roomTypeData) {
            const [row] = await FacilityRoomType.findOrCreate({ where: { code: d.code }, defaults: d as any });
            roomTypeMap[d.code] = row;
        }
        console.log(`  ${roomTypeData.length} room types`);

        // --- Maintenance Categories (4) ---
        const maintCatData = [
            { code: 'FMC-001', nama: 'Listrik & Elektronik', keterangan: 'Perbaikan instalasi listrik dan perangkat elektronik', status: 'Aktif' as const },
            { code: 'FMC-002', nama: 'Plumbing', keterangan: 'Perbaikan saluran air dan sanitasi', status: 'Aktif' as const },
            { code: 'FMC-003', nama: 'Sipil & Bangunan', keterangan: 'Perbaikan struktur bangunan, cat, lantai', status: 'Aktif' as const },
            { code: 'FMC-004', nama: 'AC & Pendingin', keterangan: 'Perawatan dan perbaikan AC', status: 'Aktif' as const },
        ];
        const maintCatMap: Record<string, any> = {};
        for (const d of maintCatData) {
            const [row] = await FacilityMaintenanceCategory.findOrCreate({ where: { code: d.code }, defaults: d as any });
            maintCatMap[d.code] = row;
        }
        console.log(`  ${maintCatData.length} maintenance categories`);

        // --- Buildings (5) ---
        const buildingData = [
            { code: 'BLD-001', nama: 'Mess Karyawan Jakarta', tipe: 'Mess' as const, lokasi_code: 'LOK-001', pj_nik: 'EMP-002', kapasitas_total: 20, alamat: 'Jl. Jend. Sudirman No. 1A, Jakarta Selatan', keterangan: 'Mess karyawan kantor pusat', status: 'Aktif' as const },
            { code: 'BLD-002', nama: 'Mess Karyawan Bekasi', tipe: 'Mess' as const, lokasi_code: 'LOK-002', pj_nik: 'EMP-005', kapasitas_total: 30, alamat: 'Jl. Industri Raya No. 5A, Bekasi', keterangan: 'Mess karyawan site Bekasi', status: 'Aktif' as const },
            { code: 'BLD-003', nama: 'Kantor Pusat Jakarta', tipe: 'Kantor' as const, lokasi_code: 'LOK-001', pj_nik: 'EMP-001', kapasitas_total: 50, alamat: 'Jl. Jend. Sudirman No. 1, Jakarta Selatan 12190', keterangan: 'Gedung kantor pusat', status: 'Aktif' as const },
            { code: 'BLD-004', nama: 'Workshop Bekasi', tipe: 'Workshop' as const, lokasi_code: 'LOK-002', pj_nik: 'EMP-005', kapasitas_total: 15, alamat: 'Jl. Industri Raya No. 7, Bekasi', keterangan: 'Workshop produksi Bekasi', status: 'Aktif' as const },
            { code: 'BLD-005', nama: 'Mess Karyawan Bandung', tipe: 'Mess' as const, lokasi_code: 'LOK-003', pj_nik: 'EMP-004', kapasitas_total: 16, alamat: 'Jl. Soekarno-Hatta No. 90, Bandung', keterangan: 'Mess karyawan cabang Bandung', status: 'Aktif' as const },
        ];
        const buildingMap: Record<string, any> = {};
        for (const d of buildingData) {
            const [row] = await FacilityBuilding.findOrCreate({
                where: { code: d.code },
                defaults: {
                    code: d.code, nama: d.nama, tipe: d.tipe,
                    lokasi_kerja_id: lokasiMap[d.lokasi_code].id,
                    penanggung_jawab_id: employeeMap[d.pj_nik]?.id ?? null,
                    kapasitas_total: d.kapasitas_total, alamat: d.alamat,
                    keterangan: d.keterangan, status: d.status,
                } as any,
            });
            buildingMap[d.code] = row;
        }
        console.log(`  ${buildingData.length} buildings`);

        // --- FACILITY_SEED_PART2 ---

        // --- Rooms (16) ---
        const roomData = [
            // Mess Jakarta (BLD-001) - 6 kamar
            { code: 'RM-001', nama: 'Kamar 101', building_code: 'BLD-001', type_code: 'FRT-001', lantai: '1', kapasitas: 1, status: 'Penuh' as const },
            { code: 'RM-002', nama: 'Kamar 102', building_code: 'BLD-001', type_code: 'FRT-001', lantai: '1', kapasitas: 1, status: 'Tersedia' as const },
            { code: 'RM-003', nama: 'Kamar 201', building_code: 'BLD-001', type_code: 'FRT-002', lantai: '2', kapasitas: 2, status: 'Penuh' as const },
            { code: 'RM-004', nama: 'Kamar 202', building_code: 'BLD-001', type_code: 'FRT-002', lantai: '2', kapasitas: 2, status: 'Tersedia' as const },
            { code: 'RM-005', nama: 'Kamar 301', building_code: 'BLD-001', type_code: 'FRT-001', lantai: '3', kapasitas: 1, status: 'Maintenance' as const },
            { code: 'RM-006', nama: 'Kamar 302', building_code: 'BLD-001', type_code: 'FRT-001', lantai: '3', kapasitas: 1, status: 'Tersedia' as const },
            // Mess Bekasi (BLD-002) - 4 kamar
            { code: 'RM-007', nama: 'Kamar A1', building_code: 'BLD-002', type_code: 'FRT-002', lantai: '1', kapasitas: 2, status: 'Penuh' as const },
            { code: 'RM-008', nama: 'Kamar A2', building_code: 'BLD-002', type_code: 'FRT-002', lantai: '1', kapasitas: 2, status: 'Tersedia' as const },
            { code: 'RM-009', nama: 'Kamar B1', building_code: 'BLD-002', type_code: 'FRT-001', lantai: '2', kapasitas: 1, status: 'Penuh' as const },
            { code: 'RM-010', nama: 'Kamar B2', building_code: 'BLD-002', type_code: 'FRT-001', lantai: '2', kapasitas: 1, status: 'Tersedia' as const },
            // Kantor Pusat (BLD-003) - 3 ruang
            { code: 'RM-011', nama: 'Ruang IT', building_code: 'BLD-003', type_code: 'FRT-003', lantai: '2', kapasitas: 10, status: 'Tersedia' as const },
            { code: 'RM-012', nama: 'Ruang Meeting Utama', building_code: 'BLD-003', type_code: 'FRT-004', lantai: '3', kapasitas: 20, status: 'Tersedia' as const },
            { code: 'RM-013', nama: 'Gudang IT', building_code: 'BLD-003', type_code: 'FRT-005', lantai: '1', kapasitas: 0, status: 'Tersedia' as const },
            // Mess Bandung (BLD-005) - 3 kamar
            { code: 'RM-014', nama: 'Kamar 1A', building_code: 'BLD-005', type_code: 'FRT-002', lantai: '1', kapasitas: 2, status: 'Penuh' as const },
            { code: 'RM-015', nama: 'Kamar 1B', building_code: 'BLD-005', type_code: 'FRT-001', lantai: '1', kapasitas: 1, status: 'Tersedia' as const },
            { code: 'RM-016', nama: 'Kamar 2A', building_code: 'BLD-005', type_code: 'FRT-002', lantai: '2', kapasitas: 2, status: 'Tersedia' as const },
        ];
        const roomMap: Record<string, any> = {};
        for (const d of roomData) {
            const [row] = await FacilityRoom.findOrCreate({
                where: { code: d.code },
                defaults: {
                    code: d.code, nama: d.nama,
                    building_id: buildingMap[d.building_code].id,
                    room_type_id: roomTypeMap[d.type_code]?.id ?? null,
                    lantai: d.lantai, kapasitas: d.kapasitas,
                    status: d.status,
                } as any,
            });
            roomMap[d.code] = row;
        }
        console.log(`  ${roomData.length} rooms`);

        // --- FACILITY_SEED_PART3 ---

        // --- Occupants (8 active, 2 historical) ---
        const occupantData = [
            // Mess Jakarta BLD-001
            { room_code: 'RM-001', emp_nik: 'EMP-008', tanggal_masuk: '2024-03-01', tanggal_keluar: null, status: 'Aktif' as const, keterangan: 'Karyawan IT Support' },
            { room_code: 'RM-003', emp_nik: 'EMP-010', tanggal_masuk: '2024-02-15', tanggal_keluar: null, status: 'Aktif' as const, keterangan: 'Karyawan QC' },
            { room_code: 'RM-003', emp_nik: 'EMP-011', tanggal_masuk: '2024-02-15', tanggal_keluar: null, status: 'Aktif' as const, keterangan: 'Karyawan QC' },
            // Mess Bekasi BLD-002
            { room_code: 'RM-007', emp_nik: 'EMP-013', tanggal_masuk: '2024-01-10', tanggal_keluar: null, status: 'Aktif' as const, keterangan: 'Karyawan Produksi' },
            { room_code: 'RM-007', emp_nik: 'EMP-014', tanggal_masuk: '2024-01-10', tanggal_keluar: null, status: 'Aktif' as const, keterangan: 'Karyawan Produksi' },
            { room_code: 'RM-009', emp_nik: 'EMP-016', tanggal_masuk: '2024-04-01', tanggal_keluar: null, status: 'Aktif' as const, keterangan: 'Karyawan Maintenance' },
            // Mess Bandung BLD-005
            { room_code: 'RM-014', emp_nik: 'EMP-017', tanggal_masuk: '2024-05-01', tanggal_keluar: null, status: 'Aktif' as const, keterangan: 'Karyawan Sales Bandung' },
            { room_code: 'RM-014', emp_nik: 'EMP-018', tanggal_masuk: '2024-05-01', tanggal_keluar: null, status: 'Aktif' as const, keterangan: 'Karyawan Sales Bandung' },
            // Historical (selesai)
            { room_code: 'RM-002', emp_nik: 'EMP-012', tanggal_masuk: '2023-06-01', tanggal_keluar: '2024-01-31', status: 'Selesai' as const, keterangan: 'Pindah ke site Bekasi' },
            { room_code: 'RM-006', emp_nik: 'EMP-015', tanggal_masuk: '2023-09-01', tanggal_keluar: '2024-03-15', status: 'Selesai' as const, keterangan: 'Kontrak selesai' },
        ];
        for (const d of occupantData) {
            await FacilityOccupant.create({
                room_id: roomMap[d.room_code].id,
                employee_id: employeeMap[d.emp_nik].id,
                tanggal_masuk: d.tanggal_masuk,
                tanggal_keluar: d.tanggal_keluar,
                status: d.status,
                keterangan: d.keterangan,
                created_by: createdById,
            } as any);
        }
        console.log(`  ${occupantData.length} occupants (8 active, 2 historical)`);

        // --- FACILITY_SEED_PART4 ---

        // --- Assets (link serial numbers to rooms) ---
        const snLaptop1 = await InvSerialNumber.findOne({ where: { serial_number: 'LNV-T14-2025-0001' } });
        const snLaptop2 = await InvSerialNumber.findOne({ where: { serial_number: 'LNV-T14-2025-0002' } });
        const snMonitor1 = await InvSerialNumber.findOne({ where: { serial_number: 'SAM-27M-2025-0001' } });
        const snMonitor2 = await InvSerialNumber.findOne({ where: { serial_number: 'SAM-27M-2025-0002' } });
        const snPrinter1 = await InvSerialNumber.findOne({ where: { serial_number: 'EPS-L3210-2025-0001' } });

        const assetData = [
            { room_code: 'RM-011', sn: snLaptop1, tanggal: '2025-01-15', ket: 'Laptop untuk ruang IT' },
            { room_code: 'RM-011', sn: snMonitor1, tanggal: '2025-01-15', ket: 'Monitor ruang IT' },
            { room_code: 'RM-011', sn: snPrinter1, tanggal: '2025-01-20', ket: 'Printer ruang IT' },
            { room_code: 'RM-012', sn: snLaptop2, tanggal: '2025-02-01', ket: 'Laptop ruang meeting' },
            { room_code: 'RM-012', sn: snMonitor2, tanggal: '2025-02-01', ket: 'Monitor ruang meeting' },
        ];
        let assetCount = 0;
        for (const d of assetData) {
            if (d.sn) {
                await FacilityAsset.create({
                    room_id: roomMap[d.room_code].id,
                    serial_number_id: d.sn.id,
                    tanggal_penempatan: d.tanggal,
                    keterangan: d.ket,
                    status: 'Aktif',
                    created_by: createdById,
                } as any);
                assetCount++;
            }
        }
        console.log(`  ${assetCount} assets placed in rooms`);

        // --- Work Orders (6) ---
        const workOrderData = [
            { code: 'WO-001', room_code: 'RM-005', cat_code: 'FMC-001', judul: 'Perbaikan Lampu Kamar 301', deskripsi: 'Lampu kamar 301 mati, perlu penggantian', prioritas: 'Medium' as const, status: 'In Progress' as const, reporter_nik: 'EMP-008', assignee_nik: 'EMP-016', tanggal_lapor: '2025-01-10', tanggal_selesai: null, estimasi: 150000, realisasi: null, catatan: null },
            { code: 'WO-002', room_code: 'RM-007', cat_code: 'FMC-002', judul: 'Keran Air Bocor Kamar A1', deskripsi: 'Keran air di kamar mandi bocor', prioritas: 'High' as const, status: 'Resolved' as const, reporter_nik: 'EMP-013', assignee_nik: 'EMP-016', tanggal_lapor: '2025-01-05', tanggal_selesai: '2025-01-07', estimasi: 200000, realisasi: 175000, catatan: 'Keran diganti baru' },
            { code: 'WO-003', room_code: 'RM-011', cat_code: 'FMC-004', judul: 'AC Ruang IT Tidak Dingin', deskripsi: 'AC di ruang IT tidak mengeluarkan udara dingin', prioritas: 'High' as const, status: 'Open' as const, reporter_nik: 'EMP-006', assignee_nik: null, tanggal_lapor: '2025-01-12', tanggal_selesai: null, estimasi: 500000, realisasi: null, catatan: null },
            { code: 'WO-004', room_code: 'RM-003', cat_code: 'FMC-003', judul: 'Cat Dinding Mengelupas', deskripsi: 'Cat dinding kamar 201 mengelupas di beberapa bagian', prioritas: 'Low' as const, status: 'Closed' as const, reporter_nik: 'EMP-010', assignee_nik: 'EMP-016', tanggal_lapor: '2024-12-20', tanggal_selesai: '2024-12-28', estimasi: 300000, realisasi: 280000, catatan: 'Pengecatan ulang selesai' },
            { code: 'WO-005', room_code: 'RM-014', cat_code: 'FMC-001', judul: 'Stop Kontak Rusak', deskripsi: 'Stop kontak di kamar 1A tidak berfungsi', prioritas: 'Critical' as const, status: 'Open' as const, reporter_nik: 'EMP-017', assignee_nik: null, tanggal_lapor: '2025-01-14', tanggal_selesai: null, estimasi: 100000, realisasi: null, catatan: null },
            { code: 'WO-006', room_code: 'RM-012', cat_code: 'FMC-004', judul: 'Perawatan Rutin AC Meeting Room', deskripsi: 'Jadwal perawatan rutin AC ruang meeting', prioritas: 'Low' as const, status: 'In Progress' as const, reporter_nik: 'EMP-002', assignee_nik: 'EMP-016', tanggal_lapor: '2025-01-08', tanggal_selesai: null, estimasi: 250000, realisasi: null, catatan: null },
        ];
        for (const d of workOrderData) {
            await FacilityWorkOrder.create({
                code: d.code,
                room_id: roomMap[d.room_code].id,
                kategori_id: maintCatMap[d.cat_code]?.id ?? null,
                judul: d.judul,
                deskripsi: d.deskripsi,
                prioritas: d.prioritas,
                status: d.status,
                reported_by: d.reporter_nik ? employeeMap[d.reporter_nik]?.id : null,
                assigned_to: d.assignee_nik ? employeeMap[d.assignee_nik]?.id : null,
                tanggal_lapor: d.tanggal_lapor,
                tanggal_selesai: d.tanggal_selesai,
                estimasi_biaya: d.estimasi,
                realisasi_biaya: d.realisasi,
                catatan_penyelesaian: d.catatan,
                created_by: createdById,
            } as any);
        }
        console.log(`  ${workOrderData.length} work orders\n`);

        // ═══════════════════════════════════════════════════════════════
        // DONE
        // ═══════════════════════════════════════════════════════════════
        console.log('╔══════════════════════════════════════════════════╗');
        console.log('║          SEED COMPLETED SUCCESSFULLY!           ║');
        console.log('╠══════════════════════════════════════════════════╣');
        console.log('║  RBAC:                                          ║');
        console.log('║    35 permissions, 5 roles                      ║');
        console.log('║  HR Master Data:                                ║');
        console.log('║    6 divisi, 12 department, 18 posisi jabatan   ║');
        console.log('║    5 status, 5 lokasi, 4 kat.pangkat            ║');
        console.log('║    5 golongan, 10 sub golongan                  ║');
        console.log('║    4 jenis hub. kerja, 6 tag                    ║');
        console.log('║  Employees:                                     ║');
        console.log('║    20 karyawan (personal + HR + family info)     ║');
        console.log('║  Users:                                         ║');
        console.log('║    12 users (semua role terwakili)               ║');
        console.log('║  Inventory:                                     ║');
        console.log('║    5 kategori, 12 sub kategori, 15 brand        ║');
        console.log('║    6 UOM, 15 produk, 5 gudang                   ║');
        console.log('║    8 transaksi, 16 stok, 53 serial numbers      ║');
        console.log('║  Facility:                                      ║');
        console.log('║    5 room types, 4 maint. categories            ║');
        console.log('║    5 buildings, 16 rooms                        ║');
        console.log('║    10 occupants, 5 assets, 6 work orders        ║');
        console.log('╠══════════════════════════════════════════════════╣');
        console.log('║  Login credentials (semua password: password123) ║');
        console.log('║  Superadmin : NIK 111111                        ║');
        console.log('║  Superadmin : NIK 1234567890123456               ║');
        console.log('║  Superadmin : NIK EMP-001 (Ahmad Surya)         ║');
        console.log('║  Admin      : NIK EMP-002 (Siti Nurhaliza)      ║');
        console.log('║  Admin      : NIK EMP-003 (Bambang Prasetyo)    ║');
        console.log('║  Manager    : NIK EMP-004 (Dewi Kartika)        ║');
        console.log('║  Manager    : NIK EMP-005 (Rizky Ramadhan)      ║');
        console.log('║  Staff      : NIK EMP-006 (Andi Firmansyah)     ║');
        console.log('║  Staff      : NIK EMP-007 (Putri Ayu)           ║');
        console.log('║  Staff      : NIK EMP-009 (Dian Permata)        ║');
        console.log('║  Employee   : NIK EMP-012 (Wahyu Hidayat)       ║');
        console.log('║  Employee   : NIK EMP-015 (Novita Anggraini)    ║');
        console.log('╚══════════════════════════════════════════════════╝');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

seedComplete();
