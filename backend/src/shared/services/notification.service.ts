import { Op } from 'sequelize';
import Notification from '../models/Notification';
import InvStok from '../../modules/inventory/models/Stok';
import InvProduk from '../../modules/inventory/models/Produk';
import InvSerialNumber from '../../modules/inventory/models/SerialNumber';
import InvTransaksi from '../../modules/inventory/models/Transaksi';
import Employee from '../../modules/hr/models/Employee';
import FacilityAsset from '../../modules/facility/models/Asset';
import { User } from '../../modules/auth/models/User';
import { Role } from '../../modules/auth/models/Role';
import { Permission } from '../../modules/auth/models/Permission';
import { env } from '../../config/env';
import { Sequelize } from 'sequelize';

// Turn a "N days ago" threshold into a YYYY-MM-DD boundary. Transaction dates and
// facility placement dates are DATEONLY, so we compare on date strings, not timestamps.
const daysAgoDateString = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
};

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

    // Inventory-stock stakeholders: users whose role grants inventory_stock read/create,
    // plus superadmin. RBAC permissions live in a join table (belongsToMany), not a JSON
    // column, so we join roleDetails->permissions. Shared by every inventory notifier.
    private async getInventoryStockUsers() {
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
        return users.filter((u: any) =>
            u.roleDetails?.name === 'superadmin' ||
            (u.roleDetails?.permissions && u.roleDetails.permissions.length > 0)
        );
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

            const targetUsers = await this.getInventoryStockUsers();

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

    // Fan a set of reminders out to every stock stakeholder, skipping (user, entity)
    // pairs that already have an UNREAD notification of the same entity_type — so a
    // daily scan nudges once and stops spamming until the admin reads/acts on it.
    private async dispatchReminders(
        entityType: string,
        items: Array<{ entityId: number; title: string; message: string }>,
        targetUsers: Array<{ id: number }>
    ) {
        if (items.length === 0 || targetUsers.length === 0) return 0;

        const entityIds = items.map((i) => i.entityId);
        const existing = await Notification.findAll({
            where: { entity_type: entityType, entity_id: { [Op.in]: entityIds }, is_read: false },
            attributes: ['user_id', 'entity_id'],
            raw: true,
        });
        const alreadyNotified = new Set(
            (existing as any[]).map((e) => `${e.user_id}:${e.entity_id}`)
        );

        const notifications: any[] = [];
        for (const item of items) {
            for (const user of targetUsers) {
                if (alreadyNotified.has(`${user.id}:${item.entityId}`)) continue;
                notifications.push({
                    user_id: user.id,
                    title: item.title,
                    message: item.message,
                    type: 'warning',
                    entity_type: entityType,
                    entity_id: item.entityId,
                });
            }
        }

        if (notifications.length > 0) {
            await Notification.bulkCreate(notifications);
        }
        return notifications.length;
    }

    // INV-N08: nudge admins about assets that have been sitting in one state too long.
    // The schema has no due-date column, so we derive "how long" from the date of the
    // last transaction (serials) or the placement date (facility). Thresholds and cron
    // are configurable via env.assetReminder. Safe to run daily — dedup prevents spam.
    async checkAssetRemindersAndNotify() {
        try {
            const targetUsers = await this.getInventoryStockUsers();
            if (targetUsers.length === 0) return;

            const { damagedDays, custodyDays, facilityDays } = env.assetReminder;

            // 1) Damaged units not yet disposed, stale past the threshold. "Since" is the
            // date of the transaction that last touched the serial (i.e. flipped it to Rusak).
            const damagedCutoff = daysAgoDateString(damagedDays);
            const damaged = await InvSerialNumber.findAll({
                where: { status: 'Rusak' },
                include: [
                    { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                    { model: InvTransaksi, as: 'transaksi_terakhir', attributes: ['id', 'tanggal'], required: true, where: { tanggal: { [Op.lte]: damagedCutoff } } },
                ],
            });
            const damagedItems = damaged.map((sn: any) => {
                const ident = sn.serial_number || sn.tag_number || `#${sn.id}`;
                const since = sn.transaksi_terakhir?.tanggal;
                return {
                    entityId: sn.id,
                    title: 'Barang Rusak Menunggu Tindak Lanjut',
                    message: `${sn.produk?.nama} (${ident}) berstatus Rusak sejak ${since} dan belum di-disposal/perbaiki (lebih dari ${damagedDays} hari)`,
                };
            });

            // 2) Units held by an employee (Digunakan, karyawan_id set) past the custody
            // threshold, measured from the last transaction (the handover "Ke Karyawan").
            const custodyCutoff = daysAgoDateString(custodyDays);
            const custody = await InvSerialNumber.findAll({
                where: { status: 'Digunakan', karyawan_id: { [Op.ne]: null } },
                include: [
                    { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                    { model: Employee, as: 'karyawan', attributes: ['id', 'nama_lengkap', 'nomor_induk_karyawan'], paranoid: false },
                    { model: InvTransaksi, as: 'transaksi_terakhir', attributes: ['id', 'tanggal'], required: true, where: { tanggal: { [Op.lte]: custodyCutoff } } },
                ],
            });
            const custodyItems = custody.map((sn: any) => {
                const ident = sn.serial_number || sn.tag_number || `#${sn.id}`;
                const emp = sn.karyawan?.nama_lengkap || 'karyawan';
                const since = sn.transaksi_terakhir?.tanggal;
                return {
                    entityId: sn.id,
                    title: 'Aset Karyawan Perlu Ditinjau',
                    message: `${sn.produk?.nama} (${ident}) dipegang ${emp} sejak ${since} (lebih dari ${custodyDays} hari) — pertimbangkan review/tarik`,
                };
            });

            // 3) Active facility placements older than the threshold, measured from
            // tanggal_penempatan on the facility_assets row.
            const facilityCutoff = daysAgoDateString(facilityDays);
            const placements = await FacilityAsset.findAll({
                where: { status: 'Aktif', tanggal_penempatan: { [Op.lte]: facilityCutoff } },
                include: [
                    { association: 'serial_number', include: [{ association: 'produk' }] },
                    { association: 'room', include: [{ association: 'building' }] },
                ],
            });
            const facilityItems = placements.map((p: any) => {
                const sn = p.serial_number;
                const ident = sn?.serial_number || sn?.tag_number || `#${p.serial_number_id}`;
                const prod = sn?.produk?.nama || 'Aset';
                const loc = p.room?.building?.nama
                    ? `${p.room.building.nama}${p.room?.nama ? ' · ' + p.room.nama : ''}`
                    : 'gedung/mess';
                return {
                    entityId: p.id,
                    title: 'Aset di Gedung/Mess Perlu Diaudit',
                    message: `${prod} (${ident}) terpasang di ${loc} sejak ${p.tanggal_penempatan} (lebih dari ${facilityDays} hari)`,
                };
            });

            const created =
                (await this.dispatchReminders('inv_serial_rusak', damagedItems, targetUsers)) +
                (await this.dispatchReminders('inv_serial_custody', custodyItems, targetUsers)) +
                (await this.dispatchReminders('facility_asset', facilityItems, targetUsers));

            if (created > 0) {
                console.log(`Asset reminders: created ${created} notification(s).`);
            }
        } catch (error) {
            console.error('Failed to check asset reminders:', error);
        }
    }
}

export default new NotificationService();
