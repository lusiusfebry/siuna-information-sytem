import { useState } from 'react';
import { useStokList } from '../../../hooks/useInventoryStok';
import { useInvGudangList } from '../../../hooks/useInventoryMasterData';
import { InvStok } from '../../../types/inventory';
import SerialNumberModal from '../../../components/inventory/SerialNumberModal';

const StokPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [gudangId, setGudangId] = useState<number | undefined>();
    const [selectedStok, setSelectedStok] = useState<InvStok | null>(null);

    const { data, isLoading } = useStokList({ page, limit: 15, search, gudang_id: gudangId });
    const { data: gudangData } = useInvGudangList({ limit: 100, status: 'Aktif' });

    const isTracked = (item: InvStok) => item.produk?.has_serial_number || item.produk?.has_tag_number;

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stok Inventaris</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Saldo stok per gudang — klik baris bertanda <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">Tracked</span> untuk melihat detail asset tag</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    placeholder="Cari produk..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 w-full sm:w-72"
                />
                <select
                    value={gudangId || ''}
                    onChange={(e) => { setGudangId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                    className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                >
                    <option value="">Semua Gudang</option>
                    {gudangData?.data?.map((g) => (
                        <option key={g.id} value={g.id}>{g.nama}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-12">No</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Kode Produk</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Nama Produk</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Brand</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Gudang</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Jumlah</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">UOM</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tracking</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : data?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">Tidak ada data stok</td>
                                </tr>
                            ) : (
                                data?.data?.map((item: InvStok, index: number) => {
                                    const tracked = isTracked(item);
                                    return (
                                        <tr
                                            key={item.id}
                                            className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${tracked ? 'cursor-pointer' : ''}`}
                                            onClick={() => tracked && setSelectedStok(item)}
                                        >
                                            <td className="px-4 py-3 text-gray-500">{(page - 1) * 15 + index + 1}</td>
                                            <td className="px-4 py-3 font-mono text-xs">{item.produk?.code}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.produk?.nama}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.produk?.brand?.nama || '-'}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.gudang?.nama}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{item.jumlah.toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.uom?.nama}</td>
                                            <td className="px-4 py-3 text-center">
                                                {tracked ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                        <span className="material-symbols-outlined text-sm" style={{ fontSize: '14px' }}>sell</span>
                                                        Tracked
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {data?.pagination && data.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-500">
                            Total {data.pagination.total} item
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                                Sebelumnya
                            </button>
                            <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">
                                {data.pagination.page} / {data.pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                                disabled={page === data.pagination.totalPages}
                                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                                Berikutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {selectedStok && (
                <SerialNumberModal
                    isOpen={!!selectedStok}
                    onClose={() => setSelectedStok(null)}
                    produkId={selectedStok.produk_id}
                    gudangId={selectedStok.gudang_id}
                    produkNama={selectedStok.produk?.nama || ''}
                    produkCode={selectedStok.produk?.code || ''}
                    gudangNama={selectedStok.gudang?.nama || ''}
                />
            )}
        </div>
    );
};

export default StokPage;
