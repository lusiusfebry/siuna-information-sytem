import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useEmployeeAssets } from '../../hooks/useEmployeeAssets';
import inventoryEmployeeService from '../../services/api/inventory-employee.service';
import { InvSerialNumber } from '../../types/inventory';

interface Props {
    employeeId: number;
}

const STATUS_COLORS: Record<string, string> = {
    'Tersedia': 'bg-green-100 text-green-800',
    'Digunakan': 'bg-blue-100 text-blue-800',
    'Rusak': 'bg-red-100 text-red-800',
    'Disposed': 'bg-gray-100 text-gray-800',
};

const EmployeeAssetsTab: React.FC<Props> = ({ employeeId }) => {
    const { data, isLoading } = useEmployeeAssets(employeeId);
    const [downloading, setDownloading] = useState(false);

    const assets: InvSerialNumber[] = data?.data || [];

    const handleDownloadBeritaAcara = async () => {
        setDownloading(true);
        try {
            const blob = await inventoryEmployeeService.downloadBeritaAcara(employeeId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Berita-Acara-Serah-Terima.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Berita acara berhasil diunduh');
        } catch {
            toast.error('Gagal mengunduh berita acara');
        } finally {
            setDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="premium-card p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                ))}
            </div>
        );
    }

    if (!assets.length) {
        return (
            <div className="premium-card p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">inventory_2</span>
                <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Belum Ada Aset</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Karyawan ini belum memiliki aset inventaris</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Aset Inventaris</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{assets.length} aset dipegang</p>
                </div>
                <button
                    onClick={handleDownloadBeritaAcara}
                    disabled={downloading}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm"
                >
                    <span className="material-symbols-outlined text-[18px]">description</span>
                    {downloading ? 'Mengunduh...' : 'Cetak Berita Acara'}
                </button>
            </div>

            <div className="premium-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800">
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Produk</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Serial Number</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Status</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Gudang Asal</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Tanggal Terima</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {assets.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900 dark:text-white">{item.produk?.nama}</div>
                                        <div className="text-xs text-gray-400 font-mono">{item.produk?.code}</div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{item.serial_number}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[item.status] || ''}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.gudang?.nama || '-'}</td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmployeeAssetsTab;
