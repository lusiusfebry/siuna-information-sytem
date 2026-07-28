import { Sequelize, Op } from 'sequelize';
import InvStok from '../models/Stok';
import InvProduk from '../models/Produk';
import InvTransaksi from '../models/Transaksi';
import InvTransaksiDetail from '../models/TransaksiDetail';
import InvGudang from '../models/Gudang';

// Ambang batas jumlah transaksi untuk klasifikasi Fast vs Slow Moving.
export const FAST_MOVING_THRESHOLD = 10;

export interface VelocityItem {
    produk_id: number;
    produk_code?: string;
    produk_nama?: string;
    trx_count: number;
    total_qty: number;
    classification: 'Fast Moving' | 'Slow Moving' | 'Dead Stock';
}

export interface ItemVelocityResult {
    activeProducts: VelocityItem[];
    deadItems: VelocityItem[];
}

// Include options yang men-scope join InvGudang berdasarkan department (INV-M07).
// undefined/null = tanpa scoping (privileged); number (termasuk fail-closed -1) =
// INNER JOIN yang difilter ke department tsb. Cermin StokService.gudangDeptScope.
const gudangDeptScope = (departmentFilter?: number) => {
    if (departmentFilter === undefined || departmentFilter === null) return {};
    return { required: true, where: { department_id: departmentFilter } };
};

/**
 * Hitung klasifikasi pergerakan barang (item velocity) dalam periode `days` hari.
 * Sumber tunggal untuk dashboard & export inventory (F-3).
 * `departmentFilter` opsional men-scope hasil ke satu department (INV-M07).
 */
export async function computeItemVelocity(
    days = 90,
    departmentFilter?: number,
): Promise<ItemVelocityResult> {
    const scoped = departmentFilter !== undefined && departmentFilter !== null;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const activeData = await InvTransaksiDetail.findAll({
        attributes: [
            'produk_id',
            [Sequelize.fn('COUNT', Sequelize.col('InvTransaksiDetail.id')), 'trx_count'],
            [Sequelize.fn('SUM', Sequelize.col('InvTransaksiDetail.jumlah')), 'total_qty'],
        ],
        include: [
            {
                model: InvTransaksi,
                as: 'transaksi',
                attributes: [],
                where: { tanggal: { [Op.gte]: cutoffDate } },
                // Department scoping (INV-M07): scope velocity by the movement's source dept.
                include: scoped
                    ? [{ model: InvGudang, as: 'gudang', attributes: [], ...gudangDeptScope(departmentFilter) }]
                    : [],
            },
            {
                model: InvProduk,
                as: 'produk',
                attributes: ['id', 'code', 'nama'],
            },
        ],
        group: ['produk_id', 'produk.id'],
        raw: true,
        nest: true,
    });

    const activeProducts: VelocityItem[] = (activeData as any[]).map((item: any) => ({
        produk_id: item.produk_id,
        produk_code: item.produk?.code,
        produk_nama: item.produk?.nama,
        trx_count: parseInt(item.trx_count, 10),
        total_qty: parseInt(item.total_qty, 10),
        classification: parseInt(item.trx_count, 10) > FAST_MOVING_THRESHOLD ? 'Fast Moving' : 'Slow Moving',
    }));

    const activeIds = activeProducts.map(p => p.produk_id);
    const deadWhere: any = { jumlah: { [Op.gt]: 0 } };
    if (activeIds.length > 0) deadWhere.produk_id = { [Op.notIn]: activeIds };

    const deadStock = await InvStok.findAll({
        where: deadWhere,
        include: [
            { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
            // Department scoping (INV-M07): dead stock only within the caller's warehouses.
            ...(scoped
                ? [{ model: InvGudang, as: 'gudang', attributes: [], ...gudangDeptScope(departmentFilter) }]
                : []),
        ],
        attributes: ['produk_id', [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'total_stok']],
        group: ['produk_id', 'produk.id'],
        raw: true,
        nest: true,
    });

    const deadItems: VelocityItem[] = (deadStock as any[]).map((item: any) => ({
        produk_id: item.produk_id,
        produk_code: item.produk?.code,
        produk_nama: item.produk?.nama,
        trx_count: 0,
        total_qty: 0,
        classification: 'Dead Stock',
    }));

    return { activeProducts, deadItems };
}

/**
 * Susun daftar rata (flat) untuk laporan/export: Fast Moving lalu Slow Moving
 * (masing-masing terurut menurun berdasarkan trx_count), diikuti Dead Stock.
 */
export function flattenVelocityForReport(result: ItemVelocityResult): VelocityItem[] {
    const { activeProducts, deadItems } = result;
    return [
        ...activeProducts.filter(p => p.classification === 'Fast Moving').sort((a, b) => b.trx_count - a.trx_count),
        ...activeProducts.filter(p => p.classification === 'Slow Moving').sort((a, b) => b.trx_count - a.trx_count),
        ...deadItems,
    ];
}
