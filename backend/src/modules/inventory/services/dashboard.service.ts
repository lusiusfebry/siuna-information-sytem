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
    async getStats() {
        const totalProduk = await InvProduk.count({ where: { status: 'Aktif' } });

        const totalStokResult = await InvStok.findOne({
            attributes: [[Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('jumlah')), 0), 'total']],
            raw: true,
        }) as any;
        const totalStok = parseInt(totalStokResult?.total || '0', 10);

        const lowStockCount = await InvStok.count({
            include: [{
                model: InvProduk,
                as: 'produk',
                attributes: [],
                where: { status: 'Aktif' },
            }],
            where: Sequelize.where(
                Sequelize.col('jumlah'),
                Op.lt,
                Sequelize.fn('COALESCE', Sequelize.col('produk.stok_minimum'), 5)
            ),
            subQuery: false,
        } as any);

        const asetDipinjam = await InvSerialNumber.count({
            where: { karyawan_id: { [Op.ne]: null as any } },
        });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const transaksiBulanIni = await InvTransaksi.count({
            where: { created_at: { [Op.gte]: startOfMonth } },
        });

        return { totalProduk, totalStok, lowStockCount, asetDipinjam, transaksiBulanIni };
    }

    async getStockByWarehouse() {
        const data = await InvStok.findAll({
            attributes: [
                'gudang_id',
                [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'total_stok'],
            ],
            include: [{ model: InvGudang, as: 'gudang', attributes: ['id', 'nama'] }],
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

    async getCategoryBreakdown() {
        const data = await InvStok.findAll({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'total_stok'],
            ],
            include: [{
                model: InvProduk,
                as: 'produk',
                attributes: [],
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
            }],
            group: [Sequelize.col('produk.brand.sub_kategori.kategori.nama')],
            raw: true,
        });

        return (data as any[]).map((item: any) => ({
            type: item['produk.brand.sub_kategori.kategori.nama'] || 'Unknown',
            total_stok: parseInt(item.total_stok, 10),
        }));
    }

    async getRecentTransactions(limit = 10) {
        const transaksi = await InvTransaksi.findAll({
            include: [
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                { model: InvGudang, as: 'gudang_tujuan', attributes: ['id', 'code', 'nama'] },
                { model: Employee, as: 'karyawan', attributes: ['id', 'nama_lengkap'] },
                { model: User, as: 'creator', attributes: ['id', 'nama'] },
            ],
            order: [['created_at', 'DESC']],
            limit,
        });

        return transaksi;
    }

    async getLowStockItems() {
        const items = await InvStok.findAll({
            include: [
                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama', 'stok_minimum'], where: { status: 'Aktif' } },
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
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

    async getItemVelocity(days = 90) {
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
