import { useState } from 'react';
import { useStokList } from '../../../hooks/useInventoryStok';
import { useInvGudangList } from '../../../hooks/useInventoryMasterData';
import { InvStok } from '../../../types/inventory';

const StokPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [gudangId, setGudangId] = useState<number | undefined>();

    const { data, isLoading } = useStokList({ page, limit: 15, search, gudang_id: gudangId });
    const { data: gudangData } = useInvGudangList({ limit: 100, status: 'Aktif' });

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stok Inventaris</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Saldo stok per gudang</p>
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
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : data?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">Tidak ada data stok</td>
                                </tr>
                            ) : (
                                data?.data?.map((item: InvStok, index: number) => (
                                    <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 text-gray-500">{(page - 1) * 15 + index + 1}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{item.produk?.code}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.produk?.nama}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.produk?.brand?.nama || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.gudang?.nama}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{item.jumlah.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.uom?.nama}</td>
                                    </tr>
                                ))
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
        </div>
    );
};

export default StokPage;
