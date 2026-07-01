import { useFacilityDashboardSummary } from '../../hooks/useFacilityDashboard';
import { FacWorkOrder } from '../../types/facility';
import { InvTransaksi } from '../../types/inventory';

const prioritasColor = (p: string) => {
    switch (p) {
        case 'Critical': return 'bg-red-100 text-red-800';
        case 'High': return 'bg-orange-100 text-orange-800';
        case 'Medium': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-green-100 text-green-800';
    }
};

const statusColor = (s: string) => {
    switch (s) {
        case 'Open': return 'bg-blue-100 text-blue-800';
        case 'In Progress': return 'bg-yellow-100 text-yellow-800';
        case 'Resolved': return 'bg-green-100 text-green-800';
        case 'Closed': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
                <span className="material-symbols-outlined text-white">{icon}</span>
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    </div>
);

const DashboardPage = () => {
    const { data: summaryData, isLoading } = useFacilityDashboardSummary();
    const summary = summaryData?.data;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Fasilitas</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Ringkasan data fasilitas</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
                                <div className="space-y-2">
                                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                                    <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Fasilitas</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Ringkasan data fasilitas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="apartment" label="Total Gedung" value={summary?.totalBuildings || 0} color="bg-blue-500" />
                <StatCard icon="meeting_room" label="Total Ruangan" value={summary?.totalRooms || 0} color="bg-indigo-500" />
                <StatCard icon="groups" label="Total Penghuni" value={summary?.totalOccupants || 0} color="bg-emerald-500" />
                <StatCard icon="build" label="Work Order Aktif" value={summary?.openWorkOrders || 0} color="bg-amber-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Work Orders by Status */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Work Order per Status</h2>
                    <div className="space-y-3">
                        {(summary?.workOrdersByStatus || []).map((item) => {
                            const total = (summary?.workOrdersByStatus || []).reduce((s, i) => s + i.count, 0) || 1;
                            const pct = Math.round((item.count / total) * 100);
                            return (
                                <div key={item.status} className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium min-w-[90px] text-center ${statusColor(item.status)}`}>{item.status}</span>
                                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                        <div className={`h-2.5 rounded-full ${item.status === 'Open' ? 'bg-blue-500' : item.status === 'In Progress' ? 'bg-yellow-500' : item.status === 'Resolved' ? 'bg-green-500' : 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[30px] text-right">{item.count}</span>
                                </div>
                            );
                        })}
                        {(!summary?.workOrdersByStatus || summary.workOrdersByStatus.length === 0) && (
                            <p className="text-sm text-gray-400 text-center py-4">Belum ada data work order</p>
                        )}
                    </div>
                </div>

                {/* Work Orders by Priority */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Work Order per Prioritas</h2>
                    <div className="space-y-3">
                        {(summary?.workOrdersByPriority || []).map((item) => {
                            const total = (summary?.workOrdersByPriority || []).reduce((s, i) => s + i.count, 0) || 1;
                            const pct = Math.round((item.count / total) * 100);
                            return (
                                <div key={item.prioritas} className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium min-w-[90px] text-center ${prioritasColor(item.prioritas)}`}>{item.prioritas}</span>
                                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                        <div className={`h-2.5 rounded-full ${item.prioritas === 'Critical' ? 'bg-red-500' : item.prioritas === 'High' ? 'bg-orange-500' : item.prioritas === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[30px] text-right">{item.count}</span>
                                </div>
                            );
                        })}
                        {(!summary?.workOrdersByPriority || summary.workOrdersByPriority.length === 0) && (
                            <p className="text-sm text-gray-400 text-center py-4">Belum ada data work order</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Work Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Work Order Terbaru</h2>
                {(summary?.recentWorkOrders || []).length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Code</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Judul</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Ruangan</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Prioritas</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Status</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(summary?.recentWorkOrders || []).map((wo: FacWorkOrder) => (
                                    <tr key={wo.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="py-3 px-2 text-gray-600 dark:text-gray-300">{wo.code}</td>
                                        <td className="py-3 px-2 text-gray-900 dark:text-white font-medium">{wo.judul}</td>
                                        <td className="py-3 px-2 text-gray-600 dark:text-gray-300">{wo.room?.nama || '-'}</td>
                                        <td className="py-3 px-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioritasColor(wo.prioritas)}`}>{wo.prioritas}</span></td>
                                        <td className="py-3 px-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(wo.status)}`}>{wo.status}</span></td>
                                        <td className="py-3 px-2 text-gray-600 dark:text-gray-300">{new Date(wo.tanggal_lapor).toLocaleDateString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 text-center py-8">Belum ada work order</p>
                )}
            </div>

            {/* Recent Inventory Distribution to Facility */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-blue-500">inventory_2</span>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Distribusi Inventory ke Fasilitas</h2>
                </div>
                {(summary?.recentFacilityTransaksi || []).length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Code</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Tanggal</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Gedung</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Ruangan</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Item</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(summary?.recentFacilityTransaksi || []).map((trx: InvTransaksi) => (
                                    <tr key={trx.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="py-3 px-2 text-gray-600 dark:text-gray-300 font-mono text-xs">{trx.code}</td>
                                        <td className="py-3 px-2 text-gray-600 dark:text-gray-300">{new Date(trx.tanggal).toLocaleDateString('id-ID')}</td>
                                        <td className="py-3 px-2 text-gray-900 dark:text-white font-medium">{trx.facility_building?.nama || '-'}</td>
                                        <td className="py-3 px-2 text-gray-600 dark:text-gray-300">{trx.facility_room?.nama || '-'}</td>
                                        <td className="py-3 px-2">
                                            <div className="space-y-0.5">
                                                {(trx.details || []).map((d, idx) => (
                                                    <div key={idx} className="text-gray-600 dark:text-gray-300 text-xs">
                                                        {d.produk?.nama} <span className="text-gray-400">x{d.jumlah} {d.uom?.nama}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 text-center py-8">Belum ada distribusi inventory ke fasilitas</p>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
