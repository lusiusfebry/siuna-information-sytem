import notificationService from '../notification.service';
import Notification from '../../models/Notification';
import InvStok from '../../../modules/inventory/models/Stok';
import InvSerialNumber from '../../../modules/inventory/models/SerialNumber';
import FacilityAsset from '../../../modules/facility/models/Asset';
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
jest.mock('../../../modules/inventory/models/SerialNumber', () => ({ __esModule: true, default: { findAll: jest.fn() } }));
jest.mock('../../../modules/inventory/models/Transaksi', () => ({ __esModule: true, default: {} }));
jest.mock('../../../modules/hr/models/Employee', () => ({ __esModule: true, default: {} }));
jest.mock('../../../modules/facility/models/Asset', () => ({ __esModule: true, default: { findAll: jest.fn() } }));
jest.mock('../../../modules/auth/models/User', () => ({ __esModule: true, User: { findAll: jest.fn() } }));
jest.mock('../../../modules/auth/models/Role', () => ({ __esModule: true, Role: {} }));
jest.mock('../../../modules/auth/models/Permission', () => ({ __esModule: true, Permission: {} }));

const Notif = Notification as any;
const Stok = InvStok as any;
const Serial = InvSerialNumber as any;
const FacAsset = FacilityAsset as any;
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

describe('NotificationService.checkAssetRemindersAndNotify (INV-N08)', () => {
    const staffUser = { id: 100, roleDetails: { name: 'staff', permissions: [{ resource: 'inventory_stock', action: 'read' }] } };

    it('creates reminders for damaged, custody and facility items with distinct entity_types', async () => {
        Usr.findAll.mockResolvedValue([staffUser]);
        // Serial.findAll is called twice: first for damaged, then for custody.
        Serial.findAll
            .mockResolvedValueOnce([
                { id: 11, serial_number: 'SN-A', produk: { nama: 'Bor' }, transaksi_terakhir: { tanggal: '2024-01-01' } },
            ])
            .mockResolvedValueOnce([
                { id: 22, serial_number: 'SN-B', produk: { nama: 'Laptop' }, karyawan: { nama_lengkap: 'Budi' }, transaksi_terakhir: { tanggal: '2023-06-01' } },
            ]);
        FacAsset.findAll.mockResolvedValue([
            { id: 33, serial_number_id: 5, tanggal_penempatan: '2023-01-01', serial_number: { serial_number: 'SN-C', produk: { nama: 'AC' } }, room: { nama: 'K-101', building: { nama: 'Mess A' } } },
        ]);

        await notificationService.checkAssetRemindersAndNotify();

        // three dispatch batches → three bulkCreate calls (one per non-empty group)
        expect(Notif.bulkCreate).toHaveBeenCalledTimes(3);
        const allPayloads = Notif.bulkCreate.mock.calls.flatMap((c: any) => c[0]);
        const byType = allPayloads.reduce((acc: any, p: any) => { acc[p.entity_type] = p; return acc; }, {});
        expect(byType.inv_serial_rusak).toMatchObject({ entity_id: 11, user_id: 100 });
        expect(byType.inv_serial_custody).toMatchObject({ entity_id: 22, user_id: 100 });
        expect(byType.facility_asset).toMatchObject({ entity_id: 33, user_id: 100 });
    });

    it('does nothing when there are no target users', async () => {
        Usr.findAll.mockResolvedValue([]); // no inventory stakeholders
        await notificationService.checkAssetRemindersAndNotify();
        expect(Serial.findAll).not.toHaveBeenCalled();
        expect(Notif.bulkCreate).not.toHaveBeenCalled();
    });

    it('creates nothing when no assets are stale', async () => {
        Usr.findAll.mockResolvedValue([staffUser]);
        Serial.findAll.mockResolvedValue([]);
        FacAsset.findAll.mockResolvedValue([]);
        await notificationService.checkAssetRemindersAndNotify();
        expect(Notif.bulkCreate).not.toHaveBeenCalled();
    });

    it('dedups damaged reminders against existing unread notifs', async () => {
        Usr.findAll.mockResolvedValue([staffUser]);
        Serial.findAll
            .mockResolvedValueOnce([
                { id: 11, serial_number: 'SN-A', produk: { nama: 'Bor' }, transaksi_terakhir: { tanggal: '2024-01-01' } },
            ])
            .mockResolvedValueOnce([]);
        FacAsset.findAll.mockResolvedValue([]);
        // user 100 already has an unread damaged reminder for serial 11
        Notif.findAll.mockResolvedValue([{ user_id: 100, entity_id: 11 }]);
        await notificationService.checkAssetRemindersAndNotify();
        expect(Notif.bulkCreate).not.toHaveBeenCalled();
    });
});
