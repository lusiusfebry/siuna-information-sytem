import { Op } from 'sequelize';
import FacilityWorkOrder from '../models/WorkOrder';
import FacilityRoom from '../models/Room';
import FacilityMaintenanceCategory from '../models/MaintenanceCategory';
import { Employee } from '../../hr/models';
import cacheService from '../../../shared/services/cache.service';

const CODE_PREFIX = 'FWO';

class FacilityWorkOrderService {
    async generateCode(): Promise<string> {
        const lastRecord = await FacilityWorkOrder.findOne({
            where: { code: { [Op.like]: `${CODE_PREFIX}-%` } },
            order: [['code', 'DESC']],
        });

        let nextNumber = 1;
        if (lastRecord) {
            const lastCode = lastRecord.code;
            const lastNumber = parseInt(lastCode.split('-')[1], 10);
            if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
        }

        return `${CODE_PREFIX}-${String(nextNumber).padStart(4, '0')}`;
    }

    async findAllWithFilter(filters: any) {
        const { status, prioritas, search, room_id, page = 1, limit = 10 } = filters;
        const offset = (Number(page) - 1) * Number(limit);
        const where: any = {};

        if (status) where.status = status;
        if (prioritas) where.prioritas = prioritas;
        if (room_id) where.room_id = Number(room_id);

        if (search) {
            where[Op.or] = [
                { judul: { [Op.iLike]: `%${search}%` } },
                { code: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const { count, rows } = await FacilityWorkOrder.findAndCountAll({
            where,
            include: [
                { association: 'room', include: [{ association: 'building' }] },
                { association: 'kategori' },
                { association: 'reporter' },
                { association: 'assignee' },
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
        return await FacilityWorkOrder.findByPk(id, {
            include: [
                { association: 'room', include: [{ association: 'building' }] },
                { association: 'kategori' },
                { association: 'reporter' },
                { association: 'assignee' },
                { association: 'creator' },
            ],
        });
    }

    async create(data: any) {
        delete data.code;
        const code = await this.generateCode();
        // Model requires tanggal_lapor (NOT NULL) but the validator marks it
        // optional; default to today so create never fails on a missing date.
        if (!data.tanggal_lapor) {
            data.tanggal_lapor = new Date().toISOString().slice(0, 10);
        }
        return await FacilityWorkOrder.create({ ...data, code });
    }

    async update(id: number, data: any) {
        const item = await FacilityWorkOrder.findByPk(id);
        if (!item) return null;
        delete data.code;
        return await item.update(data);
    }
}

export default new FacilityWorkOrderService();
