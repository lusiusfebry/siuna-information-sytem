import { Op } from 'sequelize';
import FacilityOccupant from '../models/Occupant';
import FacilityRoom from '../models/Room';

class FacilityOccupantService {
    async findAllWithFilter(filters: any) {
        const { status, search, room_id, building_id, employee_id, page = 1, limit = 10 } = filters;
        const offset = (Number(page) - 1) * Number(limit);
        const where: any = {};

        if (status) where.status = status;
        if (room_id) where.room_id = Number(room_id);
        if (employee_id) where.employee_id = Number(employee_id);

        // Build room include with optional building_id filter
        const roomWhere: any = {};
        if (building_id) roomWhere.building_id = Number(building_id);

        const includeOpts: any[] = [
            {
                association: 'room',
                ...(Object.keys(roomWhere).length > 0 ? { where: roomWhere } : {}),
                include: [{ association: 'building' }],
            },
            { association: 'employee' },
        ];

        // Search across employee name, NIK, and room name
        if (search) {
            where[Op.or] = [
                { '$employee.nama_lengkap$': { [Op.iLike]: `%${search}%` } },
                { '$employee.nomor_induk_karyawan$': { [Op.iLike]: `%${search}%` } },
                { '$room.nama$': { [Op.iLike]: `%${search}%` } },
            ];
        }

        const { count, rows } = await FacilityOccupant.findAndCountAll({
            where,
            include: includeOpts,
            limit: Number(limit),
            offset: Number(offset),
            order: [['id', 'DESC']],
            distinct: true,
            subQuery: false,
        });

        return {
            data: rows,
            total: count,
            page: Number(page),
            totalPages: Math.ceil(count / Number(limit))
        };
    }

    async findById(id: number) {
        return await FacilityOccupant.findByPk(id, {
            include: [
                { association: 'room', include: [{ association: 'building' }] },
                { association: 'employee' },
                { association: 'creator' },
            ],
        });
    }

    async create(data: any) {
        // Check room capacity
        const room = await FacilityRoom.findByPk(data.room_id);
        if (!room) return null;

        const activeCount = await FacilityOccupant.count({
            where: { room_id: data.room_id, status: 'Aktif' }
        });

        if (activeCount >= room.kapasitas) {
            const error: any = new Error('Kamar sudah penuh, tidak dapat menambah penghuni.');
            error.statusCode = 400;
            throw error;
        }

        const result = await FacilityOccupant.create(data);

        // Update room status if full
        if (activeCount + 1 >= room.kapasitas) {
            await room.update({ status: 'Penuh' });
        }

        return result;
    }

    async update(id: number, data: any) {
        const item = await FacilityOccupant.findByPk(id);
        if (!item) return null;
        return await item.update(data);
    }

    async checkout(id: number, data: any) {
        const item = await FacilityOccupant.findByPk(id);
        if (!item) return null;

        const result = await item.update({
            status: 'Selesai',
            tanggal_keluar: data.tanggal_keluar || new Date().toISOString().split('T')[0],
            keterangan: data.keterangan || item.keterangan,
        });

        // Update room status back to available
        const room = await FacilityRoom.findByPk(item.room_id);
        if (room && room.status === 'Penuh') {
            await room.update({ status: 'Tersedia' });
        }

        return result;
    }
}

export default new FacilityOccupantService();
