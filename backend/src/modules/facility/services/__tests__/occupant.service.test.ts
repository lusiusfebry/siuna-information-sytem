import occupantService from '../occupant.service';
import FacilityOccupant from '../../models/Occupant';
import FacilityRoom from '../../models/Room';

// Locks the occupant capacity rules, including C-3 (update must re-check capacity
// on reactivation / room change, not only create).
jest.mock('../../models/Occupant', () => ({
    __esModule: true,
    default: { findByPk: jest.fn(), count: jest.fn(), create: jest.fn() },
}));
jest.mock('../../models/Room', () => ({
    __esModule: true,
    default: { findByPk: jest.fn() },
}));

const Occ = FacilityOccupant as any;
const Room = FacilityRoom as any;

beforeEach(() => jest.clearAllMocks());

describe('FacilityOccupantService.create capacity guard', () => {
    it('rejects when the room is already full', async () => {
        Room.findByPk.mockResolvedValue({ id: 1, kapasitas: 1, update: jest.fn() });
        Occ.count.mockResolvedValue(1); // already 1 active, capacity 1
        await expect(occupantService.create({ room_id: 1, employee_id: 9 }))
            .rejects.toMatchObject({ statusCode: 400 });
        expect(Occ.create).not.toHaveBeenCalled();
    });

    it('creates when capacity is available and marks room Penuh when it fills', async () => {
        const room = { id: 1, kapasitas: 1, update: jest.fn() };
        Room.findByPk.mockResolvedValue(room);
        Occ.count.mockResolvedValue(0);
        Occ.create.mockResolvedValue({ id: 5 });
        const res = await occupantService.create({ room_id: 1, employee_id: 9 });
        expect(res).toEqual({ id: 5 });
        expect(room.update).toHaveBeenCalledWith({ status: 'Penuh' });
    });
});

describe('FacilityOccupantService.update capacity guard (C-3)', () => {
    it('blocks moving an occupant into a FULL room (status stays Aktif)', async () => {
        const item = { id: 5, room_id: 2, status: 'Aktif', update: jest.fn() };
        Occ.findByPk.mockResolvedValue(item);
        Room.findByPk.mockResolvedValue({ id: 1, kapasitas: 1 });
        Occ.count.mockResolvedValue(1); // room 1 already full (excluding self)
        await expect(occupantService.update(5, { room_id: 1, status: 'Aktif' }))
            .rejects.toMatchObject({ statusCode: 400 });
        expect(item.update).not.toHaveBeenCalled();
    });

    it('blocks reactivating (Selesai -> Aktif) into a full room', async () => {
        const item = { id: 5, room_id: 1, status: 'Selesai', update: jest.fn() };
        Occ.findByPk.mockResolvedValue(item);
        Room.findByPk.mockResolvedValue({ id: 1, kapasitas: 1 });
        Occ.count.mockResolvedValue(1);
        await expect(occupantService.update(5, { status: 'Aktif' }))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    it('allows a non-capacity field update without touching room checks', async () => {
        const item = { id: 5, room_id: 1, status: 'Aktif', update: jest.fn().mockResolvedValue({ id: 5, keterangan: 'x' }) };
        Occ.findByPk.mockResolvedValue(item);
        const res = await occupantService.update(5, { keterangan: 'x' });
        expect(item.update).toHaveBeenCalled();
        expect(Room.findByPk).not.toHaveBeenCalled();
        expect(res).toMatchObject({ id: 5 });
    });

    it('returns null when the occupant does not exist', async () => {
        Occ.findByPk.mockResolvedValue(null);
        expect(await occupantService.update(999, { status: 'Aktif' })).toBeNull();
    });
});
