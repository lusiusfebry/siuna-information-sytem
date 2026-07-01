import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useInventoryMasterDataList } from '../../hooks/useInventoryMasterData';
import inventoryLaporanService from '../../services/api/inventory-laporan.service';
import type { InvGudang } from '../../types/inventory';

const REPORT_TABS = [
    { key: 'stok', label: 'Stok Gudang', icon: 'inventory_2', description: 'Laporan stok inventaris per gudang, termasuk breakdown kategori dan brand.' },
    { key: 'transaksi', label: 'Transaksi', icon: 'swap_horiz', description: 'Riwayat transaksi inventaris berdasarkan tipe dan rentang tanggal.' },
    { key: 'serial-number', label: 'Aset & Serial Number', icon: 'devices', description: 'Laporan tracking aset dengan serial number, tag number, status, dan penugasan karyawan.' },
    { key: 'stok-rendah', label: 'Stok Rendah', icon: 'warning', description: 'Daftar item yang berada di bawah batas minimum stok.' },
    { key: 'pergerakan', label: 'Pergerakan Barang', icon: 'trending_up', description: 'Analisis kecepatan pergerakan barang (fast/slow moving dan dead stock).' },
] as const;

type TabKey = typeof REPORT_TABS[number]['key'];

const TIPE_OPTIONS = ['Barang Masuk', 'Barang Keluar', 'Transfer', 'Penyesuaian'];
const STATUS_OPTIONS = ['Tersedia', 'Digunakan', 'Rusak', 'Disposed'];
const DAYS_OPTIONS = [
    { value: 30, label: '30 Hari' },
    { value: 60, label: '60 Hari' },
    { value: 90, label: '90 Hari' },
];

const LaporanPage = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('stok');
    const [exporting, setExporting] = useState<string | null>(null);

    const [gudangId, setGudangId] = useState<string>('');
    const [tipe, setTipe] = useState<string>('');
    const [tanggalDari, setTanggalDari] = useState<string>('');
    const [tanggalSampai, setTanggalSampai] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [days, setDays] = useState<number>(90);

    const { data: gudangData } = useInventoryMasterDataList<InvGudang>('gudang', { limit: 100 });
    const gudangList: InvGudang[] = (gudangData as any)?.data?.rows || (gudangData as any)?.data || [];

    const resetFilters = () => {
        setGudangId('');
        setTipe('');
        setTanggalDari('');
        setTanggalSampai('');
        setStatus('');
        setDays(90);
    };

    const handleExport = async (format: 'excel' | 'pdf') => {
        const exportKey = `${activeTab}-${format}`;
        setExporting(exportKey);
        try {
            let blob: Blob;
            let filename: string;
            const timestamp = new Date().toISOString().split('T')[0];
            const gId = gudangId ? parseInt(gudangId, 10) : undefined;

            switch (activeTab) {
                case 'stok':
                    blob = format === 'excel'
                        ? await inventoryLaporanService.exportStokExcel({ gudang_id: gId })
                        : await inventoryLaporanService.exportStokPDF({ gudang_id: gId });
                    filename = `Stok-Inventaris-${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
                    break;
                case 'transaksi':
                    blob = format === 'excel'
                        ? await inventoryLaporanService.exportTransaksiExcel({ tipe: tipe || undefined, gudang_id: gId, tanggal_dari: tanggalDari || undefined, tanggal_sampai: tanggalSampai || undefined })
                        : await inventoryLaporanService.exportTransaksiPDF({ tipe: tipe || undefined, gudang_id: gId, tanggal_dari: tanggalDari || undefined, tanggal_sampai: tanggalSampai || undefined });
                    filename = `Laporan-Transaksi-${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
                    break;
                case 'serial-number':
                    blob = format === 'excel'
                        ? await inventoryLaporanService.exportSerialNumberExcel({ gudang_id: gId, status: status || undefined })
                        : await inventoryLaporanService.exportSerialNumberPDF({ gudang_id: gId, status: status || undefined });
                    filename = `Laporan-Aset-Serial-${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
                    break;
                case 'stok-rendah':
                    blob = format === 'excel'
                        ? await inventoryLaporanService.exportStokRendahExcel({ gudang_id: gId })
                        : await inventoryLaporanService.exportStokRendahPDF({ gudang_id: gId });
                    filename = `Laporan-Stok-Rendah-${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
                    break;
                case 'pergerakan':
                    blob = format === 'excel'
                        ? await inventoryLaporanService.exportPergerakanExcel({ days })
                        : await inventoryLaporanService.exportPergerakanPDF({ days });
                    filename = `Laporan-Pergerakan-${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
                    break;
                default:
                    return;
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 2000);
            toast.success(`Export ${format.toUpperCase()} berhasil diunduh`);
        } catch {
            toast.error('Gagal mengunduh laporan');
        } finally {
            setExporting(null);
        }
    };

    const activeConfig = REPORT_TABS.find(t => t.key === activeTab)!;

    const selectClass = 'w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';
    const labelClass = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan Inventory</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Unduh laporan inventaris dalam format Excel atau PDF</p>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-700">
                    {REPORT_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); resetFilters(); }}
                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                                activeTab === tab.key
                                    ? 'border-primary text-primary bg-primary/5'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Description */}
                    <div className="flex items-start gap-3 mb-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30">
                        <span className="material-symbols-outlined text-blue-500 text-xl mt-0.5">info</span>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{activeConfig.description}</p>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Gudang filter — shown for all tabs except pergerakan */}
                        {activeTab !== 'pergerakan' && (
                            <div>
                                <label className={labelClass}>Gudang</label>
                                <select value={gudangId} onChange={e => setGudangId(e.target.value)} className={selectClass}>
                                    <option value="">Semua Gudang</option>
                                    {gudangList.map((g: any) => (
                                        <option key={g.id} value={g.id}>{g.nama}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Tipe filter — transaksi only */}
                        {activeTab === 'transaksi' && (
                            <div>
                                <label className={labelClass}>Tipe Transaksi</label>
                                <select value={tipe} onChange={e => setTipe(e.target.value)} className={selectClass}>
                                    <option value="">Semua Tipe</option>
                                    {TIPE_OPTIONS.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Date range — transaksi only */}
                        {activeTab === 'transaksi' && (
                            <>
                                <div>
                                    <label className={labelClass}>Tanggal Dari</label>
                                    <input type="date" value={tanggalDari} onChange={e => setTanggalDari(e.target.value)} className={selectClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Tanggal Sampai</label>
                                    <input type="date" value={tanggalSampai} onChange={e => setTanggalSampai(e.target.value)} className={selectClass} />
                                </div>
                            </>
                        )}

                        {/* Status filter — serial-number only */}
                        {activeTab === 'serial-number' && (
                            <div>
                                <label className={labelClass}>Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value)} className={selectClass}>
                                    <option value="">Semua Status</option>
                                    {STATUS_OPTIONS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Days filter — pergerakan only */}
                        {activeTab === 'pergerakan' && (
                            <div>
                                <label className={labelClass}>Periode</label>
                                <select value={days} onChange={e => setDays(parseInt(e.target.value, 10))} className={selectClass}>
                                    {DAYS_OPTIONS.map(d => (
                                        <option key={d.value} value={d.value}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Export Buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={() => handleExport('excel')}
                            disabled={!!exporting}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">table_view</span>
                            {exporting === `${activeTab}-excel` ? 'Mengunduh...' : 'Download Excel'}
                        </button>
                        <button
                            onClick={() => handleExport('pdf')}
                            disabled={!!exporting}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                            {exporting === `${activeTab}-pdf` ? 'Mengunduh...' : 'Download PDF'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LaporanPage;
