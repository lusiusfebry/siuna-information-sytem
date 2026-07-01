import AuditLog, { AuditAction } from '../models/AuditLog';
import User from '../../auth/models/User';
import { Op } from 'sequelize';

interface AuditLogFilters {
    user_id?: number;
    entity_type?: string;
    entity_id?: number;
    action?: AuditAction;
    date_from?: string;
    date_to?: string;
}

interface Pagination {
    page: number;
    limit: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
}

class AuditService {
    async getAuditLogs(filters: AuditLogFilters, pagination: Pagination) {
        const { page = 1, limit = 10, sort_by = 'timestamp', sort_order = 'DESC' } = pagination;
        const offset = (page - 1) * limit;

        const where: any = {};

        if (filters.user_id) where.user_id = filters.user_id;
        if (filters.entity_type) where.entity_type = filters.entity_type;
        if (filters.entity_id) where.entity_id = filters.entity_id;
        if (filters.action) where.action = filters.action;

        if (filters.date_from || filters.date_to) {
            where.timestamp = {};
            if (filters.date_from) where.timestamp[Op.gte] = new Date(filters.date_from);
            if (filters.date_to) where.timestamp[Op.lte] = new Date(filters.date_to);
        }

        const { count, rows } = await AuditLog.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email'] // Adjust based on User model attributes
                }
            ],
            offset,
            limit,
            order: [[sort_by, sort_order]]
        });

        return {
            data: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        };
    }

    async getAuditLogById(id: number) {
        return await AuditLog.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email']
                }
            ]
        });
    }

    async getEntityHistory(entityType: string, entityId: number) {
        return await AuditLog.findAll({
            where: {
                entity_type: entityType,
                entity_id: entityId
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email']
                }
            ],
            order: [['timestamp', 'DESC']]
        });
    }

    async cleanupOldLogs(retentionDays: number) {
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - retentionDays);

        const deletedCount = await AuditLog.destroy({
            where: {
                timestamp: {
                    [Op.lt]: dateThreshold
                }
            }
        });

        return deletedCount;
    }

    async getAuditStats() {
        // Total logs
        const totalLogs = await AuditLog.count();

        // By Action
        const byAction = await AuditLog.findAll({
            attributes: ['action', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['action'],
            raw: true
        });

        // By Entity Type
        const byEntity = await AuditLog.findAll({
            attributes: ['entity_type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['entity_type'],
            order: [[sequelize.literal('count'), 'DESC']],
            limit: 5,
            raw: true
        });

        // Top Users
        const topUsers = await AuditLog.findAll({
            attributes: ['user_name', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['user_name'],
            where: {
                user_name: { [Op.ne]: null }
            },
            order: [[sequelize.literal('count'), 'DESC']],
            limit: 5,
            raw: true
        });

        return {
            total_logs: totalLogs,
            by_action: byAction,
            by_entity: byEntity,
            top_users: topUsers
        };
    }

    async getAuditUsers() {
        return await AuditLog.findAll({
            attributes: [
                'user_id',
                'user_name',
                [sequelize.fn('COUNT', sequelize.col('id')), 'log_count']
            ],
            where: {
                user_id: { [Op.ne]: null }
            },
            group: ['user_id', 'user_name'],
            order: [[sequelize.literal('user_name'), 'ASC']]
        });
    }
}
import sequelize from '../../../config/database';

export default new AuditService();
