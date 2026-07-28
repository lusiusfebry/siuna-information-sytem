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
import InvSerialNumber from '../../../models/SerialNumber';

// Regresi INV: transaksi keluar/Transfer Gudang untuk produk ber-serial harus menolak
// bila jumlah serial number != kuantitas. Sebelumnya STK-0008 lolos dengan jumlah=1 tapi
// 4 serial, membuat inv_stok dan inv_serial_number melenceng antar-gudang.
describe('Transaksi serial-count guard (Real DB)', () => {
    let adminToken: string;
    let testUser: User;
    let kategori: InvKategori, subKategori: InvSubKategori, brand: InvBrand;
    let uom: InvUom, produk: InvProduk, gudangA: InvGudang, gudangB: InvGudang;
    let seedMasuk: InvTransaksi;

    beforeAll(async () => {
        const [role] = await Role.findOrCreate({
            where: { name: 'superadmin' },
            defaults: { name: 'superadmin', display_name: 'Superadmin', is_system_role: true },
        });
        testUser = await User.create({
            nama: 'Serial Count Test User', nik: '999914',
            password: 'password123', role_id: role.id, is_active: true,
        });
        const userWithRole = await User.findByPk(testUser.id, {
            include: [{ model: Role, as: 'roleDetails' }],
        });
        adminToken = authService.generateToken(userWithRole!);

        kategori = await InvKategori.create({ code: 'SC-KAT', nama: 'Serial Count Kategori' });
        subKategori = await InvSubKategori.create({ code: 'SC-SUB', nama: 'Sub', kategori_id: kategori.id });
        brand = await InvBrand.create({ code: 'SC-BR', nama: 'Brand', sub_kategori_id: subKategori.id });
        uom = await InvUom.create({ code: 'SC-UOM', nama: 'Unit' });
        produk = await InvProduk.create({
            code: 'SC-P', nama: 'AC Serial Item', brand_id: brand.id, uom_id: uom.id,
            has_serial_number: true,
        });
        gudangA = await InvGudang.create({ code: 'SC-GDA', nama: 'Gudang Asal' });
        gudangB = await InvGudang.create({ code: 'SC-GDB', nama: 'Gudang Tujuan' });

        // Seed: 2 unit tersedia di gudang asal, dengan 2 serial number nyata.
        seedMasuk = await InvTransaksi.create({
            code: 'STM-9000', tipe: 'Masuk', sub_tipe: 'Supplier',
            tanggal: '2026-07-01', gudang_id: gudangA.id,
            created_by: testUser.id, approval_status: 'Approved',
        });
        await InvStok.create({ produk_id: produk.id, gudang_id: gudangA.id, uom_id: uom.id, jumlah: 2 });
        for (const sn of ['SC-SN-0001', 'SC-SN-0002']) {
            await InvSerialNumber.create({
                produk_id: produk.id, serial_number: sn, gudang_id: gudangA.id,
                karyawan_id: null, status: 'Tersedia',
                transaksi_masuk_id: seedMasuk.id, transaksi_terakhir_id: seedMasuk.id,
            });
        }
    });

    afterAll(async () => {
        await InvSerialNumber.destroy({ where: { produk_id: produk?.id ?? 0 }, force: true });
        const transaksiRows = await InvTransaksi.findAll({ where: { created_by: testUser.id }, attributes: ['id'] });
        const transaksiIds = transaksiRows.map((r) => r.id);
        if (transaksiIds.length > 0) {
            await InvTransaksiDetail.destroy({ where: { transaksi_id: transaksiIds }, force: true });
            await InvTransaksi.destroy({ where: { id: transaksiIds }, force: true });
        }
        await InvStok.destroy({ where: { produk_id: produk?.id ?? 0 }, force: true });
        if (produk) await InvProduk.destroy({ where: { id: produk.id }, force: true });
        if (gudangA) await InvGudang.destroy({ where: { id: gudangA.id }, force: true });
        if (gudangB) await InvGudang.destroy({ where: { id: gudangB.id }, force: true });
        if (uom) await InvUom.destroy({ where: { id: uom.id }, force: true });
        if (brand) await InvBrand.destroy({ where: { id: brand.id }, force: true });
        if (subKategori) await InvSubKategori.destroy({ where: { id: subKategori.id }, force: true });
        if (kategori) await InvKategori.destroy({ where: { id: kategori.id }, force: true });
        if (testUser) await User.destroy({ where: { nik: '999914' } });
    });

    it('menolak Transfer Gudang bila jumlah serial != kuantitas (jumlah=1, 2 serial)', async () => {
        const res = await request(app)
            .post('/api/inventory/transaksi')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                tipe: 'Keluar', sub_tipe: 'Transfer Gudang', tanggal: '2026-07-10',
                gudang_id: gudangA.id, gudang_tujuan_id: gudangB.id,
                details: [{
                    produk_id: produk.id, uom_id: uom.id, jumlah: 1,
                    serial_numbers: ['SC-SN-0001', 'SC-SN-0002'],
                }],
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/serial\/tag number/i);
        // Tidak ada transaksi Transfer Gudang yang terlanjur dibuat.
        const created = await InvTransaksi.count({ where: { sub_tipe: 'Transfer Gudang', created_by: testUser.id } });
        expect(created).toBe(0);
    });

    it('menerima Transfer Gudang bila jumlah serial == kuantitas (jumlah=2, 2 serial) dan inv_stok tetap sinkron', async () => {
        const res = await request(app)
            .post('/api/inventory/transaksi')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                tipe: 'Keluar', sub_tipe: 'Transfer Gudang', tanggal: '2026-07-11',
                gudang_id: gudangA.id, gudang_tujuan_id: gudangB.id,
                details: [{
                    produk_id: produk.id, uom_id: uom.id, jumlah: 2,
                    serial_numbers: ['SC-SN-0001', 'SC-SN-0002'],
                }],
            });

        expect([200, 201]).toContain(res.status);

        // Transfer Gudang butuh approval; setujui agar efek stok/serial diterapkan.
        const trxId = res.body.data.id;
        const approve = await request(app)
            .post(`/api/inventory/transaksi/${trxId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send();
        expect(approve.status).toBe(200);

        // Setelah transfer: kedua serial pindah ke gudang tujuan, dan inv_stok agregat
        // per gudang cocok dengan jumlah serial 'Tersedia' di gudang itu.
        for (const g of [gudangA, gudangB]) {
            const stok = await InvStok.findOne({ where: { produk_id: produk.id, gudang_id: g.id } });
            const serialCount = await InvSerialNumber.count({
                where: { produk_id: produk.id, gudang_id: g.id, status: 'Tersedia' },
            });
            expect(stok?.jumlah ?? 0).toBe(serialCount);
        }
        const stokTujuan = await InvStok.findOne({ where: { produk_id: produk.id, gudang_id: gudangB.id } });
        expect(stokTujuan?.jumlah).toBe(2);
    });
});
