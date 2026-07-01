import { Request, Response, NextFunction } from 'express';
import { fn, col } from 'sequelize';
import FacilityBuilding from '../models/Building';
import FacilityRoom from '../models/Room';
import FacilityOccupant from '../models/Occupant';
import FacilityAsset from '../models/Asset';
import FacilityWorkOrder from '../models/WorkOrder';
import InvTransaksi from '../../inventory/models/Transaksi';
import InvTransaksiDetail from '../../inventory/models/TransaksiDetail';
import InvProduk from '../../inventory/models/Produk';
import InvUom from '../../inventory/models/Uom';

class FacilityDashboardController {
    async getSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const [
                totalBuildings,
                totalRooms,
                totalOccupants,
                openWorkOrders,
                workOrdersByStatusRaw,
                workOrdersByPriorityRaw,
                recentWorkOrders,
                assetsByConditionRaw,
                recentFacilityTransaksi,
            ] = await Promise.all([
                FacilityBuilding.count({ where: { status: 'Aktif' } }),
                FacilityRoom.count(),
                FacilityOccupant.count({ where: { status: 'Aktif' } }),
                FacilityWorkOrder.count({ where: { status: 'Open' } }),
                FacilityWorkOrder.findAll({
                    attributes: ['status', [fn('COUNT', col('id')), 'count']],
                    group: ['status'],
                    raw: true,
                }) as unknown as Promise<Array<{ status: string; count: number }>>,
                FacilityWorkOrder.findAll({
                    attributes: ['prioritas', [fn('COUNT', col('id')), 'count']],
                    group: ['prioritas'],
                    raw: true,
                }) as unknown as Promise<Array<{ prioritas: string; count: number }>>,
                FacilityWorkOrder.findAll({
                    include: [{ model: FacilityRoom, as: 'room', attributes: ['id', 'nama'] }],
                    order: [['created_at', 'DESC']],
                    limit: 5,
                }),
                FacilityAsset.findAll({
                    attributes: ['status', [fn('COUNT', col('id')), 'count']],
                    group: ['status'],
                    raw: true,
                }) as unknown as Promise<Array<{ status: string; count: number }>>,
                InvTransaksi.findAll({
                    where: { sub_tipe: 'Ke Gedung/Mess' },
                    include: [
                        { model: FacilityBuilding, as: 'facility_building', attributes: ['id', 'code', 'nama'] },
                        { model: FacilityRoom, as: 'facility_room', attributes: ['id', 'code', 'nama'] },
                        {
                            model: InvTransaksiDetail, as: 'details',
                            include: [
                                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                                { model: InvUom, as: 'uom', attributes: ['id', 'nama'] },
                            ],
                        },
                    ],
                    order: [['created_at', 'DESC']],
                    limit: 10,
                }),
            ]);

            const workOrdersByStatus = (workOrdersByStatusRaw || []).map((r: any) => ({
                status: r.status,
                count: Number(r.count),
            }));
            const workOrdersByPriority = (workOrdersByPriorityRaw || []).map((r: any) => ({
                prioritas: r.prioritas,
                count: Number(r.count),
            }));
            const assetsByCondition = (assetsByConditionRaw || []).map((r: any) => ({
                status: r.status,
                count: Number(r.count),
            }));

            res.json({
                status: 'success',
                data: {
                    totalBuildings,
                    totalRooms,
                    totalOccupants,
                    openWorkOrders,
                    workOrdersByStatus,
                    workOrdersByPriority,
                    recentWorkOrders,
                    assetsByCondition,
                    recentFacilityTransaksi,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new FacilityDashboardController();
