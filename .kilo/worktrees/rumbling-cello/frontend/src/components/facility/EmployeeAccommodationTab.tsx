import { useOccupantList } from '../../hooks/useFacilityOccupant';
import { FacOccupant } from '../../types/facility';

interface Props {
    employeeId: number;
}

const STATUS_COLORS: Record<string, string> = {
    'Aktif': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Selesai': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
};

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const EmployeeAccommodationTab: React.FC<Props> = ({ employeeId }) => {
    const { data, isLoading } = useOccupantList({ employee_id: employeeId, limit: 50 });

    const occupancies: FacOccupant[] = data?.data || [];
    const activeOccupancy = occupancies.find(o => o.status === 'Aktif');
    const pastOccupancies = occupancies.filter(o => o.status === 'Selesai');

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="premium-card p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                ))}
            </div>
        );
    }

    if (!occupancies.length) {
        return (
            <div className="premium-card p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">hotel</span>
                <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Belum Ada Data Akomodasi</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Karyawan ini belum pernah menempati ruangan fasilitas
                </p>
            </div>
        );
    }
    return (
        <div className="space-y-6">
            {/* Active Occupancy */}
            {activeOccupancy && (
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Akomodasi Aktif</h3>
                    <div className="premium-card p-6 border-l-4 border-green-500">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600">
                                    <span className="material-symbols-outlined text-[28px]">meeting_room</span>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white text-lg">
                                        {activeOccupancy.room?.nama || '-'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {activeOccupancy.room?.building?.nama || '-'} &bull; Kode: {activeOccupancy.room?.code || '-'}
                                    </p>
                                </div>
                            </div>
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS['Aktif']}`}>
                                Aktif
                            </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Tanggal Masuk</p>
                                <p className="font-semibold text-gray-700 dark:text-gray-300">{formatDate(activeOccupancy.tanggal_masuk)}</p>
                            </div>
                            {activeOccupancy.keterangan && (
                                <div className="col-span-2">
                                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Keterangan</p>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">{activeOccupancy.keterangan}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* History Table */}
            {pastOccupancies.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Riwayat Akomodasi</h3>
                    <div className="premium-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800">
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Ruangan</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Gedung</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Masuk</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Keluar</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {pastOccupancies.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900 dark:text-white">{item.room?.nama || '-'}</div>
                                                <div className="text-xs text-gray-400 font-mono">{item.room?.code || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.room?.building?.nama || '-'}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(item.tanggal_masuk)}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.tanggal_keluar ? formatDate(item.tanggal_keluar) : '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[item.status] || ''}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeAccommodationTab;
