import { Op } from 'sequelize';
import Notification from '../models/Notification';
import InvStok from '../../modules/inventory/models/Stok';
import InvProduk from '../../modules/inventory/models/Produk';
import { User } from '../../modules/auth/models/User';
import { Role } from '../../modules/auth/models/Role';
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

            const users = await User.findAll({
                include: [{
                    model: Role,
                    as: 'roleDetails',
                    where: {
                        permissions: {
                            [Op.or]: [
                                { [Op.contains]: { inventory_stock: ['read'] } },
                                { [Op.contains]: { inventory_stock: ['create'] } },
                            ]
                        } as any,
                    },
                }],
                where: { is_active: true },
            });

            const notifications: any[] = [];
            for (const item of lowStockItems) {
                const produk = (item as any).produk;
                const stokMin = produk?.stok_minimum ?? 5;

                for (const user of users) {
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
