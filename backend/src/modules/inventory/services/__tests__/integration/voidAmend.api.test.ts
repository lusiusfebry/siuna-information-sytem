import request from 'supertest';
import { app } from '../../../../../index';
import User from '../../../../auth/models/User';
import { Role } from '../../../../auth/models/Role';
import authService from '../../../../auth/services/auth.service';
import InvKategori from '../../../models/Kategori';
import InvSubKategori from '../../../models/SubKategori';
import InvBrand from '../../../models/Brand';
import InvUom from '../../../models/Uom';
import InvProduk from '../../../models/Produk';
import InvGudang from '../../../models/Gudang';
import InvTransaksi from '../../../models/Transaksi';
import InvTransaksiDetail from '../../../models/TransaksiDetail';
import InvStok from '../../../models/Stok';

describe('Void/Amend API Integration (Real DB)', () => {
    let adminToken: string;
    let testUser: User;
    let kategori: InvKategori, subKategori: InvSubKategori, brand: InvBrand;
    let uom: InvUom, produk: InvProduk, gudang: InvGudang;

    beforeAll(async () => {
        const [role] = await Role.findOrCreate({
            where: { name: 'superadmin' },
            defaults: { name: 'superadmin', display_name: 'Superadmin', is_system_role: true },
        });
        testUser = await User.create({
            nama: 'Void/Amend Test User', nik: '999913',
            password: 'password123', role_id: role.id, is_active: true,
        });
        const userWithRole = await User.findByPk(testUser.id, {
            include: [{ model: Role, as: 'roleDetails' }],
        });
        adminToken = authService.generateToken(userWithRole!);

        kategori = await InvKategori.create({ code: 'VA-KAT', nama: 'Void/Amend Kategori' });
        subKategori = await InvSubKategori.create({ code: 'VA-SUB', nama: 'Sub', kategori_id: kategori.id });
        brand = await InvBrand.create({ code: 'VA-BR', nama: 'Brand', sub_kategori_id: subKategori.id });
        uom = await InvUom.create({ code: 'VA-UOM', nama: 'Pcs' });
        produk = await InvProduk.create({
            code: 'VA-P', nama: 'Test Item', brand_id: brand.id, uom_id: uom.id,
        });
        gudang = await InvGudang.create({ code: 'VA-GDG', nama: 'Test Gudang' });
    });

    afterAll(async () => {
        const transaksiRows = await InvTransaksi.findAll({ where: { created_by: testUser.id }, attributes: ['id'] });
        const transaksiIds = transaksiRows.map((r) => r.id);
        if (transaksiIds.length > 0) {
            await InvTransaksiDetail.destroy({ where: { transaksi_id: transaksiIds }, force: true });
            await InvTransaksi.destroy({ where: { id: transaksiIds }, force: true });
        }
        await InvStok.destroy({ where: { gudang_id: gudang?.id ?? 0 }, force: true });
        if (produk) await InvProduk.destroy({ where: { id: produk.id }, force: true });
        if (gudang) await InvGudang.destroy({ where: { id: gudang.id }, force: true });
        if (uom) await InvUom.destroy({ where: { id: uom.id }, force: true });
        if (brand) await InvBrand.destroy({ where: { id: brand.id }, force: true });
        if (subKategori) await InvSubKategori.destroy({ where: { id: subKategori.id }, force: true });
        if (kategori) await InvKategori.destroy({ where: { id: kategori.id }, force: true });
        if (testUser) await User.destroy({ where: { nik: '999913' } });
    });

    describe('POST /transaksi/:id/void', () => {
        it('membatalkan transaksi Pending dan mencatat jejak', async () => {
            const trx = await InvTransaksi.create({
                code: 'STK-VA-0001', tipe: 'Keluar', sub_tipe: 'Ke Karyawan',
                tanggal: '2026-07-01', gudang_id: gudang.id,
                karyawan_id: null, department_id: null,
                created_by: testUser.id, approval_status: 'Pending',
            });
            await InvTransaksiDetail.create({
                transaksi_id: trx.id, produk_id: produk.id, uom_id: uom.id, jumlah: 5,
            });

            const res = await request(app)
                .post(`/api/inventory/transaksi/${trx.id}/void`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ reason: 'Salah input karyawan tujuan' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            const refreshed = await InvTransaksi.findByPk(trx.id);
            expect(refreshed?.approval_status).toBe('Voided');
            expect(refreshed?.void_reason).toBe('Salah input karyawan tujuan');
        });

        it('menolak reason yang terlalu pendek', async () => {
            const res = await request(app)
                .post(`/api/inventory/transaksi/1/void`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ reason: 'ok' });
            expect(res.status).toBe(400);
        });

        it('menolak tanpa auth', async () => {
            const res = await request(app).post(`/api/inventory/transaksi/1/void`);
            expect(res.status).toBe(403);
        });
    });

    describe('POST /transaksi/:id/amend', () => {
        it('koreksi transaksi Supplier + koreksi.details: reversal + koreksi terpersist, net stok benar', async () => {
            const trx = await InvTransaksi.create({
                code: 'STK-VA-0100', tipe: 'Masuk', sub_tipe: 'Supplier',
                tanggal: '2026-07-01', gudang_id: gudang.id,
                created_by: testUser.id, approval_status: 'Approved',
            });
            await InvTransaksiDetail.create({
                transaksi_id: trx.id, produk_id: produk.id, uom_id: uom.id, jumlah: 100,
            });
            await InvStok.create({ produk_id: produk.id, gudang_id: gudang.id, uom_id: uom.id, jumlah: 100 });

            const res = await request(app)
                .post(`/api/inventory/transaksi/${trx.id}/amend`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    reason: 'Salah input, seharusnya 50 bukan 100',
                    koreksi: { details: [{ produk_id: produk.id, uom_id: uom.id, jumlah: 50 }] },
                });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('reversal');
            expect(res.body.data).toHaveProperty('koreksi');

            // Stok: 100 (asli) - 100 (reversal) + 50 (koreksi) = 50
            const stok = await InvStok.findOne({ where: { produk_id: produk.id, gudang_id: gudang.id } });
            expect(stok?.jumlah).toBe(50);
        });
    });
});
