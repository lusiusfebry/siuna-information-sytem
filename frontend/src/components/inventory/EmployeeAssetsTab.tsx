import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useEmployeeAssets, useEmployeeAssetHistory } from '../../hooks/useEmployeeAssets';
import inventoryEmployeeService from '../../services/api/inventory-employee.service';
import { InvSerialNumber, InvTransaksi } from '../../types/inventory';

interface Props {
    employeeId: number;
}

const STATUS_COLORS: Record<string, string> = {
    'Tersedia': 'bg-green-100 text-green-800',
    'Digunakan': 'bg-blue-100 text-blue-800',
    'Rusak': 'bg-red-100 text-red-800',
    'Disposed': 'bg-gray-100 text-gray-800',
};

const TIPE_COLORS: Record<string, string> = {
    'Masuk': 'bg-green-100 text-green-800',
    'Keluar': 'bg-red-100 text-red-800',
    'Adjustment': 'bg-yellow-100 text-yellow-800',
};

const triggerPdfDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 2000);
};

const EmployeeAssetsTab: React.FC<Props> = ({ employeeId }) => {
    const { data, isLoading } = useEmployeeAssets(employeeId);
    const { data: historyData, isLoading: historyLoading } = useEmployeeAssetHistory(employeeId);
    const [downloading, setDownloading] = useState(false);
    const [downloadingTrx, setDownloadingTrx] = useState<number | null>(null);

    const assets: InvSerialNumber[] = data?.data || [];
    const history: InvTransaksi[] = historyData?.data || [];

    const handleDownloadBeritaAcara = async () => {
        setDownloading(true);
        try {
            const blob = await inventoryEmployeeService.downloadBeritaAcara(employeeId);
            triggerPdfDownload(blob, 'Berita-Acara-Serah-Terima.pdf');
            toast.success('Berita acara berhasil diunduh');
        } catch {
            toast.error('Gagal mengunduh berita acara');
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadBeritaAcaraTrx = async (transaksiId: number) => {
        setDownloadingTrx(transaksiId);
        try {
            const blob = await inventoryEmployeeService.downloadBeritaAcara(employeeId, transaksiId);
            triggerPdfDownload(blob, `Berita-Acara-Serah-Terima-${transaksiId}.pdf`);
            toast.success('Berita acara berhasil diunduh');
        } catch {
            toast.error('Gagal mengunduh berita acara');
        } finally {
            setDownloadingTrx(null);
        }
    };

    if (isLoading && historyLoading) {
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

    const hasAssets = assets.length > 0;
    const hasHistory = history.length > 0;

    if (!hasAssets && !hasHistory) {
        return (
            <div className="premium-card p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">inventory_2</span>
                <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Belum Ada Aset</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Karyawan ini belum memiliki aset inventaris dan belum ada riwayat transaksi</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Berita Acara button */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Aset Inventaris</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {hasAssets ? `${assets.length} aset dipegang` : 'Tidak ada aset aktif'}
                        {hasHistory ? ` · ${history.length} riwayat transaksi` : ''}
                    </p>
                </div>
                {hasAssets && (
                    <button
                        onClick={handleDownloadBeritaAcara}
                        disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">description</span>
                        {downloading ? 'Mengunduh...' : 'Cetak Berita Acara'}
                    </button>
                )}
            </div>

            {/* Active Assets Table */}
            {hasAssets && (
                <div className="premium-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800">
                                    <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Produk</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Brand</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Serial Number</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Tag Number</th>
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
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{(item.produk as any)?.brand?.nama || '-'}</td>
                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{item.serial_number || '-'}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300">{item.tag_number || '-'}</td>
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
            )}

            {/* Transaction History */}
            {hasHistory && (
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Riwayat Transaksi</h3>
                    <div className="premium-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800">
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Kode</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Tanggal</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Tipe</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Sub Tipe</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Gudang</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Item</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {history.map((trx) => (
                                        <tr key={trx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{trx.code}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                {new Date(trx.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${TIPE_COLORS[trx.tipe] || ''}`}>
                                                    {trx.tipe}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{trx.sub_tipe}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{trx.gudang?.nama || '-'}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                                                {trx.details?.map(d => `${d.produk?.nama} (${d.jumlah})`).join(', ') || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleDownloadBeritaAcaraTrx(trx.id)}
                                                    disabled={downloadingTrx === trx.id}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-all disabled:opacity-50"
                                                    title="Cetak Berita Acara untuk transaksi ini"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">description</span>
                                                    {downloadingTrx === trx.id ? '...' : 'Berita Acara'}
                                                </button>
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

export default EmployeeAssetsTab;
