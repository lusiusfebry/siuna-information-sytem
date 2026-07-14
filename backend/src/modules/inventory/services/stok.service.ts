import { Op, Transaction } from 'sequelize';
import sequelize from '../../../config/database';
import { AppError } from '../../../shared/utils/errorHandler';
import InvStok from '../models/Stok';
import InvTransaksi from '../models/Transaksi';
import InvTransaksiDetail from '../models/TransaksiDetail';
import InvSerialNumber from '../models/SerialNumber';
import InvProduk from '../models/Produk';
import InvGudang from '../models/Gudang';
import InvUom from '../models/Uom';
import InvBrand from '../models/Brand';
import InvSubKategori from '../models/SubKategori';
import Employee from '../../hr/models/Employee';
import LokasiKerja from '../../hr/models/LokasiKerja';
import User from '../../auth/models/User';
import notificationService from '../../../shared/services/notification.service';
import FacilityBuilding from '../../facility/models/Building';
import FacilityRoom from '../../facility/models/Room';

const CODE_PREFIX_MAP: Record<string, string> = {
    'Masuk': 'STM',
    'Keluar': 'STK',
    'Adjustment': 'STA',
};

interface TransaksiDetailPayload {
    produk_id: number;
    uom_id: number;
    jumlah: number;
    catatan?: string;
    serial_numbers?: string[];
}

interface TransaksiPayload {
    tipe: 'Masuk' | 'Keluar' | 'Adjustment';
    sub_tipe: string;
    tanggal: string;
    gudang_id: number;
    gudang_tujuan_id?: number;
    facility_building_id?: number;
    facility_room_id?: number;
    karyawan_id?: number;
    supplier_nama?: string;
    no_referensi?: string;
    catatan?: string;
    details: TransaksiDetailPayload[];
}

class StokService {
    async generateCode(tipe: string, t: Transaction): Promise<string> {
        const prefix = CODE_PREFIX_MAP[tipe];
        if (!prefix) throw new AppError(`Tipe transaksi tidak valid: ${tipe}`, 400);

        // Serialize code generation for this prefix across concurrent transactions.
        // A row lock on MAX(code) does not stop a phantom insert; an advisory lock
        // (held until the transaction ends) does. Prevents duplicate-code 500s.
        await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:k))', {
            replacements: { k: `inv_trx_code_${prefix}` },
            transaction: t,
        });

        const lastRecord = await InvTransaksi.findOne({
            where: { code: { [Op.like]: `${prefix}-%` } },
            order: [['code', 'DESC']],
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        let nextNumber = 1;
        if (lastRecord) {
            const lastNumber = parseInt(lastRecord.code.split('-')[1], 10);
            if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
        }

        return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
    }

    private async generateTagNumber(produkId: number, gudangId: number, t: Transaction): Promise<string | null> {
        const produk = await InvProduk.findByPk(produkId, {
            include: [{ model: InvBrand, as: 'brand', include: [{ model: InvSubKategori, as: 'sub_kategori' }] }],
            transaction: t,
        });

        const prefixTag = produk?.brand?.sub_kategori?.prefix_tag;
        if (!prefixTag) return null;

        const gudang = await InvGudang.findByPk(gudangId, {
            include: [{ model: LokasiKerja, as: 'lokasi_kerja' }],
            transaction: t,
        });

        const kodeSite = gudang?.lokasi_kerja?.kode_site?.toUpperCase();
        if (!kodeSite) return null;

        const tagPrefix = `${prefixTag}_${kodeSite}_`;

        // Advisory lock per tag-prefix — same phantom-insert protection as codes.
        await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:k))', {
            replacements: { k: `inv_tag_${tagPrefix}` },
            transaction: t,
        });

        const lastTag = await InvSerialNumber.findOne({
            where: { tag_number: { [Op.like]: `${tagPrefix}%` } },
            order: [['tag_number', 'DESC']],
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        let nextNumber = 1;
        if (lastTag?.tag_number) {
            const parts = lastTag.tag_number.split('_');
            const lastNum = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lastNum)) nextNumber = lastNum + 1;
        }

        return `${tagPrefix}${String(nextNumber).padStart(7, '0')}`;
    }

    async getStokList(filters: any) {
        const { gudang_id, produk_id, search, page = 1, limit = 10 } = filters;
        const offset = (Number(page) - 1) * Number(limit);
        const where: any = {};

        if (gudang_id) where.gudang_id = gudang_id;
        if (produk_id) where.produk_id = produk_id;

        const include: any[] = [
            { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama', 'has_serial_number', 'has_tag_number'], include: [{ model: InvBrand, as: 'brand', attributes: ['id', 'nama'] }] },
            { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
            { model: InvUom, as: 'uom', attributes: ['id', 'nama'] },
        ];

        if (search) {
            where[Op.or] = [
                { '$produk.nama$': { [Op.iLike]: `%${search}%` } },
                { '$produk.code$': { [Op.iLike]: `%${search}%` } },
            ];
        }

        const { rows, count } = await InvStok.findAndCountAll({
            where,
            include,
            limit: Number(limit),
            offset,
            order: [['updated_at', 'DESC']],
            subQuery: false,
        });

        return {
            data: rows,
            pagination: {
                total: count,
                page: Number(page),
                totalPages: Math.ceil(count / Number(limit)),
            },
        };
    }

    async getSerialNumberList(filters: any) {
        const { produk_id, gudang_id, karyawan_id, status, search, page = 1, limit = 10 } = filters;
        const offset = (Number(page) - 1) * Number(limit);
        const where: any = {};

        if (produk_id) where.produk_id = produk_id;
        if (gudang_id) where.gudang_id = gudang_id;
        if (karyawan_id) where.karyawan_id = karyawan_id;
        if (status) where.status = status;
        if (search) {
            where[Op.or] = [
                { serial_number: { [Op.iLike]: `%${search}%` } },
                { tag_number: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const { rows, count } = await InvSerialNumber.findAndCountAll({
            where,
            include: [
                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                { model: Employee, as: 'karyawan', attributes: ['id', 'nama_lengkap', 'nomor_induk_karyawan'] , paranoid: false },
            ],
            limit: Number(limit),
            offset,
            order: [['created_at', 'DESC']],
        });

        return {
            data: rows,
            pagination: {
                total: count,
                page: Number(page),
                totalPages: Math.ceil(count / Number(limit)),
            },
        };
    }

    async createTransaksi(payload: TransaksiPayload, userId: number) {
        const t = await sequelize.transaction();

        try {
            const code = await this.generateCode(payload.tipe, t);

            const transaksi = await InvTransaksi.create({
                code,
                tipe: payload.tipe,
                sub_tipe: payload.sub_tipe,
                tanggal: payload.tanggal,
                gudang_id: payload.gudang_id,
                gudang_tujuan_id: payload.gudang_tujuan_id || null,
                facility_building_id: payload.facility_building_id || null,
                facility_room_id: payload.facility_room_id || null,
                karyawan_id: payload.karyawan_id || null,
                supplier_nama: payload.supplier_nama || null,
                no_referensi: payload.no_referensi || null,
                catatan: payload.catatan || null,
                created_by: userId,
            }, { transaction: t });

            for (const detail of payload.details) {
                const produk = await InvProduk.findByPk(detail.produk_id, { transaction: t });
                if (!produk) throw new AppError(`Produk dengan ID ${detail.produk_id} tidak ditemukan`, 404);

                await InvTransaksiDetail.create({
                    transaksi_id: transaksi.id,
                    produk_id: detail.produk_id,
                    uom_id: detail.uom_id,
                    jumlah: detail.jumlah,
                    catatan: detail.catatan || null,
                }, { transaction: t });

                if (payload.tipe === 'Masuk') {
                    await this.handleStokMasuk(payload, detail, produk, transaksi, t);
                } else if (payload.tipe === 'Keluar') {
                    await this.handleStokKeluar(payload, detail, produk, transaksi, t);
                } else if (payload.tipe === 'Adjustment') {
                    await this.handleAdjustment(payload, detail, produk, transaksi, t);
                }
            }

            // For transfer: create paired transaction
            if (payload.sub_tipe === 'Transfer Masuk' && payload.gudang_tujuan_id) {
                await this.createPairedTransferKeluar(payload, transaksi, userId, t);
            } else if (payload.sub_tipe === 'Transfer Gudang' && payload.gudang_tujuan_id) {
                await this.createPairedTransferMasuk(payload, transaksi, userId, t);
            }

            await t.commit();

            const affectedProdukIds = payload.details.map(d => d.produk_id);
            notificationService.checkLowStockAndNotify(affectedProdukIds).catch(() => {});

            return this.getTransaksiDetail(transaksi.id);
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    private async handleStokMasuk(
        payload: TransaksiPayload,
        detail: TransaksiDetailPayload,
        produk: InvProduk,
        transaksi: InvTransaksi,
        t: Transaction
    ) {
        const gudangId = payload.gudang_id;

        await this.upsertStok(detail.produk_id, gudangId, detail.uom_id, detail.jumlah, t);

        if (produk.has_serial_number && detail.serial_numbers?.length) {
            for (const sn of detail.serial_numbers) {
                // Transfer Masuk moves an EXISTING physical unit into this gudang —
                // update the serial's location instead of creating a duplicate row.
                // Serials are globally unique, so we look one up by serial_number and
                // reconcile it to this product line.
                if (payload.sub_tipe === 'Transfer Masuk') {
                    const existing = await InvSerialNumber.findOne({
                        where: { serial_number: sn },
                        transaction: t,
                    });
                    if (existing) {
                        await existing.update({
                            produk_id: detail.produk_id,
                            gudang_id: gudangId,
                            karyawan_id: null,
                            status: 'Tersedia',
                            transaksi_terakhir_id: transaksi.id,
                        }, { transaction: t });
                        continue;
                    }
                    // fall through to create if the serial doesn't exist yet
                }

                // Serial numbers are globally unique (one physical unit = one serial,
                // regardless of product). Reject if this serial already exists anywhere.
                const clash = await InvSerialNumber.findOne({
                    where: { serial_number: sn },
                    include: [{ model: InvProduk, as: 'produk', attributes: ['code', 'nama'] }],
                    transaction: t,
                });
                if (clash) {
                    const owner = (clash as any).produk;
                    throw new AppError(
                        `Serial number "${sn}" sudah terdaftar${owner ? ` pada produk ${owner.code} - ${owner.nama}` : ''}. Serial number harus unik di seluruh sistem.`,
                        400
                    );
                }

                const snRecord = await InvSerialNumber.create({
                    produk_id: detail.produk_id,
                    serial_number: sn,
                    gudang_id: gudangId,
                    karyawan_id: null,
                    status: 'Tersedia',
                    transaksi_masuk_id: transaksi.id,
                    transaksi_terakhir_id: transaksi.id,
                }, { transaction: t });

                if (produk.has_tag_number) {
                    const tagNumber = await this.generateTagNumber(detail.produk_id, gudangId, t);
                    if (tagNumber) {
                        await snRecord.update({ tag_number: tagNumber }, { transaction: t });
                    }
                }
            }
        } else if (produk.has_tag_number && !produk.has_serial_number) {
            for (let i = 0; i < detail.jumlah; i++) {
                const tagNumber = await this.generateTagNumber(detail.produk_id, gudangId, t);
                if (tagNumber) {
                    await InvSerialNumber.create({
                        produk_id: detail.produk_id,
                        serial_number: null,
                        tag_number: tagNumber,
                        gudang_id: gudangId,
                        karyawan_id: null,
                        status: 'Tersedia',
                        transaksi_masuk_id: transaksi.id,
                        transaksi_terakhir_id: transaksi.id,
                    }, { transaction: t });
                }
            }
        }

        // Retur from karyawan: update SN back to gudang
        if (payload.sub_tipe === 'Retur Karyawan' && produk.has_serial_number && detail.serial_numbers?.length) {
            for (const sn of detail.serial_numbers) {
                await InvSerialNumber.update({
                    gudang_id: gudangId,
                    karyawan_id: null,
                    status: 'Tersedia',
                    transaksi_terakhir_id: transaksi.id,
                }, {
                    // Scope by the returning employee so a same-serial unit held by
                    // a DIFFERENT employee is never reset by this retur.
                    where: { produk_id: detail.produk_id, serial_number: sn, karyawan_id: payload.karyawan_id },
                    transaction: t,
                });
            }
        }
    }

    private async handleStokKeluar(
        payload: TransaksiPayload,
        detail: TransaksiDetailPayload,
        produk: InvProduk,
        transaksi: InvTransaksi,
        t: Transaction
    ) {
        const gudangId = payload.gudang_id;

        await this.validateStokCukup(detail.produk_id, gudangId, detail.jumlah, t);
        await this.upsertStok(detail.produk_id, gudangId, detail.uom_id, -detail.jumlah, t);

        if (produk.has_serial_number && detail.serial_numbers?.length) {
            for (const sn of detail.serial_numbers) {
                const snRecord = await InvSerialNumber.findOne({
                    where: { produk_id: detail.produk_id, serial_number: sn, gudang_id: gudangId },
                    transaction: t,
                });
                if (!snRecord) throw new AppError(`Serial number ${sn} tidak ditemukan di gudang ini`, 400);

                const updateData: any = { transaksi_terakhir_id: transaksi.id };

                if (payload.sub_tipe === 'Ke Karyawan') {
                    updateData.gudang_id = null;
                    updateData.karyawan_id = payload.karyawan_id;
                    updateData.status = 'Digunakan';
                } else if (payload.sub_tipe === 'Ke Gedung/Mess') {
                    updateData.gudang_id = null;
                    updateData.status = 'Digunakan';
                } else if (payload.sub_tipe === 'Disposal') {
                    updateData.gudang_id = null;
                    updateData.status = 'Disposed';
                } else if (payload.sub_tipe === 'Rusak/Terbuang') {
                    updateData.gudang_id = null;
                    updateData.status = 'Rusak';
                } else if (payload.sub_tipe === 'Transfer Gudang') {
                    updateData.gudang_id = payload.gudang_tujuan_id;
                }

                await snRecord.update(updateData, { transaction: t });
            }
        } else if (produk.has_tag_number && !produk.has_serial_number && detail.serial_numbers?.length) {
            for (const tn of detail.serial_numbers) {
                const snRecord = await InvSerialNumber.findOne({
                    where: { produk_id: detail.produk_id, tag_number: tn, gudang_id: gudangId },
                    transaction: t,
                });
                if (!snRecord) throw new AppError(`Tag number ${tn} tidak ditemukan di gudang ini`, 400);

                const updateData: any = { transaksi_terakhir_id: transaksi.id };

                if (payload.sub_tipe === 'Ke Karyawan') {
                    updateData.gudang_id = null;
                    updateData.karyawan_id = payload.karyawan_id;
                    updateData.status = 'Digunakan';
                } else if (payload.sub_tipe === 'Ke Gedung/Mess') {
                    updateData.gudang_id = null;
                    updateData.status = 'Digunakan';
                } else if (payload.sub_tipe === 'Disposal') {
                    updateData.gudang_id = null;
                    updateData.status = 'Disposed';
                } else if (payload.sub_tipe === 'Rusak/Terbuang') {
                    updateData.gudang_id = null;
                    updateData.status = 'Rusak';
                } else if (payload.sub_tipe === 'Transfer Gudang') {
                    updateData.gudang_id = payload.gudang_tujuan_id;
                }

                await snRecord.update(updateData, { transaction: t });
            }
        }
    }

    private async handleAdjustment(
        payload: TransaksiPayload,
        detail: TransaksiDetailPayload,
        _produk: InvProduk,
        _transaksi: InvTransaksi,
        t: Transaction
    ) {
        // jumlah = selisih (bisa positif atau negatif)
        const stok = await InvStok.findOne({
            where: { produk_id: detail.produk_id, gudang_id: payload.gudang_id },
            transaction: t,
        });

        if (stok) {
            const newJumlah = stok.jumlah + detail.jumlah;
            if (newJumlah < 0) throw new AppError('Hasil adjustment tidak boleh menghasilkan stok negatif', 400);
            await stok.update({ jumlah: newJumlah }, { transaction: t });
        } else if (detail.jumlah > 0) {
            await InvStok.create({
                produk_id: detail.produk_id,
                gudang_id: payload.gudang_id,
                uom_id: detail.uom_id,
                jumlah: detail.jumlah,
            }, { transaction: t });
        } else {
            throw new AppError('Tidak bisa melakukan adjustment negatif pada produk yang belum ada stoknya', 400);
        }
    }

    private async createPairedTransferKeluar(
        payload: TransaksiPayload,
        transaksiMasuk: InvTransaksi,
        userId: number,
        t: Transaction
    ) {
        const code = await this.generateCode('Keluar', t);
        const transaksiKeluar = await InvTransaksi.create({
            code,
            tipe: 'Keluar',
            sub_tipe: 'Transfer Gudang',
            tanggal: payload.tanggal,
            gudang_id: payload.gudang_tujuan_id!,
            gudang_tujuan_id: payload.gudang_id,
            catatan: `Auto-generated dari transfer masuk ${transaksiMasuk.code}`,
            created_by: userId,
        }, { transaction: t });

        for (const detail of payload.details) {
            await InvTransaksiDetail.create({
                transaksi_id: transaksiKeluar.id,
                produk_id: detail.produk_id,
                uom_id: detail.uom_id,
                jumlah: detail.jumlah,
                catatan: detail.catatan || null,
            }, { transaction: t });

            await this.validateStokCukup(detail.produk_id, payload.gudang_tujuan_id!, detail.jumlah, t);
            await this.upsertStok(detail.produk_id, payload.gudang_tujuan_id!, detail.uom_id, -detail.jumlah, t);
        }
    }

    private async createPairedTransferMasuk(
        payload: TransaksiPayload,
        transaksiKeluar: InvTransaksi,
        userId: number,
        t: Transaction
    ) {
        const code = await this.generateCode('Masuk', t);
        const transaksiMasuk = await InvTransaksi.create({
            code,
            tipe: 'Masuk',
            sub_tipe: 'Transfer Masuk',
            tanggal: payload.tanggal,
            gudang_id: payload.gudang_tujuan_id!,
            gudang_tujuan_id: null,
            catatan: `Auto-generated dari transfer gudang ${transaksiKeluar.code}`,
            created_by: userId,
        }, { transaction: t });

        for (const detail of payload.details) {
            await InvTransaksiDetail.create({
                transaksi_id: transaksiMasuk.id,
                produk_id: detail.produk_id,
                uom_id: detail.uom_id,
                jumlah: detail.jumlah,
                catatan: detail.catatan || null,
            }, { transaction: t });

            await this.upsertStok(detail.produk_id, payload.gudang_tujuan_id!, detail.uom_id, detail.jumlah, t);
        }
    }

    private async upsertStok(produkId: number, gudangId: number, uomId: number, delta: number, t: Transaction) {
        // Serialize first-time creation of this (produk, gudang) stock row so two
        // concurrent transactions don't both INSERT and collide on the unique index.
        await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:k))', {
            replacements: { k: `inv_stok_${produkId}_${gudangId}` },
            transaction: t,
        });

        const stok = await InvStok.findOne({
            where: { produk_id: produkId, gudang_id: gudangId },
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        if (stok) {
            await stok.update({ jumlah: stok.jumlah + delta, uom_id: uomId }, { transaction: t });
        } else {
            if (delta < 0) throw new AppError('Tidak bisa mengurangi stok yang belum ada', 400);
            await InvStok.create({
                produk_id: produkId,
                gudang_id: gudangId,
                uom_id: uomId,
                jumlah: delta,
            }, { transaction: t });
        }
    }

    private async validateStokCukup(produkId: number, gudangId: number, jumlah: number, t: Transaction) {
        const stok = await InvStok.findOne({
            where: { produk_id: produkId, gudang_id: gudangId },
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        const available = stok?.jumlah || 0;
        if (available < jumlah) {
            const produk = await InvProduk.findByPk(produkId, { transaction: t });
            throw new AppError(
                `Stok ${produk?.nama || 'produk'} tidak mencukupi. Tersedia: ${available}, dibutuhkan: ${jumlah}`,
                400
            );
        }
    }

    async getTransaksiList(filters: any) {
        const { tipe, sub_tipe, gudang_id, facility_building_id, tanggal_dari, tanggal_sampai, search, page = 1, limit = 10 } = filters;
        const offset = (Number(page) - 1) * Number(limit);
        const where: any = {};

        if (tipe) where.tipe = tipe;
        if (sub_tipe) where.sub_tipe = sub_tipe;
        if (gudang_id) where.gudang_id = gudang_id;
        if (facility_building_id) where.facility_building_id = facility_building_id;
        if (tanggal_dari && tanggal_sampai) {
            where.tanggal = { [Op.between]: [tanggal_dari, tanggal_sampai] };
        } else if (tanggal_dari) {
            where.tanggal = { [Op.gte]: tanggal_dari };
        } else if (tanggal_sampai) {
            where.tanggal = { [Op.lte]: tanggal_sampai };
        }
        if (search) {
            where[Op.or] = [
                { code: { [Op.iLike]: `%${search}%` } },
                { supplier_nama: { [Op.iLike]: `%${search}%` } },
                { no_referensi: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const { rows, count } = await InvTransaksi.findAndCountAll({
            where,
            include: [
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                { model: InvGudang, as: 'gudang_tujuan', attributes: ['id', 'code', 'nama'] },
                { model: FacilityBuilding, as: 'facility_building', attributes: ['id', 'code', 'nama'] },
                { model: FacilityRoom, as: 'facility_room', attributes: ['id', 'code', 'nama'] },
                { model: Employee, as: 'karyawan', attributes: ['id', 'nama_lengkap'] , paranoid: false },
                { model: User, as: 'creator', attributes: ['id', 'nama'] },
            ],
            limit: Number(limit),
            offset,
            order: [['created_at', 'DESC']],
        });

        return {
            data: rows,
            pagination: {
                total: count,
                page: Number(page),
                totalPages: Math.ceil(count / Number(limit)),
            },
        };
    }

    async getTransaksiDetail(id: number) {
        const transaksi = await InvTransaksi.findByPk(id, {
            include: [
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                { model: InvGudang, as: 'gudang_tujuan', attributes: ['id', 'code', 'nama'] },
                { model: FacilityBuilding, as: 'facility_building', attributes: ['id', 'code', 'nama'] },
                { model: FacilityRoom, as: 'facility_room', attributes: ['id', 'code', 'nama'] },
                { model: Employee, as: 'karyawan', attributes: ['id', 'nama_lengkap', 'nomor_induk_karyawan'] , paranoid: false },
                { model: User, as: 'creator', attributes: ['id', 'nama'] },
                {
                    model: InvTransaksiDetail,
                    as: 'details',
                    include: [
                        { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama', 'has_serial_number'] },
                        { model: InvUom, as: 'uom', attributes: ['id', 'nama'] },
                    ],
                },
            ],
        });

        if (!transaksi) throw new AppError('Transaksi tidak ditemukan', 404);

        // Serial numbers are not directly associated to a transaksi_detail, but each
        // record carries transaksi_masuk_id (created here) / transaksi_terakhir_id
        // (last movement). Fetch the ones tied to this transaksi and group them by
        // produk so the frontend can show them under the matching detail line.
        const serials = await InvSerialNumber.findAll({
            where: {
                [Op.or]: [
                    { transaksi_masuk_id: id },
                    { transaksi_terakhir_id: id },
                ],
            },
            attributes: ['id', 'produk_id', 'serial_number', 'tag_number', 'status'],
            order: [['serial_number', 'ASC']],
        });

        const serialsByProduk = new Map<number, any[]>();
        for (const sn of serials) {
            const list = serialsByProduk.get(sn.produk_id) || [];
            list.push(sn);
            serialsByProduk.set(sn.produk_id, list);
        }

        const result: any = transaksi.toJSON();
        result.details = (result.details || []).map((d: any) => ({
            ...d,
            serial_numbers: serialsByProduk.get(d.produk_id) || [],
        }));

        return result;
    }

    async getKartuStok(filters: any) {
        const { produk_id, gudang_id, dari, sampai, page = 1, limit = 20 } = filters;

        if (!produk_id) throw new AppError('produk_id harus diisi', 400);

        const detailWhere: any = { produk_id };
        const transaksiWhere: any = {};

        if (gudang_id) transaksiWhere.gudang_id = gudang_id;
        if (dari && sampai) {
            transaksiWhere.tanggal = { [Op.between]: [dari, sampai] };
        } else if (dari) {
            transaksiWhere.tanggal = { [Op.gte]: dari };
        } else if (sampai) {
            transaksiWhere.tanggal = { [Op.lte]: sampai };
        }

        const offset = (Number(page) - 1) * Number(limit);

        const { rows, count } = await InvTransaksiDetail.findAndCountAll({
            where: detailWhere,
            include: [
                {
                    model: InvTransaksi,
                    as: 'transaksi',
                    where: transaksiWhere,
                    include: [
                        { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                        { model: InvGudang, as: 'gudang_tujuan', attributes: ['id', 'code', 'nama'] },
                        { model: Employee, as: 'karyawan', attributes: ['id', 'nama_lengkap'] , paranoid: false },
                    ],
                },
                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                { model: InvUom, as: 'uom', attributes: ['id', 'nama'] },
            ],
            limit: Number(limit),
            offset,
            order: [[{ model: InvTransaksi, as: 'transaksi' }, 'tanggal', 'DESC'], ['id', 'DESC']],
            subQuery: false,
        });

        return {
            data: rows,
            pagination: {
                total: count,
                page: Number(page),
                totalPages: Math.ceil(count / Number(limit)),
            },
        };
    }

    async getFacilityInventory(buildingId: number) {
        const transaksi = await InvTransaksi.findAll({
            where: {
                facility_building_id: buildingId,
                sub_tipe: 'Ke Gedung/Mess',
            },
            include: [
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                { model: FacilityBuilding, as: 'facility_building', attributes: ['id', 'code', 'nama'] },
                { model: FacilityRoom, as: 'facility_room', attributes: ['id', 'code', 'nama'] },
                { model: User, as: 'creator', attributes: ['id', 'nama'] },
                {
                    model: InvTransaksiDetail,
                    as: 'details',
                    include: [
                        { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama', 'has_serial_number'] },
                        { model: InvUom, as: 'uom', attributes: ['id', 'nama'] },
                    ],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        return transaksi;
    }
}

export default new StokService();
