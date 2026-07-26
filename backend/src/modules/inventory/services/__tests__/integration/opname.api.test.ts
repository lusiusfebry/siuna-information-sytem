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
import InvStok from '../../../models/Stok';
import InvTransaksi from '../../../models/Transaksi';
import InvTransaksiDetail from '../../../models/TransaksiDetail';
import InvOpnameSession from '../../../models/OpnameSession';
import InvOpnameDetail from '../../../models/OpnameDetail';
import InvOpnamePetugas from '../../../models/OpnamePetugas';
import InvOpnameSerial from '../../../models/OpnameSerial';
import InvSerialNumber from '../../../models/SerialNumber';
import Employee from '../../../../hr/models/Employee';

describe('Stock Opname API Integration (Real DB)', () => {
    let adminToken: string;
    let testUser: User;
    let kategori: InvKategori, subKategori: InvSubKategori, brand: InvBrand, uom: InvUom;
    let produkA: InvProduk, produkB: InvProduk, produkSerial: InvProduk;
    let gudangHappy: InvGudang, gudangNoSelisih: InvGudang, gudangEdge: InvGudang;
    let testEmployee: Employee;

    const auth = (r: request.Test) => r.set('Authorization', `Bearer ${adminToken}`);

    beforeAll(async () => {
        const [role] = await Role.findOrCreate({
            where: { name: 'superadmin' },
            defaults: { name: 'superadmin', display_name: 'Superadmin', is_system_role: true },
        });
        testUser = await User.create({
            nama: 'Opname Test User', nik: '999914',
            password: 'password123', role_id: role.id, is_active: true,
        });
        const userWithRole = await User.findByPk(testUser.id, { include: [{ model: Role, as: 'roleDetails' }] });
        adminToken = authService.generateToken(userWithRole!);

        kategori = await InvKategori.create({ code: 'OPN-KAT', nama: 'Opname Kategori' });
        subKategori = await InvSubKategori.create({ code: 'OPN-SUB', nama: 'Sub', kategori_id: kategori.id });
        brand = await InvBrand.create({ code: 'OPN-BR', nama: 'Brand', sub_kategori_id: subKategori.id });
        uom = await InvUom.create({ code: 'OPN-UOM', nama: 'Pcs' });
        produkA = await InvProduk.create({ code: 'OPN-PA', nama: 'Item A', brand_id: brand.id, uom_id: uom.id });
        produkB = await InvProduk.create({ code: 'OPN-PB', nama: 'Item B', brand_id: brand.id, uom_id: uom.id });
        produkSerial = await InvProduk.create({ code: 'OPN-PS', nama: 'Item Serial', brand_id: brand.id, uom_id: uom.id, has_serial_number: true } as any);
        testEmployee = await Employee.create({
            nama_lengkap: 'Petugas Opname Test',
            nomor_induk_karyawan: 'NIK-OPN-001',
            is_draft: false,
        } as any);
        gudangHappy = await InvGudang.create({ code: 'OPN-GH', nama: 'Gudang Happy' });
        gudangNoSelisih = await InvGudang.create({ code: 'OPN-GN', nama: 'Gudang NoSelisih' });
        gudangEdge = await InvGudang.create({ code: 'OPN-GE', nama: 'Gudang Edge' });
    });

    afterAll(async () => {
        const gudangIds = [gudangHappy?.id, gudangNoSelisih?.id, gudangEdge?.id].filter(Boolean) as number[];
        const sessions = await InvOpnameSession.findAll({ where: { gudang_id: gudangIds }, attributes: ['id'], paranoid: false });
        const sessionIds = sessions.map((s) => s.id);
        if (sessionIds.length > 0) {
            const details = await InvOpnameDetail.findAll({ where: { opname_session_id: sessionIds }, attributes: ['id'] });
            const detailIds = details.map((d) => d.id);
            if (detailIds.length > 0) {
                await InvOpnameSerial.destroy({ where: { opname_detail_id: detailIds }, force: true });
            }
            await InvOpnamePetugas.destroy({ where: { opname_session_id: sessionIds }, force: true });
            await InvOpnameDetail.destroy({ where: { opname_session_id: sessionIds }, force: true });
            await InvOpnameSession.destroy({ where: { id: sessionIds }, force: true });
        }
        const trxRows = await InvTransaksi.findAll({ where: { created_by: testUser.id }, attributes: ['id'] });
        const trxIds = trxRows.map((r) => r.id);
        if (trxIds.length > 0) {
            await InvTransaksiDetail.destroy({ where: { transaksi_id: trxIds }, force: true });
            await InvTransaksi.destroy({ where: { id: trxIds }, force: true });
        }
        // Serial number unit dibuat oleh test serial/tag; hapus sebelum produk & employee.
        const produkIds = [produkA?.id, produkB?.id, produkSerial?.id].filter(Boolean) as number[];
        if (produkIds.length > 0) await InvSerialNumber.destroy({ where: { produk_id: produkIds }, force: true });
        if (gudangIds.length > 0) await InvStok.destroy({ where: { gudang_id: gudangIds }, force: true });
        if (produkA) await InvProduk.destroy({ where: { id: produkA.id }, force: true });
        if (produkB) await InvProduk.destroy({ where: { id: produkB.id }, force: true });
        if (produkSerial) await InvProduk.destroy({ where: { id: produkSerial.id }, force: true });
        if (gudangHappy) await InvGudang.destroy({ where: { id: gudangIds }, force: true });
        if (uom) await InvUom.destroy({ where: { id: uom.id }, force: true });
        if (brand) await InvBrand.destroy({ where: { id: brand.id }, force: true });
        if (subKategori) await InvSubKategori.destroy({ where: { id: subKategori.id }, force: true });
        if (kategori) await InvKategori.destroy({ where: { id: kategori.id }, force: true });
        if (testEmployee) await Employee.destroy({ where: { id: testEmployee.id }, force: true });
        if (testUser) await User.destroy({ where: { nik: '999914' } });
    });

    // Bersihkan sesi opname yang tersisa sebelum tiap test agar guard "gudang sudah
    // punya sesi aktif" tidak bocor antar-test bila ada assertion yang gagal di tengah.
    beforeEach(async () => {
        const gudangIds = [gudangHappy?.id, gudangNoSelisih?.id, gudangEdge?.id].filter(Boolean) as number[];
        if (gudangIds.length === 0) return;
        const sessions = await InvOpnameSession.findAll({ where: { gudang_id: gudangIds }, attributes: ['id'], paranoid: false });
        const ids = sessions.map((s) => s.id);
        if (ids.length > 0) {
            const details = await InvOpnameDetail.findAll({ where: { opname_session_id: ids }, attributes: ['id'] });
            const detailIds = details.map((d) => d.id);
            if (detailIds.length > 0) {
                await InvOpnameSerial.destroy({ where: { opname_detail_id: detailIds }, force: true });
            }
            await InvOpnamePetugas.destroy({ where: { opname_session_id: ids }, force: true });
            await InvOpnameDetail.destroy({ where: { opname_session_id: ids }, force: true });
            await InvOpnameSession.destroy({ where: { id: ids }, force: true });
        }
        // Serial unit direset agar snapshot serial tiap test bersih.
        const produkIds = [produkA?.id, produkB?.id, produkSerial?.id].filter(Boolean) as number[];
        if (produkIds.length > 0) await InvSerialNumber.destroy({ where: { produk_id: produkIds }, force: true });
        await InvStok.destroy({ where: { gudang_id: gudangIds }, force: true });
    });

    describe('Alur lengkap: create → start → input → finish → approve', () => {
        it('snapshot benar, selisih dihitung, dan stok akhir = jumlah fisik setelah approve', async () => {
            // Seed stok awal: A=100, B=50 di gudang happy
            await InvStok.create({ produk_id: produkA.id, gudang_id: gudangHappy.id, uom_id: uom.id, jumlah: 100 });
            await InvStok.create({ produk_id: produkB.id, gudang_id: gudangHappy.id, uom_id: uom.id, jumlah: 50 });

            // 1. create
            const createRes = await auth(request(app).post('/api/inventory/opname'))
                .send({ gudang_id: gudangHappy.id, catatan: 'Opname bulanan', petugas_ids: [testEmployee.id] });
            expect(createRes.status).toBe(201);
            expect(createRes.body.data.status).toBe('Draft');
            expect(createRes.body.data.kode).toMatch(/^OPN-\d{4}-\d{2}-\d{3}$/);
            expect(createRes.body.data.petugas).toHaveLength(1);
            expect(createRes.body.data.petugas[0].karyawan_id).toBe(testEmployee.id);
            const sessionId = createRes.body.data.id;

            // 2. start → snapshot dari stok gudang
            const startRes = await auth(request(app).post(`/api/inventory/opname/${sessionId}/start`));
            expect(startRes.status).toBe(200);
            expect(startRes.body.data.status).toBe('Berjalan');
            expect(startRes.body.data.tanggal_mulai).toBeTruthy();
            const detail = startRes.body.data.detail as any[];
            expect(detail).toHaveLength(2);
            const snapA = detail.find((d) => d.produk_id === produkA.id);
            const snapB = detail.find((d) => d.produk_id === produkB.id);
            expect(snapA.jumlah_sistem_snapshot).toBe(100);
            expect(snapB.jumlah_sistem_snapshot).toBe(50);
            expect(snapA.jumlah_fisik).toBeNull();

            // 3. input fisik: A kurang 20 (80), B pas (50)
            const inputA = await auth(request(app).put(`/api/inventory/opname/${sessionId}/detail`))
                .send({ produk_id: produkA.id, jumlah_fisik: 80, catatan: 'Ada yang hilang' });
            expect(inputA.status).toBe(200);
            expect(inputA.body.data.selisih).toBe(-20);

            const inputB = await auth(request(app).put(`/api/inventory/opname/${sessionId}/detail`))
                .send({ produk_id: produkB.id, jumlah_fisik: 50 });
            expect(inputB.status).toBe(200);
            expect(inputB.body.data.selisih).toBe(0);

            // 4. finish
            const finishRes = await auth(request(app).post(`/api/inventory/opname/${sessionId}/finish`));
            expect(finishRes.status).toBe(200);
            expect(finishRes.body.data.status).toBe('Selesai');

            // 5. approve → adjustment hanya untuk A (berselisih)
            const approveRes = await auth(request(app).post(`/api/inventory/opname/${sessionId}/approve`));
            expect(approveRes.status).toBe(200);
            expect(approveRes.body.data.status).toBe('Approved');
            expect(approveRes.body.data.transaksi_id).toBeTruthy();

            // Transaksi adjustment: 1 baris detail saja (produk A), sub_tipe Opname
            const trx = await InvTransaksi.findByPk(approveRes.body.data.transaksi_id, { include: [{ model: InvTransaksiDetail, as: 'details' }] });
            expect(trx?.sub_tipe).toBe('Opname');
            expect(trx?.approval_status).toBe('Approved');
            expect((trx as any)?.details).toHaveLength(1);

            // Stok akhir = jumlah fisik: A=80, B=50 (tak berubah)
            const stokA = await InvStok.findOne({ where: { produk_id: produkA.id, gudang_id: gudangHappy.id } });
            const stokB = await InvStok.findOne({ where: { produk_id: produkB.id, gudang_id: gudangHappy.id } });
            expect(stokA?.jumlah).toBe(80);
            expect(stokB?.jumlah).toBe(50);
        });
    });

    describe('approve tanpa selisih', () => {
        it('tidak membuat transaksi adjustment dan stok tidak berubah', async () => {
            await InvStok.create({ produk_id: produkA.id, gudang_id: gudangNoSelisih.id, uom_id: uom.id, jumlah: 30 });

            const createRes = await auth(request(app).post('/api/inventory/opname')).send({ gudang_id: gudangNoSelisih.id, petugas_ids: [testEmployee.id] });
            const sessionId = createRes.body.data.id;
            await auth(request(app).post(`/api/inventory/opname/${sessionId}/start`));
            await auth(request(app).put(`/api/inventory/opname/${sessionId}/detail`)).send({ produk_id: produkA.id, jumlah_fisik: 30 });
            await auth(request(app).post(`/api/inventory/opname/${sessionId}/finish`));
            const approveRes = await auth(request(app).post(`/api/inventory/opname/${sessionId}/approve`));

            expect(approveRes.status).toBe(200);
            expect(approveRes.body.data.transaksi_id).toBeNull();
            const stokA = await InvStok.findOne({ where: { produk_id: produkA.id, gudang_id: gudangNoSelisih.id } });
            expect(stokA?.jumlah).toBe(30);
        });
    });
    describe('Penguncian gudang & transisi ilegal', () => {
        it('gudang dengan sesi Berjalan menolak transaksi stok biasa (409)', async () => {
            await InvStok.create({ produk_id: produkA.id, gudang_id: gudangEdge.id, uom_id: uom.id, jumlah: 10 });
            const createRes = await auth(request(app).post('/api/inventory/opname')).send({ gudang_id: gudangEdge.id, petugas_ids: [testEmployee.id] });
            const sessionId = createRes.body.data.id;
            await auth(request(app).post(`/api/inventory/opname/${sessionId}/start`));

            // Transaksi masuk ke gudang yang sedang di-opname harus ditolak
            const trxRes = await auth(request(app).post('/api/inventory/transaksi')).send({
                tipe: 'Masuk', sub_tipe: 'Supplier', tanggal: '2026-07-20',
                gudang_id: gudangEdge.id, supplier_nama: 'PT Test',
                details: [{ produk_id: produkA.id, uom_id: uom.id, jumlah: 5 }],
            });
            expect(trxRes.status).toBe(409);

            // Bereskan: batalkan sesi agar gudang terbuka lagi
            await auth(request(app).post(`/api/inventory/opname/${sessionId}/cancel`)).send({ reason: 'Selesai pengujian lock' });
        });

        it('menolak start pada sesi yang bukan Draft', async () => {
            const createRes = await auth(request(app).post('/api/inventory/opname')).send({ gudang_id: gudangHappy.id, petugas_ids: [testEmployee.id] });
            const sessionId = createRes.body.data.id;
            await auth(request(app).post(`/api/inventory/opname/${sessionId}/start`));
            const secondStart = await auth(request(app).post(`/api/inventory/opname/${sessionId}/start`));
            expect(secondStart.status).toBe(400);
            await auth(request(app).post(`/api/inventory/opname/${sessionId}/cancel`)).send({ reason: 'cleanup transisi' });
        });

        it('menolak approve pada sesi yang belum Selesai', async () => {
            const createRes = await auth(request(app).post('/api/inventory/opname')).send({ gudang_id: gudangNoSelisih.id, petugas_ids: [testEmployee.id] });
            const sessionId = createRes.body.data.id;
            const approveRes = await auth(request(app).post(`/api/inventory/opname/${sessionId}/approve`));
            expect(approveRes.status).toBe(400);
            await auth(request(app).post(`/api/inventory/opname/${sessionId}/cancel`)).send({ reason: 'cleanup approve guard' });
        });

        it('menolak input fisik saat sesi masih Draft', async () => {
            const createRes = await auth(request(app).post('/api/inventory/opname')).send({ gudang_id: gudangHappy.id, petugas_ids: [testEmployee.id] });
            const sessionId = createRes.body.data.id;
            const inputRes = await auth(request(app).put(`/api/inventory/opname/${sessionId}/detail`))
                .send({ produk_id: produkA.id, jumlah_fisik: 5 });
            expect(inputRes.status).toBe(400);
            await auth(request(app).post(`/api/inventory/opname/${sessionId}/cancel`)).send({ reason: 'cleanup draft input' });
        });

        it('menolak sesi baru bila gudang sudah punya sesi aktif (409)', async () => {
            const first = await auth(request(app).post('/api/inventory/opname')).send({ gudang_id: gudangHappy.id, petugas_ids: [testEmployee.id] });
            const firstId = first.body.data.id;
            const second = await auth(request(app).post('/api/inventory/opname')).send({ gudang_id: gudangHappy.id, petugas_ids: [testEmployee.id] });
            expect(second.status).toBe(409);
            await auth(request(app).post(`/api/inventory/opname/${firstId}/cancel`)).send({ reason: 'cleanup duplikat' });
        });
    });

    describe('Validasi & otorisasi', () => {
        it('menolak create tanpa gudang_id (400)', async () => {
            const res = await auth(request(app).post('/api/inventory/opname')).send({ catatan: 'tanpa gudang' });
            expect(res.status).toBe(400);
        });

        it('menolak cancel dengan reason terlalu pendek (400)', async () => {
            const createRes = await auth(request(app).post('/api/inventory/opname')).send({ gudang_id: gudangNoSelisih.id, petugas_ids: [testEmployee.id] });
            const sessionId = createRes.body.data.id;
            const res = await auth(request(app).post(`/api/inventory/opname/${sessionId}/cancel`)).send({ reason: 'x' });
            expect(res.status).toBe(400);
            await auth(request(app).post(`/api/inventory/opname/${sessionId}/cancel`)).send({ reason: 'cleanup reason pendek' });
        });

        it('menolak akses tanpa autentikasi (401)', async () => {
            const res = await request(app).get('/api/inventory/opname');
            expect(res.status).toBe(401);
        });

        it('menolak create tanpa petugas_ids (400)', async () => {
            const res = await auth(request(app).post('/api/inventory/opname')).send({ gudang_id: gudangHappy.id, petugas_ids: [] });
            expect(res.status).toBe(400);
        });
    });

    describe('Snapshot & toggle serial', () => {
        it('start membuat detail Serial dari unit di gudang; toggle "Tidak Ada" me-recalc jumlah_fisik & selisih', async () => {
            // Seed dua unit serial produkSerial di gudang happy (status boleh masuk snapshot).
            await InvSerialNumber.create({
                produk_id: produkSerial.id, gudang_id: gudangHappy.id,
                serial_number: 'SN-001', status: 'Tersedia',
            } as any);
            await InvSerialNumber.create({
                produk_id: produkSerial.id, gudang_id: gudangHappy.id,
                serial_number: 'SN-002', status: 'Digunakan',
            } as any);

            const createRes = await auth(request(app).post('/api/inventory/opname'))
                .send({ gudang_id: gudangHappy.id, petugas_ids: [testEmployee.id] });
            const sessionId = createRes.body.data.id;

            const startRes = await auth(request(app).post(`/api/inventory/opname/${sessionId}/start`));
            expect(startRes.status).toBe(200);
            const detail = startRes.body.data.detail as any[];
            const detSerial = detail.find((d) => d.produk_id === produkSerial.id);
            expect(detSerial).toBeTruthy();
            expect(detSerial.tipe_hitung).toBe('Serial');
            expect(detSerial.jumlah_sistem_snapshot).toBe(2);
            expect(detSerial.serials).toHaveLength(2);

            // Toggle satu unit jadi "Tidak Ada" → jumlah_fisik = 1, selisih = -1.
            const targetSerial = detSerial.serials.find((s: any) => s.serial_number === 'SN-001');
            const toggleRes = await auth(request(app).put(`/api/inventory/opname/${sessionId}/serial`))
                .send({ opname_serial_id: targetSerial.id, kondisi: 'Tidak Ada', catatan: 'Unit hilang' });
            expect(toggleRes.status).toBe(200);
            expect(toggleRes.body.data.detail.jumlah_fisik).toBe(1);
            expect(toggleRes.body.data.detail.selisih).toBe(-1);

            await auth(request(app).post(`/api/inventory/opname/${sessionId}/cancel`)).send({ reason: 'cleanup serial toggle' });
        });
    });
});
