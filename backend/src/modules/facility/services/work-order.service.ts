import { Op, Sequelize, Transaction } from 'sequelize';
import sequelize from '../../../config/database';
import FacilityWorkOrder from '../models/WorkOrder';
import FacilityRoom from '../models/Room';
import FacilityMaintenanceCategory from '../models/MaintenanceCategory';
import { Employee } from '../../hr/models';
import cacheService from '../../../shared/services/cache.service';

const CODE_PREFIX = 'FWO';

class FacilityWorkOrderService {
    async generateCode(t: Transaction): Promise<string> {
        // Serialize code generation across concurrent transactions (advisory lock held
        // until the transaction ends) and sort by the numeric suffix — a lexicographic
        // 'code DESC' sort ranks FWO-0099 above FWO-0100, producing duplicate codes past
        // 100 records (same class of bug as inventory C-06).
        await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:k))', {
            replacements: { k: `facility_wo_code_${CODE_PREFIX}` },
            transaction: t,
        });

        const lastRecord = await FacilityWorkOrder.findOne({
            where: { code: { [Op.like]: `${CODE_PREFIX}-%` } },
            order: [[Sequelize.literal(`CAST(SPLIT_PART(code, '-', 2) AS INTEGER)`), 'DESC']],
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        let nextNumber = 1;
        if (lastRecord) {
            const lastNumber = parseInt(lastRecord.code.split('-')[1], 10);
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
                { association: 'reporter', paranoid: false },
                { association: 'assignee', paranoid: false },
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
                { association: 'reporter', paranoid: false },
                { association: 'assignee', paranoid: false },
                { association: 'creator' },
            ],
        });
    }

    async create(data: any) {
        delete data.code;
        // Model requires tanggal_lapor (NOT NULL) but the validator marks it
        // optional; default to today so create never fails on a missing date.
        if (!data.tanggal_lapor) {
            data.tanggal_lapor = new Date().toISOString().slice(0, 10);
        }
        const t = await sequelize.transaction();
        try {
            const code = await this.generateCode(t);
            const result = await FacilityWorkOrder.create({ ...data, code }, { transaction: t });
            await t.commit();
            return result;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async update(id: number, data: any) {
        const item = await FacilityWorkOrder.findByPk(id);
        if (!item) return null;
        delete data.code;

        if (data.status && data.status !== item.status) {
            const ALLOWED: Record<string, string[]> = {
                'Open': ['In Progress', 'Closed'],
                'In Progress': ['Resolved', 'Open'],
                'Resolved': ['Closed', 'In Progress'],
                'Closed': [],
            };
            const allowed = ALLOWED[item.status] ?? [];
            if (!allowed.includes(data.status)) {
                const err: any = new Error(`Transisi status dari '${item.status}' ke '${data.status}' tidak diizinkan.`);
                err.statusCode = 400;
                throw err;
            }
        }

        return await item.update(data);
    }
}

export default new FacilityWorkOrderService();
