import { Op } from 'sequelize';
import Notification from '../models/Notification';
import InvStok from '../../modules/inventory/models/Stok';
import InvProduk from '../../modules/inventory/models/Produk';
import { User } from '../../modules/auth/models/User';
import { Role } from '../../modules/auth/models/Role';
import { Permission } from '../../modules/auth/models/Permission';
import { Sequelize } from 'sequelize';

class NotificationService {
    async getByUser(userId: number, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const { rows: data, count: total } = await Notification.findAndCountAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });
        return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getUnreadCount(userId: number): Promise<number> {
        return Notification.count({ where: { user_id: userId, is_read: false } });
    }

    async markAsRead(id: number, userId: number) {
        const notif = await Notification.findOne({ where: { id, user_id: userId } });
        if (!notif) return null;
        await notif.update({ is_read: true });
        return notif;
    }

    async markAllAsRead(userId: number) {
        await Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });
    }

    async checkLowStockAndNotify(produkIds: number[]) {
        try {
            const lowStockItems = await InvStok.findAll({
                include: [{
                    model: InvProduk,
                    as: 'produk',
                    attributes: ['id', 'code', 'nama', 'stok_minimum'],
                    where: { id: { [Op.in]: produkIds }, status: 'Aktif' },
                }],
                where: Sequelize.where(
                    Sequelize.col('jumlah'),
                    Op.lte,
                    Sequelize.fn('COALESCE', Sequelize.col('produk.stok_minimum'), 5)
                ),
                subQuery: false,
            });

            if (lowStockItems.length === 0) return;

            // Target users whose role grants inventory_stock read/create. RBAC
            // permissions live in a join table (belongsToMany), NOT a JSON column,
            // so we join roleDetails->permissions. Superadmin is included via role
            // name (it bypasses explicit permission grants elsewhere).
            const users = await User.findAll({
                where: { is_active: true },
                include: [{
                    model: Role,
                    as: 'roleDetails',
                    required: true,
                    include: [{
                        model: Permission,
                        as: 'permissions',
                        required: false,
                        where: { resource: 'inventory_stock', action: { [Op.in]: ['read', 'create'] } },
                    }],
                }],
            });

            // Keep users who either are superadmin or actually got a matching permission.
            const targetUsers = users.filter((u: any) =>
                u.roleDetails?.name === 'superadmin' ||
                (u.roleDetails?.permissions && u.roleDetails.permissions.length > 0)
            );

            const notifications: any[] = [];

            // Dedup: skip (user, stok) pairs that already have an UNREAD low-stock
            // notification, so repeated transactions on the same item don't spam.
            const stokIds = lowStockItems.map((i: any) => i.id);
            const existing = await Notification.findAll({
                where: { entity_type: 'inv_stok', entity_id: { [Op.in]: stokIds }, is_read: false },
                attributes: ['user_id', 'entity_id'],
                raw: true,
            });
            const alreadyNotified = new Set(
                (existing as any[]).map((e) => `${e.user_id}:${e.entity_id}`)
            );

            for (const item of lowStockItems) {
                const produk = (item as any).produk;
                const stokMin = produk?.stok_minimum ?? 5;

                for (const user of targetUsers) {
                    if (alreadyNotified.has(`${user.id}:${item.id}`)) continue;
                    notifications.push({
                        user_id: user.id,
                        title: 'Stok Rendah',
                        message: `Stok ${produk?.nama} (${produk?.code}) saat ini ${(item as any).jumlah}, di bawah minimum ${stokMin}`,
                        type: 'warning',
                        entity_type: 'inv_stok',
                        entity_id: item.id,
                    });
                }
            }

            if (notifications.length > 0) {
                await Notification.bulkCreate(notifications);
            }
        } catch (error) {
            console.error('Failed to check low stock notifications:', error);
        }
    }
}

export default new NotificationService();
