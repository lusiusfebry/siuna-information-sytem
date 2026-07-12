import { Op } from 'sequelize';
import FacilityAsset from '../models/Asset';

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
        // Guard: a physical unit (serial number) must not be an active asset in two
        // rooms at once. Reject if it is already placed (status 'Aktif') elsewhere.
        const existing = await FacilityAsset.count({
            where: { serial_number_id: data.serial_number_id, status: 'Aktif' },
        });
        if (existing > 0) {
            const err: any = new Error('Serial number sudah terpasang aktif di ruangan lain. Tarik (withdraw) terlebih dahulu.');
            err.statusCode = 409;
            throw err;
        }
        return await FacilityAsset.create(data);
    }

    async update(id: number, data: any) {
        const item = await FacilityAsset.findByPk(id);
        if (!item) return null;
        return await item.update(data);
    }

    async withdraw(id: number, data: any) {
        const item = await FacilityAsset.findByPk(id);
        if (!item) return null;

        return await item.update({
            status: 'Ditarik',
            tanggal_penarikan: data.tanggal_penarikan || new Date().toISOString().split('T')[0],
            keterangan: data.keterangan || item.keterangan,
        });
    }
}

export default new FacilityAssetService();
