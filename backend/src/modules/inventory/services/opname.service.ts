import { Op, Transaction } from 'sequelize';
import puppeteer from 'puppeteer';
import sequelize from '../../../config/database';
import { AppError } from '../../../shared/utils/errorHandler';
import InvOpnameSession from '../models/OpnameSession';
import InvOpnameDetail from '../models/OpnameDetail';
import InvOpnamePetugas from '../models/OpnamePetugas';
import InvOpnameSerial from '../models/OpnameSerial';
import InvStok from '../models/Stok';
import InvGudang from '../models/Gudang';
import InvProduk from '../models/Produk';
import InvUom from '../models/Uom';
import InvSerialNumber from '../models/SerialNumber';
import InvTransaksi from '../models/Transaksi';
import Employee from '../../hr/models/Employee';
import Department from '../../hr/models/Department';
import User from '../../auth/models/User';
import stokService from './stok.service';

interface CreateSessionPayload {
    gudang_id: number;
    catatan?: string;
    petugas_ids: number[];
}

interface UpsertDetailPayload {
    produk_id: number;
    jumlah_fisik: number | null;
    catatan?: string;
}

interface UpsertSerialPayload {
    opname_serial_id: number;
    kondisi: 'Ada' | 'Tidak Ada';
    catatan?: string | null;
}

// Include karyawan + manager sebagai atasan (self-ref di HR associations).
const employeeWithManager = {
    model: Employee,
    as: 'karyawan',
    attributes: ['id', 'nama_lengkap', 'nomor_induk_karyawan'],
    include: [
        { model: Employee, as: 'manager', attributes: ['id', 'nama_lengkap', 'nomor_induk_karyawan'] },
    ],
};

const gudangWithPenanggungJawab = {
    model: InvGudang,
    as: 'gudang',
    attributes: ['id', 'code', 'nama', 'department_id', 'penanggung_jawab_id'],
    include: [
        {
            model: Employee,
            as: 'penanggung_jawab',
            attributes: ['id', 'nama_lengkap', 'nomor_induk_karyawan'],
            include: [
                { model: Employee, as: 'manager', attributes: ['id', 'nama_lengkap', 'nomor_induk_karyawan'] },
            ],
        },
        { model: Department, as: 'department', attributes: ['id', 'code', 'nama'] },
    ],
};

class OpnameService {
    // Kode sesi: OPN-{YYYY}-{MM}-{urut 3 digit per bulan}. Di-serialize dengan
    // advisory lock (pola generateCode di stok.service) agar tidak bentrok.
    private async generateKode(t: Transaction): Promise<string> {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `OPN-${year}-${month}`;

        await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:k))', {
            replacements: { k: `inv_opname_kode_${prefix}` },
            transaction: t,
        });

        const last = await InvOpnameSession.findOne({
            where: { kode: { [Op.like]: `${prefix}-%` } },
            order: [['kode', 'DESC']],
            transaction: t,
            paranoid: false,
        });

        let next = 1;
        if (last) {
            const parts = last.kode.split('-');
            const n = parseInt(parts[3], 10);
            if (!isNaN(n)) next = n + 1;
        }

        return `${prefix}-${String(next).padStart(3, '0')}`;
    }

    async isGudangLocked(gudangId: number): Promise<boolean> {
        const count = await InvOpnameSession.count({
            where: { gudang_id: gudangId, status: 'Berjalan' },
        });
        return count > 0;
    }

    async listSessions(filters: { gudang_id?: number; status?: string }) {
        const where: any = {};
        if (filters.gudang_id) where.gudang_id = filters.gudang_id;
        if (filters.status) where.status = filters.status;

        return InvOpnameSession.findAll({
            where,
            include: [
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                { model: User, as: 'creator', attributes: ['id', 'nama'] },
                { model: User, as: 'approver', attributes: ['id', 'nama'] },
            ],
            order: [['created_at', 'DESC']],
        });
    }

    async getSession(id: number) {
        const session = await InvOpnameSession.findByPk(id, {
            include: [
                gudangWithPenanggungJawab,
                { model: User, as: 'creator', attributes: ['id', 'nama'] },
                { model: User, as: 'approver', attributes: ['id', 'nama'] },
                { model: InvOpnamePetugas, as: 'petugas', include: [employeeWithManager] },
                {
                    model: InvOpnameDetail, as: 'detail',
                    include: [
                        {
                            model: InvProduk, as: 'produk',
                            attributes: ['id', 'code', 'nama', 'has_serial_number', 'has_tag_number'],
                        },
                        { model: InvOpnameSerial, as: 'serials' },
                    ],
                },
                { model: InvTransaksi, as: 'transaksi', attributes: ['id', 'code'] },
            ],
            order: [
                [{ model: InvOpnameDetail, as: 'detail' } as any, 'id', 'ASC'],
                [{ model: InvOpnameDetail, as: 'detail' } as any, { model: InvOpnameSerial, as: 'serials' } as any, 'id', 'ASC'],
            ],
        });
        if (!session) throw new AppError('Sesi opname tidak ditemukan', 404);
        return session;
    }

    async createSession(payload: CreateSessionPayload, userId: number) {
        const t = await sequelize.transaction();
        try {
            const gudang = await InvGudang.findByPk(payload.gudang_id, { transaction: t });
            if (!gudang) throw new AppError('Gudang tidak ditemukan', 404);

            if (!Array.isArray(payload.petugas_ids) || payload.petugas_ids.length === 0) {
                throw new AppError('Minimal 1 petugas opname wajib dipilih', 400);
            }
            const petugasIds = Array.from(new Set(payload.petugas_ids.map(Number).filter((n) => Number.isFinite(n) && n > 0)));
            if (petugasIds.length === 0) {
                throw new AppError('Petugas opname tidak valid', 400);
            }

            // Validasi petugas berada di department gudang (kecuali gudang belum
            // punya department — biarkan lolos supaya tidak menghambat).
            if (gudang.department_id) {
                const validCount = await Employee.count({
                    where: { id: petugasIds, department_id: gudang.department_id },
                    transaction: t,
                });
                if (validCount !== petugasIds.length) {
                    throw new AppError(
                        'Semua petugas harus berasal dari department gudang',
                        400,
                    );
                }
            }

            const existing = await InvOpnameSession.count({
                where: { gudang_id: payload.gudang_id, status: ['Draft', 'Berjalan', 'Selesai'] },
                transaction: t,
            });
            if (existing > 0) {
                throw new AppError('Gudang ini sudah memiliki sesi opname yang sedang aktif', 409);
            }

            const kode = await this.generateKode(t);
            const session = await InvOpnameSession.create({
                kode,
                gudang_id: payload.gudang_id,
                status: 'Draft',
                catatan: payload.catatan ?? null,
                created_by: userId,
            }, { transaction: t });

            await InvOpnamePetugas.bulkCreate(
                petugasIds.map((karyawan_id) => ({
                    opname_session_id: session.id,
                    karyawan_id,
                })),
                { transaction: t },
            );

            await t.commit();
            return this.getSession(session.id);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async startSession(id: number, userId: number) {
        const t = await sequelize.transaction();
        try {
            const session = await InvOpnameSession.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
            if (!session) throw new AppError('Sesi opname tidak ditemukan', 404);
            if (session.status !== 'Draft') {
                throw new AppError('Hanya sesi berstatus Draft yang bisa dimulai', 400);
            }

            // Snapshot produk non-serial: satu detail per produk, jumlah dari inv_stok.
            const stokList = await InvStok.findAll({
                where: { gudang_id: session.gudang_id },
                include: [{
                    model: InvProduk, as: 'produk',
                    attributes: ['id', 'has_serial_number', 'has_tag_number'],
                }],
                transaction: t,
            });

            for (const stok of stokList) {
                const p: any = (stok as any).produk;
                const isSerial = !!(p && (p.has_serial_number || p.has_tag_number));
                if (isSerial) continue; // ditangani di loop serial di bawah
                await InvOpnameDetail.upsert({
                    opname_session_id: session.id,
                    produk_id: stok.produk_id,
                    jumlah_sistem_snapshot: stok.jumlah,
                    jumlah_fisik: null,
                    selisih: null,
                    tipe_hitung: 'Fisik',
                }, { transaction: t } as any);
            }

            // Snapshot produk ber-serial: kumpulkan semua unit yang lokasinya di gudang ini.
            const serialUnits = await InvSerialNumber.findAll({
                where: {
                    gudang_id: session.gudang_id,
                    status: { [Op.in]: ['Tersedia', 'Digunakan'] },
                },
                include: [{
                    model: InvProduk, as: 'produk',
                    attributes: ['id', 'has_serial_number', 'has_tag_number'],
                }],
                transaction: t,
            });

            // Kelompokkan per produk agar tercipta satu InvOpnameDetail per produk ber-serial.
            const perProduk = new Map<number, InvSerialNumber[]>();
            for (const unit of serialUnits) {
                const p: any = (unit as any).produk;
                if (!p) continue;
                if (!(p.has_serial_number || p.has_tag_number)) continue;
                const arr = perProduk.get(unit.produk_id) ?? [];
                arr.push(unit);
                perProduk.set(unit.produk_id, arr);
            }

            for (const [produkId, units] of perProduk) {
                // Upsert detail; ambil id-nya via findOne setelah upsert (Sequelize returning tidak konsisten di semua versi).
                await InvOpnameDetail.upsert({
                    opname_session_id: session.id,
                    produk_id: produkId,
                    jumlah_sistem_snapshot: units.length,
                    jumlah_fisik: null,
                    selisih: null,
                    tipe_hitung: 'Serial',
                }, { transaction: t } as any);

                const detail = await InvOpnameDetail.findOne({
                    where: { opname_session_id: session.id, produk_id: produkId },
                    transaction: t,
                });
                if (!detail) continue;

                for (const unit of units) {
                    await InvOpnameSerial.upsert({
                        opname_detail_id: detail.id,
                        serial_number_id: unit.id,
                        serial_number: unit.serial_number ?? null,
                        tag_number: unit.tag_number ?? null,
                        kondisi: 'Ada',
                        catatan: null,
                    }, { transaction: t } as any);
                }
            }

            await session.update({
                status: 'Berjalan',
                tanggal_mulai: new Date(),
            }, { transaction: t });

            await t.commit();
            return this.getSession(id);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async upsertDetail(id: number, payload: UpsertDetailPayload, userId: number) {
        const t = await sequelize.transaction();
        try {
            const session = await InvOpnameSession.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
            if (!session) throw new AppError('Sesi opname tidak ditemukan', 404);
            if (session.status !== 'Berjalan') {
                throw new AppError('Jumlah fisik hanya bisa diinput saat sesi berjalan', 400);
            }
            if (payload.jumlah_fisik !== null && payload.jumlah_fisik < 0) {
                throw new AppError('Jumlah fisik tidak boleh negatif', 400);
            }

            // Cek tipe_hitung: produk ber-serial tidak boleh input manual.
            const existing = await InvOpnameDetail.findOne({
                where: { opname_session_id: id, produk_id: payload.produk_id },
                transaction: t,
            });
            if (existing && existing.tipe_hitung === 'Serial') {
                throw new AppError(
                    'Produk ber-serial/tag: gunakan toggle Ada/Tidak Ada per unit, bukan input jumlah',
                    400,
                );
            }

            const stok = await InvStok.findOne({
                where: { produk_id: payload.produk_id, gudang_id: session.gudang_id },
                transaction: t,
            });
            const snapshot = existing?.jumlah_sistem_snapshot ?? stok?.jumlah ?? 0;
            const selisih = payload.jumlah_fisik !== null ? payload.jumlah_fisik - snapshot : null;

            const [detail] = await InvOpnameDetail.upsert({
                opname_session_id: id,
                produk_id: payload.produk_id,
                jumlah_sistem_snapshot: snapshot,
                jumlah_fisik: payload.jumlah_fisik,
                selisih,
                catatan: payload.catatan ?? null,
                tipe_hitung: 'Fisik',
            }, { transaction: t } as any);

            await t.commit();
            return detail;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    // Toggle kondisi satu unit serial (Ada/Tidak Ada) — auto-recalc jumlah_fisik
    // & selisih pada detail parent-nya.
    async upsertSerial(id: number, payload: UpsertSerialPayload, userId: number) {
        const t = await sequelize.transaction();
        try {
            const session = await InvOpnameSession.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
            if (!session) throw new AppError('Sesi opname tidak ditemukan', 404);
            if (session.status !== 'Berjalan') {
                throw new AppError('Perubahan hanya bisa dilakukan saat sesi berjalan', 400);
            }
            if (payload.kondisi !== 'Ada' && payload.kondisi !== 'Tidak Ada') {
                throw new AppError('Kondisi harus "Ada" atau "Tidak Ada"', 400);
            }

            const row = await InvOpnameSerial.findByPk(payload.opname_serial_id, { transaction: t });
            if (!row) throw new AppError('Baris serial tidak ditemukan', 404);

            const detail = await InvOpnameDetail.findByPk(row.opname_detail_id, { transaction: t });
            if (!detail) throw new AppError('Detail opname tidak ditemukan', 404);
            if (detail.opname_session_id !== session.id) {
                throw new AppError('Baris serial ini bukan milik sesi opname aktif', 400);
            }
            if (detail.tipe_hitung !== 'Serial') {
                throw new AppError('Detail ini bukan tipe Serial', 400);
            }

            await row.update({
                kondisi: payload.kondisi,
                catatan: payload.catatan ?? null,
            }, { transaction: t });

            const adaCount = await InvOpnameSerial.count({
                where: { opname_detail_id: detail.id, kondisi: 'Ada' },
                transaction: t,
            });
            const selisih = adaCount - detail.jumlah_sistem_snapshot;
            await detail.update({
                jumlah_fisik: adaCount,
                selisih,
            }, { transaction: t });

            await t.commit();
            return { serial: row, detail };
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async finishSession(id: number, userId: number) {
        const t = await sequelize.transaction();
        try {
            const session = await InvOpnameSession.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
            if (!session) throw new AppError('Sesi opname tidak ditemukan', 404);
            if (session.status !== 'Berjalan') {
                throw new AppError('Hanya sesi berstatus Berjalan yang bisa diselesaikan', 400);
            }

            await session.update({
                status: 'Selesai',
                tanggal_selesai: new Date(),
            }, { transaction: t });

            await t.commit();
            return this.getSession(id);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async approveSession(id: number, userId: number) {
        const t = await sequelize.transaction();
        try {
            const session = await InvOpnameSession.findByPk(id, {
                transaction: t,
                lock: t.LOCK.UPDATE,
            });
            if (!session) throw new AppError('Sesi opname tidak ditemukan', 404);
            if (session.status !== 'Selesai') {
                throw new AppError('Hanya sesi berstatus Selesai yang bisa di-approve', 400);
            }

            const detailRows = await InvOpnameDetail.findAll({
                where: { opname_session_id: id },
                transaction: t,
            });
            const berselisih = detailRows.filter(
                (d: any) => d.jumlah_fisik !== null && d.selisih !== 0,
            );

            let transaksi = null;
            if (berselisih.length > 0) {
                transaksi = await stokService.createAndApplyAdjustment({
                    gudang_id: session.gudang_id,
                    catatan: `Penyesuaian hasil opname ${session.kode}`,
                    detail: berselisih.map((d: any) => ({
                        produk_id: d.produk_id,
                        jumlah: d.selisih,
                        catatan: d.catatan ?? undefined,
                    })),
                }, userId, t);
            }

            await session.update({
                status: 'Approved',
                transaksi_id: transaksi?.id ?? null,
                approved_by: userId,
                approved_at: new Date(),
            }, { transaction: t });

            await t.commit();
            return this.getSession(id);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async cancelSession(id: number, reason: string, userId: number) {
        const t = await sequelize.transaction();
        try {
            const session = await InvOpnameSession.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
            if (!session) throw new AppError('Sesi opname tidak ditemukan', 404);
            if (!['Draft', 'Berjalan', 'Selesai'].includes(session.status)) {
                throw new AppError('Sesi ini tidak bisa dibatalkan', 400);
            }

            await session.update({
                status: 'Dibatalkan',
                catatan: reason,
            }, { transaction: t });

            await t.commit();
            return this.getSession(id);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    // Berita Acara opname: header (kode, gudang, PJ, atasan, petugas), tabel
    // ringkasan per produk, tabel unit hilang untuk produk ber-serial.
    async generateBeritaAcara(id: number): Promise<Buffer> {
        const session = await InvOpnameSession.findByPk(id, {
            include: [
                gudangWithPenanggungJawab,
                { model: User, as: 'approver', attributes: ['id', 'nama'] },
                { model: User, as: 'creator', attributes: ['id', 'nama'] },
                { model: InvOpnamePetugas, as: 'petugas', include: [employeeWithManager] },
                { model: InvTransaksi, as: 'transaksi', attributes: ['id', 'code'] },
                {
                    model: InvOpnameDetail, as: 'detail',
                    include: [
                        {
                            model: InvProduk, as: 'produk',
                            attributes: ['id', 'code', 'nama', 'has_serial_number', 'has_tag_number'],
                            include: [{ model: InvUom, as: 'uom', attributes: ['id', 'nama'] }],
                        },
                        { model: InvOpnameSerial, as: 'serials' },
                    ],
                },
            ],
            order: [
                [{ model: InvOpnameDetail, as: 'detail' } as any, 'id', 'ASC'],
                [{ model: InvOpnameDetail, as: 'detail' } as any, { model: InvOpnameSerial, as: 'serials' } as any, 'id', 'ASC'],
            ],
        });
        if (!session) throw new AppError('Sesi opname tidak ditemukan', 404);

        const html = this.buildBeritaAcaraHtml(session);
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4', printBackground: true,
                margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' },
            });
            return Buffer.from(pdfBuffer);
        } finally {
            await browser.close();
        }
    }

    private escapeHtml(v: unknown): string {
        return String(v ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    private buildBeritaAcaraHtml(session: any): string {
        const esc = (v: unknown) => this.escapeHtml(v);
        const detail: any[] = session.detail ?? [];
        const petugas: any[] = session.petugas ?? [];
        const pj: any = session.gudang?.penanggung_jawab ?? null;
        const atasan: any = pj?.manager ?? null;

        const rows = detail.map((d) => {
            const fisik = d.jumlah_fisik ?? null;
            const belum = fisik === null;
            const selisih = d.selisih ?? 0;
            const selisihColor = belum ? '#999' : (selisih < 0 ? '#c0392b' : (selisih > 0 ? '#27ae60' : '#333'));
            const selisihText = belum ? 'Belum dihitung' : (selisih > 0 ? `+${selisih}` : String(selisih));
            const tipe = d.tipe_hitung === 'Serial' ? 'Serial/Tag' : 'Fisik';
            return `<tr>
                <td>${esc(d.produk?.code)}</td>
                <td>${esc(d.produk?.nama)}</td>
                <td class="c">${esc(tipe)}</td>
                <td class="c">${esc(d.produk?.uom?.nama ?? '-')}</td>
                <td class="r">${esc(d.jumlah_sistem_snapshot)}</td>
                <td class="r">${belum ? '-' : esc(fisik)}</td>
                <td class="r" style="color:${selisihColor};font-weight:bold">${esc(selisihText)}</td>
                <td>${esc(d.catatan ?? '')}</td>
            </tr>`;
        }).join('');

        // Tabel unit hilang: dari semua detail Serial, ambil serial dengan kondisi 'Tidak Ada'.
        const hilang: Array<{ produk: string; serial: string; tag: string; catatan: string }> = [];
        for (const d of detail) {
            if (d.tipe_hitung !== 'Serial') continue;
            const serials: any[] = d.serials ?? [];
            for (const s of serials) {
                if (s.kondisi === 'Tidak Ada') {
                    hilang.push({
                        produk: `${d.produk?.code ?? ''} — ${d.produk?.nama ?? ''}`,
                        serial: s.serial_number ?? '-',
                        tag: s.tag_number ?? '-',
                        catatan: s.catatan ?? '',
                    });
                }
            }
        }
        const rowsHilang = hilang.map((h) => `<tr>
            <td>${esc(h.produk)}</td>
            <td>${esc(h.serial)}</td>
            <td>${esc(h.tag)}</td>
            <td>${esc(h.catatan)}</td>
        </tr>`).join('');

        const petugasLi = petugas.map((p: any) => {
            const k = p.karyawan;
            const nama = k?.nama_lengkap ?? '-';
            const nik = k?.nomor_induk_karyawan ? ` (${k.nomor_induk_karyawan})` : '';
            return `<li>${esc(nama)}${esc(nik)}</li>`;
        }).join('');

        const totalDihitung = detail.filter((d) => d.jumlah_fisik !== null).length;
        const totalLebih = detail.filter((d) => (d.selisih ?? 0) > 0).length;
        const totalKurang = detail.filter((d) => (d.selisih ?? 0) < 0).length;
        const tgl = session.approved_at ? new Date(session.approved_at).toLocaleString('id-ID') : '-';

        const pjNama = pj?.nama_lengkap ?? '-';
        const pjNik = pj?.nomor_induk_karyawan ? ` (${pj.nomor_induk_karyawan})` : '';
        const atasanNama = atasan?.nama_lengkap ?? '-';
        const atasanNik = atasan?.nomor_induk_karyawan ? ` (${atasan.nomor_induk_karyawan})` : '';

        return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
            body { font-family: Arial, sans-serif; font-size: 11px; color: #333; }
            h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
            h2 { font-size: 13px; margin-top: 18px; margin-bottom: 6px; }
            .meta { margin: 12px 0; }
            .meta div { margin: 2px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #999; padding: 5px 6px; text-align: left; vertical-align: top; }
            th { background: #4472C4; color: #fff; }
            td.r { text-align: right; }
            td.c { text-align: center; }
            .summary { margin-top: 14px; font-size: 12px; }
            .summary span { margin-right: 18px; }
            ul { margin: 4px 0 4px 20px; padding: 0; }
            .sig { margin-top: 40px; display: flex; justify-content: space-between; gap: 20px; font-size: 11px; }
            .sig .box { flex: 1; text-align: center; }
            .sig .space { height: 60px; }
            .empty { color: #999; font-style: italic; }
        </style></head><body>
            <h1>Berita Acara Stock Opname</h1>
            <div class="meta">
                <div><strong>Kode:</strong> ${esc(session.kode)}</div>
                <div><strong>Gudang:</strong> ${esc(session.gudang?.nama)} (${esc(session.gudang?.code)})</div>
                <div><strong>Department:</strong> ${esc(session.gudang?.department?.nama ?? '-')}</div>
                <div><strong>Penanggung Jawab Gudang:</strong> ${esc(pjNama)}${esc(pjNik)}</div>
                <div><strong>Atasan Penanggung Jawab:</strong> ${atasan ? `${esc(atasanNama)}${esc(atasanNik)}` : '<span class="empty">-</span>'}</div>
                <div><strong>Status:</strong> ${esc(session.status)}</div>
                <div><strong>Disetujui oleh:</strong> ${esc(session.approver?.nama ?? '-')} pada ${esc(tgl)}</div>
                <div><strong>Transaksi Adjustment:</strong> ${esc(session.transaksi?.code ?? 'Tidak ada (tanpa selisih)')}</div>
            </div>

            <h2>Petugas Opname</h2>
            ${petugas.length === 0 ? '<div class="empty">Tidak ada petugas terdaftar</div>' : `<ul>${petugasLi}</ul>`}

            <h2>Ringkasan Per Produk</h2>
            <table>
                <thead><tr>
                    <th>Kode</th><th>Produk</th><th>Tipe</th><th>UOM</th>
                    <th>Stok Sistem</th><th>Fisik</th><th>Selisih</th><th>Catatan</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
            <div class="summary">
                <span><strong>Produk dihitung:</strong> ${totalDihitung} / ${detail.length}</span>
                <span><strong>Selisih lebih:</strong> ${totalLebih}</span>
                <span><strong>Selisih kurang:</strong> ${totalKurang}</span>
            </div>

            <h2>Unit Hilang (Serial / Tag)</h2>
            ${hilang.length === 0
                ? '<div class="empty">Tidak ada unit yang hilang</div>'
                : `<table>
                        <thead><tr>
                            <th>Produk</th><th>Serial Number</th><th>Tag Number</th><th>Catatan</th>
                        </tr></thead>
                        <tbody>${rowsHilang}</tbody>
                    </table>`}

            <div class="sig">
                <div class="box">
                    <div>Petugas Opname</div>
                    <div class="space"></div>
                    <div>_______________________</div>
                </div>
                <div class="box">
                    <div>Penanggung Jawab Gudang</div>
                    <div class="space"></div>
                    <div>${esc(pjNama)}</div>
                </div>
                <div class="box">
                    <div>Mengetahui / Atasan</div>
                    <div class="space"></div>
                    <div>${esc(atasanNama)}</div>
                </div>
            </div>
        </body></html>`;
    }
}

export default new OpnameService();
