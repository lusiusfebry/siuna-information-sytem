import { Sequelize, Op } from 'sequelize';
import InvProduk from '../models/Produk';
import InvStok from '../models/Stok';
import InvTransaksi from '../models/Transaksi';
import InvTransaksiDetail from '../models/TransaksiDetail';
import InvSerialNumber from '../models/SerialNumber';
import InvGudang from '../models/Gudang';
import InvKategori from '../models/Kategori';
import InvSubKategori from '../models/SubKategori';
import InvBrand from '../models/Brand';
import InvUom from '../models/Uom';
import Employee from '../../hr/models/Employee';
import User from '../../auth/models/User';

class InventoryDashboardService {
    // Include options that scope a joined InvGudang by department (INV-M07). undefined =
    // privileged role (no scoping); a number (incl. fail-closed -1) = INNER JOIN filtered
    // to that department. Mirrors StokService.gudangDeptScope.
    private gudangDeptScope(departmentFilter?: number) {
        if (departmentFilter === undefined || departmentFilter === null) return {};
        return { required: true, where: { department_id: departmentFilter } };
    }

    async getStats(departmentFilter?: number) {
        const scoped = departmentFilter !== undefined && departmentFilter !== null;
        const gudangInclude = { model: InvGudang, as: 'gudang', attributes: [], ...this.gudangDeptScope(departmentFilter) };

        // Product catalog count is global (a product is not tied to a single warehouse);
        // it is not department-scopable and stays global by design (INV-M07).
        const totalProduk = await InvProduk.count({ where: { status: 'Aktif' } });

        const totalStokResult = await InvStok.findOne({
            attributes: [[Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('jumlah')), 0), 'total']],
            include: scoped ? [gudangInclude] : [],
            raw: true,
        }) as any;
        const totalStok = parseInt(totalStokResult?.total || '0', 10);

        const lowStockCount = await InvStok.count({
            include: [
                {
                    model: InvProduk,
                    as: 'produk',
                    attributes: [],
                    where: { status: 'Aktif' },
                },
                ...(scoped ? [gudangInclude] : []),
            ],
            where: Sequelize.where(
                Sequelize.col('jumlah'),
                Op.lt,
                Sequelize.fn('COALESCE', Sequelize.col('produk.stok_minimum'), 5)
            ),
            subQuery: false,
        } as any);

        // Borrowed assets are assigned to an employee and carry gudang_id=null (not in any
        // warehouse), so they have no department anchor and stay global by design (INV-M07).
        const asetDipinjam = await InvSerialNumber.count({
            where: { karyawan_id: { [Op.ne]: null as any } },
        });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const transaksiBulanIni = await InvTransaksi.count({
            where: { created_at: { [Op.gte]: startOfMonth } },
            include: scoped ? [gudangInclude] : [],
        });

        return { totalProduk, totalStok, lowStockCount, asetDipinjam, transaksiBulanIni };
    }

    async getStockByWarehouse(departmentFilter?: number) {
        const data = await InvStok.findAll({
            attributes: [
                'gudang_id',
                [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'total_stok'],
            ],
            include: [
                { model: InvGudang, as: 'gudang', attributes: ['id', 'nama'], ...this.gudangDeptScope(departmentFilter) },
                // Count only active products, consistent with the stats/low-stock cards.
                { model: InvProduk, as: 'produk', attributes: [], where: { status: 'Aktif' } },
            ],
            group: ['gudang_id', 'gudang.id'],
            raw: true,
            nest: true,
        });

        return data.map((item: any) => ({
            gudang_id: item.gudang_id,
            gudang_nama: item.gudang?.nama || 'Unknown',
            total_stok: parseInt(item.total_stok, 10),
        }));
    }

    async getCategoryBreakdown(departmentFilter?: number) {
        const scoped = departmentFilter !== undefined && departmentFilter !== null;
        const data = await InvStok.findAll({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'total_stok'],
            ],
            include: [
                {
                    model: InvProduk,
                    as: 'produk',
                    attributes: [],
                    where: { status: 'Aktif' },
                    include: [{
                        model: InvBrand,
                        as: 'brand',
                        attributes: [],
                        include: [{
                            model: InvSubKategori,
                            as: 'sub_kategori',
                            attributes: [],
                            include: [{
                                model: InvKategori,
                                as: 'kategori',
                                attributes: [],
                            }],
                        }],
                    }],
                },
                // Department scoping (INV-M07): only aggregate stock from warehouses of the dept.
                ...(scoped ? [{ model: InvGudang, as: 'gudang', attributes: [], ...this.gudangDeptScope(departmentFilter) }] : []),
            ],
            group: [Sequelize.col('produk.brand.sub_kategori.kategori.nama')],
            raw: true,
        });

        return (data as any[]).map((item: any) => ({
            type: item['produk.brand.sub_kategori.kategori.nama'] || 'Unknown',
            total_stok: parseInt(item.total_stok, 10),
        }));
    }

    async getRecentTransactions(limit = 10, departmentFilter?: number) {
        const transaksi = await InvTransaksi.findAll({
            include: [
                // Department scoping (INV-M07): scope recent movements by source warehouse's dept.
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'], ...this.gudangDeptScope(departmentFilter) },
                { model: InvGudang, as: 'gudang_tujuan', attributes: ['id', 'code', 'nama'] },
                { model: Employee, as: 'karyawan', attributes: ['id', 'nama_lengkap'] , paranoid: false },
                { model: User, as: 'creator', attributes: ['id', 'nama'] },
            ],
            order: [['created_at', 'DESC']],
            limit,
        });

        return transaksi;
    }

    async getLowStockItems(departmentFilter?: number) {
        const items = await InvStok.findAll({
            include: [
                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama', 'stok_minimum'], where: { status: 'Aktif' } },
                // Department scoping (INV-M07).
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'], ...this.gudangDeptScope(departmentFilter) },
                { model: InvUom, as: 'uom', attributes: ['id', 'nama'] },
            ],
            where: Sequelize.where(
                Sequelize.col('jumlah'),
                Op.lt,
                Sequelize.fn('COALESCE', Sequelize.col('produk.stok_minimum'), 5)
            ),
            order: [['jumlah', 'ASC']],
            limit: 20,
            subQuery: false,
        });

        return items;
    }

    async getItemVelocity(days = 90, departmentFilter?: number) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const data = await InvTransaksiDetail.findAll({
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
                    include: (departmentFilter !== undefined && departmentFilter !== null)
                        ? [{ model: InvGudang, as: 'gudang', attributes: [], ...this.gudangDeptScope(departmentFilter) }]
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

        const activeProducts = (data as any[]).map((item: any) => ({
            produk_id: item.produk_id,
            produk_code: item.produk?.code,
            produk_nama: item.produk?.nama,
            trx_count: parseInt(item.trx_count, 10),
            total_qty: parseInt(item.total_qty, 10),
            classification: parseInt(item.trx_count, 10) > 10 ? 'Fast Moving' : 'Slow Moving',
        }));

        const activeIds = activeProducts.map(p => p.produk_id);
        const deadWhere: any = { jumlah: { [Op.gt]: 0 } };
        if (activeIds.length > 0) deadWhere.produk_id = { [Op.notIn]: activeIds };

        const deadStock = await InvStok.findAll({
            where: deadWhere,
            include: [
                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                // Department scoping (INV-M07): dead stock only within the caller's warehouses.
                ...((departmentFilter !== undefined && departmentFilter !== null)
                    ? [{ model: InvGudang, as: 'gudang', attributes: [], ...this.gudangDeptScope(departmentFilter) }]
                    : []),
            ],
            attributes: ['produk_id', [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'total_stok']],
            group: ['produk_id', 'produk.id'],
            raw: true,
            nest: true,
        });

        const deadItems = (deadStock as any[]).map((item: any) => ({
            produk_id: item.produk_id,
            produk_code: item.produk?.code,
            produk_nama: item.produk?.nama,
            trx_count: 0,
            total_qty: 0,
            classification: 'Dead Stock',
        }));

        return {
            period_days: days,
            fast_moving: activeProducts.filter(p => p.classification === 'Fast Moving'),
            slow_moving: activeProducts.filter(p => p.classification === 'Slow Moving'),
            dead_stock: deadItems,
            summary: {
                fast: activeProducts.filter(p => p.classification === 'Fast Moving').length,
                slow: activeProducts.filter(p => p.classification === 'Slow Moving').length,
                dead: deadItems.length,
            },
        };
    }
}

export default new InventoryDashboardService();
