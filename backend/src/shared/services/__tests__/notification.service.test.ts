import notificationService from '../notification.service';
import Notification from '../../models/Notification';
import InvStok from '../../../modules/inventory/models/Stok';
import { User } from '../../../modules/auth/models/User';

// Locks notification behavior:
//  - RT-3: low-stock notifications ARE created, targeting users whose role grants
//    inventory_stock (via belongsToMany permissions), and superadmin.
//  - per-user scoping of read operations (a user cannot mark another's notif).
jest.mock('../../models/Notification', () => ({
    __esModule: true,
    default: { findAndCountAll: jest.fn(), count: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), update: jest.fn(), bulkCreate: jest.fn() },
}));
jest.mock('../../../modules/inventory/models/Stok', () => ({ __esModule: true, default: { findAll: jest.fn() } }));
jest.mock('../../../modules/inventory/models/Produk', () => ({ __esModule: true, default: {} }));
jest.mock('../../../modules/auth/models/User', () => ({ __esModule: true, User: { findAll: jest.fn() } }));
jest.mock('../../../modules/auth/models/Role', () => ({ __esModule: true, Role: {} }));
jest.mock('../../../modules/auth/models/Permission', () => ({ __esModule: true, Permission: {} }));

const Notif = Notification as any;
const Stok = InvStok as any;
const Usr = User as any;

beforeEach(() => {
    jest.clearAllMocks();
    // Default: no existing unread notifications (dedup query returns empty).
    Notif.findAll.mockResolvedValue([]);
});

describe('NotificationService read-path scoping', () => {
    it('getUnreadCount is scoped to the user', async () => {
        Notif.count.mockResolvedValue(3);
        const n = await notificationService.getUnreadCount(7);
        expect(n).toBe(3);
        expect(Notif.count).toHaveBeenCalledWith({ where: { user_id: 7, is_read: false } });
    });

    it('markAsRead only matches the caller user_id and returns null for a foreign notif', async () => {
        Notif.findOne.mockResolvedValue(null); // id belongs to someone else
        const res = await notificationService.markAsRead(99, 7);
        expect(res).toBeNull();
        expect(Notif.findOne).toHaveBeenCalledWith({ where: { id: 99, user_id: 7 } });
    });

    it('markAllAsRead is scoped to the user', async () => {
        Notif.update.mockResolvedValue([1]);
        await notificationService.markAllAsRead(7);
        expect(Notif.update).toHaveBeenCalledWith({ is_read: true }, { where: { user_id: 7, is_read: false } });
    });
});

describe('NotificationService.checkLowStockAndNotify (RT-3)', () => {
    it('creates a notification per low-stock item x targeted user', async () => {
        Stok.findAll.mockResolvedValue([
            { id: 11, jumlah: 2, produk: { id: 1, code: 'IPR-0001', nama: 'Laptop', stok_minimum: 5 } },
        ]);
        // one staff with a matching permission + one superadmin (no explicit perm)
        Usr.findAll.mockResolvedValue([
            { id: 100, roleDetails: { name: 'staff', permissions: [{ resource: 'inventory_stock', action: 'read' }] } },
            { id: 1, roleDetails: { name: 'superadmin', permissions: [] } },
        ]);
        await notificationService.checkLowStockAndNotify([1]);
        expect(Notif.bulkCreate).toHaveBeenCalledTimes(1);
        const payload = Notif.bulkCreate.mock.calls[0][0];
        expect(payload).toHaveLength(2); // 1 item x 2 target users
        expect(payload[0]).toMatchObject({ title: 'Stok Rendah', entity_type: 'inv_stok', entity_id: 11 });
        expect(payload.map((p: any) => p.user_id).sort()).toEqual([1, 100]);
    });

    it('does nothing when no items are below minimum', async () => {
        Stok.findAll.mockResolvedValue([]);
        await notificationService.checkLowStockAndNotify([1]);
        expect(Notif.bulkCreate).not.toHaveBeenCalled();
    });

    it('excludes non-privileged users without a matching permission', async () => {
        Stok.findAll.mockResolvedValue([
            { id: 11, jumlah: 1, produk: { id: 1, code: 'IPR-0001', nama: 'Laptop', stok_minimum: 5 } },
        ]);
        Usr.findAll.mockResolvedValue([
            { id: 50, roleDetails: { name: 'employee', permissions: [] } }, // no inventory_stock perm
        ]);
        await notificationService.checkLowStockAndNotify([1]);
        expect(Notif.bulkCreate).not.toHaveBeenCalled();
    });

    it('dedups: skips a user who already has an UNREAD notif for the same stok (C-5)', async () => {
        Stok.findAll.mockResolvedValue([
            { id: 11, jumlah: 2, produk: { id: 1, code: 'IPR-0001', nama: 'Laptop', stok_minimum: 5 } },
        ]);
        Usr.findAll.mockResolvedValue([
            { id: 100, roleDetails: { name: 'staff', permissions: [{ resource: 'inventory_stock', action: 'read' }] } },
            { id: 200, roleDetails: { name: 'staff', permissions: [{ resource: 'inventory_stock', action: 'read' }] } },
        ]);
        // user 100 already has an unread notif for stok 11 → only user 200 gets one.
        Notif.findAll.mockResolvedValue([{ user_id: 100, entity_id: 11 }]);
        await notificationService.checkLowStockAndNotify([1]);
        expect(Notif.bulkCreate).toHaveBeenCalledTimes(1);
        const payload = Notif.bulkCreate.mock.calls[0][0];
        expect(payload).toHaveLength(1);
        expect(payload[0].user_id).toBe(200);
    });
});
