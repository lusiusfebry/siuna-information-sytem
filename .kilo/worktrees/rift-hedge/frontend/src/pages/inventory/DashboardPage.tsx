import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import StatCard from '../../components/dashboard/StatCard';
import { useInventoryStats, useStockByWarehouse, useCategoryBreakdown, useRecentInventoryTransactions, useLowStockItems, useItemVelocity } from '../../hooks/useInventoryDashboard';
import type { ItemVelocityItem } from '../../services/api/inventory-dashboard.service';
import inventoryDashboardService from '../../services/api/inventory-dashboard.service';
import { InvTransaksi, InvStok } from '../../types/inventory';

const PIE_COLORS = ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000'];
const TIPE_COLORS: Record<string, string> = {
    'Masuk': 'bg-green-100 text-green-800',
    'Keluar': 'bg-red-100 text-red-800',
    'Adjustment': 'bg-yellow-100 text-yellow-800',
};

const VELOCITY_TABS = [
    { key: 'fast', label: 'Fast Moving', color: 'text-green-600', icon: 'trending_up' },
    { key: 'slow', label: 'Slow Moving', color: 'text-yellow-600', icon: 'trending_flat' },
    { key: 'dead', label: 'Dead Stock', color: 'text-red-600', icon: 'trending_down' },
] as const;

const InventoryDashboardPage = () => {
    const { data: statsData, isLoading: statsLoading } = useInventoryStats();
    const { data: warehouseData } = useStockByWarehouse();
    const { data: categoryData } = useCategoryBreakdown();
    const { data: recentData } = useRecentInventoryTransactions(10);
    const { data: lowStockData } = useLowStockItems();
    const [exporting, setExporting] = useState<string | null>(null);
    const [velocityDays, setVelocityDays] = useState(90);
    const [velocityTab, setVelocityTab] = useState<'fast' | 'slow' | 'dead'>('fast');
    const { data: velocityData } = useItemVelocity(velocityDays);

    const stats = statsData?.data;

    const handleExport = async (type: 'excel' | 'pdf') => {
        setExporting(type);
        try {
            const blob = type === 'excel'
                ? await inventoryDashboardService.exportStokExcel()
                : await inventoryDashboardService.exportStokPDF();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = type === 'excel' ? `Stok-Inventaris.xlsx` : `Laporan-Stok.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`Export ${type.toUpperCase()} berhasil`);
        } catch {
            toast.error(`Gagal export ${type.toUpperCase()}`);
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Inventory</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Ringkasan data inventaris</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleExport('excel')} disabled={!!exporting} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                        <span className="material-symbols-outlined text-[16px]">table_view</span>
                        {exporting === 'excel' ? 'Exporting...' : 'Export Excel'}
                    </button>
                    <button onClick={() => handleExport('pdf')} disabled={!!exporting} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                        <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                        {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {statsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                            <div className="h-8 bg-gray-200 rounded w-1/2" />
                        </div>
                    ))
                ) : (
                    <>
                        <StatCard title="Total Produk" value={stats?.totalProduk || 0} icon="category" iconBgColor="bg-blue-100 text-blue-600" />
                        <StatCard title="Total Stok" value={stats?.totalStok || 0} icon="inventory_2" iconBgColor="bg-green-100 text-green-600" />
                        <StatCard title="Stok Rendah" value={stats?.lowStockCount || 0} icon="warning" iconBgColor="bg-red-100 text-red-600" />
                        <StatCard title="Aset Dipinjam" value={stats?.asetDipinjam || 0} icon="person" iconBgColor="bg-purple-100 text-purple-600" />
                        <StatCard title="Transaksi Bulan Ini" value={stats?.transaksiBulanIni || 0} icon="receipt_long" iconBgColor="bg-orange-100 text-orange-600" />
                    </>
                )}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Stok per Gudang</h3>
                    {warehouseData?.data?.length ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={warehouseData.data} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="gudang_nama" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="total_stok" fill="#4472C4" radius={[0, 4, 4, 0]} name="Total Stok" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">Belum ada data stok</div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Kategori Barang</h3>
                    {categoryData?.data?.length ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={categoryData.data} dataKey="total_stok" nameKey="type" cx="50%" cy="50%" innerRadius={60} outerRadius={90} label={({ type }) => type}>
                                    {categoryData.data.map((_: any, idx: number) => (
                                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">Belum ada data</div>
                    )}
                </div>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transactions */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Transaksi Terakhir</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800">
                                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Kode</th>
                                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Tipe</th>
                                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Gudang</th>
                                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!recentData?.data?.length ? (
                                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Belum ada transaksi</td></tr>
                                ) : (
                                    recentData.data.map((item: InvTransaksi) => (
                                        <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800">
                                            <td className="px-4 py-2.5 font-mono text-xs font-semibold">{item.code}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TIPE_COLORS[item.tipe] || ''}`}>{item.tipe}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{item.gudang?.nama}</td>
                                            <td className="px-4 py-2.5 text-gray-500">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Low Stock Items */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Stok Rendah</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800">
                                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Produk</th>
                                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Gudang</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-gray-500">Min</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-gray-500">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!lowStockData?.data?.length ? (
                                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Tidak ada stok rendah</td></tr>
                                ) : (
                                    lowStockData.data.map((item: InvStok) => (
                                        <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800">
                                            <td className="px-4 py-2.5">{item.produk?.nama} <span className="text-gray-400 text-xs">({item.produk?.code})</span></td>
                                            <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{item.gudang?.nama}</td>
                                            <td className="px-4 py-2.5 text-right text-gray-500">{(item.produk as any)?.stok_minimum ?? 5}</td>
                                            <td className="px-4 py-2.5 text-right font-semibold text-red-600">{item.jumlah}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Item Velocity Analysis */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Analisis Pergerakan Barang</h3>
                        {velocityData?.data && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                Fast: {velocityData.data.summary.fast} &middot; Slow: {velocityData.data.summary.slow} &middot; Dead: {velocityData.data.summary.dead}
                            </p>
                        )}
                    </div>
                    <select
                        value={velocityDays}
                        onChange={(e) => setVelocityDays(Number(e.target.value))}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    >
                        <option value={30}>30 Hari</option>
                        <option value={60}>60 Hari</option>
                        <option value={90}>90 Hari</option>
                    </select>
                </div>
                <div className="border-b border-gray-100 dark:border-gray-800 flex">
                    {VELOCITY_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setVelocityTab(tab.key)}
                            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                                velocityTab === tab.key
                                    ? `${tab.color} border-current`
                                    : 'text-gray-500 border-transparent hover:text-gray-700'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                            {tab.label}
                            {velocityData?.data && (
                                <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                                    {velocityData.data.summary[tab.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800">
                                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Kode</th>
                                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Produk</th>
                                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Jml Transaksi</th>
                                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Total Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const items: ItemVelocityItem[] = velocityTab === 'fast'
                                    ? velocityData?.data?.fast_moving || []
                                    : velocityTab === 'slow'
                                    ? velocityData?.data?.slow_moving || []
                                    : velocityData?.data?.dead_stock || [];
                                if (!items.length) return (
                                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>
                                );
                                return items.map((item) => (
                                    <tr key={item.produk_id} className="border-b border-gray-50 dark:border-gray-800">
                                        <td className="px-4 py-2.5 font-mono text-xs">{item.produk_code}</td>
                                        <td className="px-4 py-2.5">{item.produk_nama}</td>
                                        <td className="px-4 py-2.5 text-right">{item.trx_count}</td>
                                        <td className="px-4 py-2.5 text-right font-semibold">{item.total_qty}</td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryDashboardPage;
