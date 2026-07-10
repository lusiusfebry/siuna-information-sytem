import workOrderService from '../work-order.service';
import FacilityWorkOrder from '../../models/WorkOrder';

// Locks RT-1: work order create must supply the NOT NULL tanggal_lapor (defaulting
// to today) and generate a code, so create never fails with a notNull violation.
jest.mock('../../models/WorkOrder', () => ({
    __esModule: true,
    default: { findOne: jest.fn(), create: jest.fn(), findByPk: jest.fn() },
}));
jest.mock('../../models/Room', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/MaintenanceCategory', () => ({ __esModule: true, default: {} }));
jest.mock('../../../hr/models', () => ({ __esModule: true, Employee: {} }));
jest.mock('../../../../shared/services/cache.service', () => ({ __esModule: true, default: { delPattern: jest.fn() } }));

const WO = FacilityWorkOrder as any;

beforeEach(() => jest.clearAllMocks());

describe('FacilityWorkOrderService.create (RT-1)', () => {
    it('defaults tanggal_lapor to today and generates a code when omitted', async () => {
        WO.findOne.mockResolvedValue(null); // no prior code -> FWO-0001
        WO.create.mockImplementation(async (payload: any) => ({ id: 1, ...payload }));

        const res = await workOrderService.create({ judul: 'AC rusak', room_id: 2, prioritas: 'High' });

        expect(WO.create).toHaveBeenCalledTimes(1);
        const payload = WO.create.mock.calls[0][0];
        expect(payload.tanggal_lapor).toBeTruthy();
        expect(payload.tanggal_lapor).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(payload.code).toBe('FWO-0001');
        expect(res).toMatchObject({ judul: 'AC rusak' });
    });

    it('keeps a caller-supplied tanggal_lapor', async () => {
        WO.findOne.mockResolvedValue({ code: 'FWO-0004' });
        WO.create.mockImplementation(async (payload: any) => ({ id: 2, ...payload }));

        await workOrderService.create({ judul: 'x', room_id: 1, tanggal_lapor: '2026-01-02' });

        const payload = WO.create.mock.calls[0][0];
        expect(payload.tanggal_lapor).toBe('2026-01-02');
        expect(payload.code).toBe('FWO-0005'); // incremented from FWO-0004
    });
});
