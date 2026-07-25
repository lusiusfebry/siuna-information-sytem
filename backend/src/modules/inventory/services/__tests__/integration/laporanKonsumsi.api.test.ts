import request from 'supertest';
import { app } from '../../../../../index';
import User from '../../../../auth/models/User';
import { Role } from '../../../../auth/models/Role';
import authService from '../../../../auth/services/auth.service';
import Divisi from '../../../../hr/models/Divisi';
import Department from '../../../../hr/models/Department';
import Employee from '../../../../hr/models/Employee';
import InvKategori from '../../../models/Kategori';
import InvSubKategori from '../../../models/SubKategori';
import InvBrand from '../../../models/Brand';
import InvUom from '../../../models/Uom';
import InvProduk from '../../../models/Produk';
import InvGudang from '../../../models/Gudang';
import InvTransaksi from '../../../models/Transaksi';
import InvTransaksiDetail from '../../../models/TransaksiDetail';

// Integration test — laporan konsumsi (GET /api/inventory/laporan/konsumsi).
//
// Verifies the paginated report contract the frontend LaporanKonsumsiPage consumes:
//   { status, data: InvTransaksi[], summary: { per_produk, per_department,
//     per_karyawan, total_baris, total_transaksi }, pagination: { total, page,
//     totalPages } }
//
// The service filters strictly on { sub_tipe: 'Konsumsi', approval_status: 'Approved' },
// so this test seeds one Approved employee-recipient row, one Approved
// department-recipient row, and one Pending row that must NOT appear in the result.

describe('Laporan Konsumsi API Integration (Real DB)', () => {
    let adminToken: string;
    let testUser: User;

    let divisi: Divisi;
    let department: Department;
    let employee: Employee;

    let kategori: InvKategori;
    let subKategori: InvSubKategori;
    let brand: InvBrand;
    let uom: InvUom;
    let produkA: InvProduk;
    let produkB: InvProduk;
    let gudang: InvGudang;

    let trxEmp: InvTransaksi;
    let trxDept: InvTransaksi;
    let trxPending: InvTransaksi;

    beforeAll(async () => {
        // Auth: superadmin token so checkPermission + checkDepartmentAccess are bypassed.
        const [role] = await Role.findOrCreate({
            where: { name: 'superadmin' },
            defaults: { name: 'superadmin', display_name: 'Superadmin', is_system_role: true },
        });
        testUser = await User.create({
            nama: 'Konsumsi Test User',
            nik: '999912',
            password: 'password123',
            role_id: role.id,
            is_active: true,
        });
        const userWithRole = await User.findByPk(testUser.id, { include: [{ model: Role, as: 'roleDetails' }] });
        adminToken = authService.generateToken(userWithRole!);

        // HR chain
        divisi = await Divisi.create({ nama: 'Konsumsi Divisi', code: 'KNS-DIV' });
        department = await Department.create({ nama: 'Konsumsi Dept', code: 'KNS-DEP', divisi_id: divisi.id });
        employee = await Employee.create({
            nama_lengkap: 'Konsumsi Karyawan',
            nomor_induk_karyawan: 'KNS-EMP-001',
            department_id: department.id,
        });

        // Inventory master chain: kategori → sub_kategori → brand → produk
        kategori = await InvKategori.create({ code: 'KNS-KAT', nama: 'Konsumsi Kategori' });
        subKategori = await InvSubKategori.create({ code: 'KNS-SUB', nama: 'Konsumsi Sub', kategori_id: kategori.id });
        brand = await InvBrand.create({ code: 'KNS-BR', nama: 'Konsumsi Brand', sub_kategori_id: subKategori.id });
        uom = await InvUom.create({ code: 'KNS-UOM', nama: 'Pcs' });
        produkA = await InvProduk.create({
            code: 'KNS-P-A', nama: 'Sarung Tangan', brand_id: brand.id, uom_id: uom.id, is_consumable: true,
        });
        produkB = await InvProduk.create({
            code: 'KNS-P-B', nama: 'Masker', brand_id: brand.id, uom_id: uom.id, is_consumable: true,
        });
        gudang = await InvGudang.create({ code: 'KNS-GDG', nama: 'Konsumsi Gudang' });

        // Approved Konsumsi → karyawan (produkA x3, produkB x2). Bypasses the service
        // to build the exact fixture we assert on; date pinned inside the sampling window.
        trxEmp = await InvTransaksi.create({
            code: 'STK-KNS-0001', tipe: 'Keluar', sub_tipe: 'Konsumsi',
            tanggal: '2026-06-15', gudang_id: gudang.id, karyawan_id: employee.id,
            created_by: testUser.id, approval_status: 'Approved',
        });
        await InvTransaksiDetail.create({ transaksi_id: trxEmp.id, produk_id: produkA.id, uom_id: uom.id, jumlah: 3 });
        await InvTransaksiDetail.create({ transaksi_id: trxEmp.id, produk_id: produkB.id, uom_id: uom.id, jumlah: 2 });

        // Approved Konsumsi → department (produkA x5)
        trxDept = await InvTransaksi.create({
            code: 'STK-KNS-0002', tipe: 'Keluar', sub_tipe: 'Konsumsi',
            tanggal: '2026-06-20', gudang_id: gudang.id, department_id: department.id,
            created_by: testUser.id, approval_status: 'Approved',
        });
        await InvTransaksiDetail.create({ transaksi_id: trxDept.id, produk_id: produkA.id, uom_id: uom.id, jumlah: 5 });

        // Pending Konsumsi — must NOT appear in the report (approval_status filter).
        trxPending = await InvTransaksi.create({
            code: 'STK-KNS-0003', tipe: 'Keluar', sub_tipe: 'Konsumsi',
            tanggal: '2026-06-25', gudang_id: gudang.id, karyawan_id: employee.id,
            created_by: testUser.id, approval_status: 'Pending',
        });
        await InvTransaksiDetail.create({ transaksi_id: trxPending.id, produk_id: produkA.id, uom_id: uom.id, jumlah: 9 });
    });

    afterAll(async () => {
        try {
            await InvTransaksiDetail.destroy({ where: { transaksi_id: [trxEmp?.id, trxDept?.id, trxPending?.id].filter(Boolean) } });
            await InvTransaksi.destroy({ where: { id: [trxEmp?.id, trxDept?.id, trxPending?.id].filter(Boolean) } });
            if (produkA) await InvProduk.destroy({ where: { id: produkA.id }, force: true });
            if (produkB) await InvProduk.destroy({ where: { id: produkB.id }, force: true });
            if (gudang) await InvGudang.destroy({ where: { id: gudang.id }, force: true });
            if (uom) await InvUom.destroy({ where: { id: uom.id }, force: true });
            if (brand) await InvBrand.destroy({ where: { id: brand.id }, force: true });
            if (subKategori) await InvSubKategori.destroy({ where: { id: subKategori.id }, force: true });
            if (kategori) await InvKategori.destroy({ where: { id: kategori.id }, force: true });
            if (employee) await Employee.destroy({ where: { id: employee.id }, force: true });
            if (department) await Department.destroy({ where: { id: department.id } });
            if (divisi) await Divisi.destroy({ where: { id: divisi.id } });
            if (testUser) await User.destroy({ where: { nik: '999912' } });
        } catch (e) {
            console.error('Laporan konsumsi cleanup error:', e);
        }
    });

    describe('GET /api/inventory/laporan/konsumsi', () => {
        it('returns the paginated response shape the frontend expects', async () => {
            const res = await request(app)
                .get('/api/inventory/laporan/konsumsi')
                .query({ gudang_id: gudang.id, dari: '2026-06-01', sampai: '2026-06-30', page: 1, limit: 20 })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');

            // data: only the 2 Approved rows (Pending row is filtered out)
            expect(Array.isArray(res.body.data)).toBe(true);
            const codes = res.body.data.map((r: any) => r.code).sort();
            expect(codes).toEqual(['STK-KNS-0001', 'STK-KNS-0002']);
            expect(codes).not.toContain('STK-KNS-0003');

            // summary aggregates. total_transaksi = distinct transactions (2);
            // total_baris = count from findAndCountAll with a hasMany include, which
            // is joined-row count — the sum of detail lines across the 2 transactions
            // (2 details on STK-KNS-0001 + 1 on STK-KNS-0002 = 3).
            const s = res.body.summary;
            expect(s.total_transaksi).toBe(2);
            expect(s.total_baris).toBe(3);

            // per_produk: A = 3 + 5 = 8, B = 2 (sorted desc by total)
            const perA = s.per_produk.find((p: any) => p.id === produkA.id);
            const perB = s.per_produk.find((p: any) => p.id === produkB.id);
            expect(perA.total_jumlah).toBe(8);
            expect(perB.total_jumlah).toBe(2);
            expect(s.per_produk[0].id).toBe(produkA.id); // 8 comes first

            // per_karyawan: employee total = 3 + 2 = 5
            const perEmp = s.per_karyawan.find((k: any) => k.id === employee.id);
            expect(perEmp.total_jumlah).toBe(5);

            // per_department: dept-targeted row contributes 5
            const perDept = s.per_department.find((d: any) => d.id === department.id);
            expect(perDept.total_jumlah).toBe(5);

            // pagination.total mirrors total_baris (same underlying count).
            expect(res.body.pagination).toEqual({ total: 3, page: 1, totalPages: 1 });
        });

        it('narrows results by department_id', async () => {
            const res = await request(app)
                .get('/api/inventory/laporan/konsumsi')
                .query({ department_id: department.id, dari: '2026-06-01', sampai: '2026-06-30' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].code).toBe('STK-KNS-0002');
            expect(res.body.summary.total_transaksi).toBe(1);
        });

        it('excludes rows outside the date window', async () => {
            const res = await request(app)
                .get('/api/inventory/laporan/konsumsi')
                .query({ gudang_id: gudang.id, dari: '2026-06-16', sampai: '2026-06-30' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            // 2026-06-15 (trxEmp) falls outside the window; 2026-06-20 (trxDept) stays.
            const codes = res.body.data.map((r: any) => r.code);
            expect(codes).toEqual(['STK-KNS-0002']);
        });

        it('requires authentication', async () => {
            const res = await request(app).get('/api/inventory/laporan/konsumsi');
            expect(res.status).toBe(401);
        });
    });
});
