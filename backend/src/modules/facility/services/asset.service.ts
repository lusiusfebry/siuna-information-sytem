import FacilityAsset from '../models/Asset';
import FacilityRoom from '../models/Room';
import InvSerialNumber from '../../inventory/models/SerialNumber';
import InvProduk from '../../inventory/models/Produk';
import InvTransaksi from '../../inventory/models/Transaksi';
import stokService from '../../inventory/services/stok.service';

// A placement made directly from the facility side must move real inventory, not
// just write a facility_assets row. Both create and withdraw here delegate to the
// inventory transaction engine (stokService) so serial state and stock stay the
// single source of truth (INV-C01). The facility_assets row is then written/closed
// by the shared placement helpers inside stokService.
class FacilityAssetService {
    async findAllWithFilter(filters: any) {
        const { status, room_id, page = 1, limit = 10 } = filters;
        const offset = (Number(page) - 1) * Number(limit);
        const where: any = {};

        if (status) where.status = status;
        if (room_id) where.room_id = Number(room_id);

        const { count, rows } = await FacilityAsset.findAndCountAll({
            where,
            include: [
                { association: 'room', include: [{ association: 'building' }] },
                { association: 'serial_number' },
            ],
            limit: Number(limit),
            offset: Number(offset),
            order: [['id', 'DESC']],
            distinct: true
        });

        return {
            data: rows,
            total: count,
            page: Number(page),
            totalPages: Math.ceil(count / Number(limit))
        };
    }

    async findById(id: number) {
        return await FacilityAsset.findByPk(id, {
            include: [
                { association: 'room', include: [{ association: 'building' }] },
                { association: 'serial_number' },
                { association: 'creator' },
            ],
        });
    }

    async create(data: any) {
        const room = await FacilityRoom.findByPk(data.room_id);
        if (!room) {
            const err: any = new Error('Ruangan tidak ditemukan');
            err.statusCode = 400;
            throw err;
        }

        const serial = await InvSerialNumber.findByPk(data.serial_number_id);
        if (!serial) {
            const err: any = new Error('Serial number tidak ditemukan');
            err.statusCode = 400;
            throw err;
        }
        // Only a unit sitting in a warehouse can be placed. If it is already in use
        // (assigned, placed elsewhere, broken, disposed) reject rather than silently
        // producing an inconsistent state.
        if (serial.status !== 'Tersedia' || serial.gudang_id == null) {
            const err: any = new Error('Serial number tidak tersedia di gudang (mungkin sedang dipakai atau sudah terpasang). Tidak bisa ditempatkan.');
            err.statusCode = 409;
            throw err;
        }

        const produk = await InvProduk.findByPk(serial.produk_id);
        if (!produk) {
            const err: any = new Error('Produk untuk serial number ini tidak ditemukan');
            err.statusCode = 400;
            throw err;
        }

        const identifier = produk.has_serial_number ? serial.serial_number : serial.tag_number;
        if (!identifier) {
            const err: any = new Error('Serial/tag number tidak valid untuk penempatan');
            err.statusCode = 400;
            throw err;
        }

        const tanggal = data.tanggal_penempatan || new Date().toISOString().split('T')[0];

        // Delegate to a synthetic "Ke Gedung/Mess" transaction. This decrements stock,
        // flips the serial to 'Digunakan', and creates the facility_assets row via
        // openFacilityPlacement — no duplicated placement logic here.
        await stokService.createTransaksi({
            tipe: 'Keluar',
            sub_tipe: 'Ke Gedung/Mess',
            tanggal,
            gudang_id: serial.gudang_id,
            facility_building_id: room.building_id,
            facility_room_id: room.id,
            catatan: data.keterangan || null,
            details: [{
                produk_id: serial.produk_id,
                uom_id: produk.uom_id as number,
                jumlah: 1,
                serial_numbers: [identifier],
            }],
        } as any, data.created_by ?? null);

        // Return the placement the transaction just created, carrying any note through.
        const asset = await FacilityAsset.findOne({
            where: { serial_number_id: serial.id, status: 'Aktif' },
            order: [['id', 'DESC']],
            include: [
                { association: 'room', include: [{ association: 'building' }] },
                { association: 'serial_number' },
            ],
        });
        if (asset && data.keterangan && !asset.keterangan) {
            await asset.update({ keterangan: data.keterangan });
        }
        return asset;
    }

    async update(id: number, data: any) {
        const item = await FacilityAsset.findByPk(id);
        if (!item) return null;
        return await item.update(data);
    }

    async withdraw(id: number, data: any, userId: number | null = null) {
        const item = await FacilityAsset.findByPk(id);
        if (!item) return null;
        if (item.status !== 'Aktif') {
            const err: any = new Error('Asset sudah ditarik sebelumnya');
            err.statusCode = 409;
            throw err;
        }

        const serial = await InvSerialNumber.findByPk(item.serial_number_id);
        const produk = serial ? await InvProduk.findByPk(serial.produk_id) : null;

        // Return destination: the warehouse the unit came from (source transaction), or
        // an explicitly provided gudang_id, in that order.
        let destGudangId: number | null = data.gudang_id ? Number(data.gudang_id) : null;
        if (!destGudangId && item.transaksi_id) {
            const source = await InvTransaksi.findByPk(item.transaksi_id);
            if (source) destGudangId = source.gudang_id;
        }

        // If we can reconstruct a full inventory return, do it through a synthetic
        // "Ambil dari Gedung" transaction so stock and serial state are restored and the
        // facility_assets row is closed by closeFacilityPlacement.
        if (serial && produk && destGudangId) {
            const identifier = produk.has_serial_number ? serial.serial_number : serial.tag_number;
            if (identifier) {
                await stokService.createTransaksi({
                    tipe: 'Masuk',
                    sub_tipe: 'Ambil dari Gedung',
                    tanggal: data.tanggal_penarikan || new Date().toISOString().split('T')[0],
                    gudang_id: destGudangId,
                    catatan: data.keterangan || null,
                    details: [{
                        produk_id: serial.produk_id,
                        uom_id: produk.uom_id as number,
                        jumlah: 1,
                        serial_numbers: [identifier],
                    }],
                } as any, userId);
                return await FacilityAsset.findByPk(id, {
                    include: [
                        { association: 'room', include: [{ association: 'building' }] },
                        { association: 'serial_number' },
                    ],
                });
            }
        }

        // Fallback: no warehouse could be determined (e.g. legacy row with no source
        // transaction and no gudang_id given). Close the placement only, leaving the
        // serial as-is; the caller should follow up with an inventory return.
        return await item.update({
            status: 'Ditarik',
            tanggal_penarikan: data.tanggal_penarikan || new Date().toISOString().split('T')[0],
            keterangan: data.keterangan || item.keterangan,
        });
    }
}

export default new FacilityAssetService();
