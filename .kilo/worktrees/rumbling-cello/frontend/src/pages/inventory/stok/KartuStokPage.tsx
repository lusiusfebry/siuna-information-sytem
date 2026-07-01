import { useState } from 'react';
import { useKartuStok } from '../../../hooks/useInventoryStok';
import { useInvProdukList, useInvGudangList } from '../../../hooks/useInventoryMasterData';
import { InvTransaksiDetail } from '../../../types/inventory';

const KartuStokPage = () => {
    const [produkId, setProdukId] = useState<number>(0);
    const [gudangId, setGudangId] = useState<number | undefined>();
    const [dari, setDari] = useState('');
    const [sampai, setSampai] = useState('');
    const [page, setPage] = useState(1);

    const { data: produkData } = useInvProdukList({ limit: 200, status: 'Aktif' });
    const { data: gudangData } = useInvGudangList({ limit: 100, status: 'Aktif' });

    const { data, isLoading } = useKartuStok({
        produk_id: produkId,
        gudang_id: gudangId,
        dari: dari || undefined,
        sampai: sampai || undefined,
        page,
        limit: 20,
    });

    const selectedProduk = produkData?.data?.find(p => p.id === produkId);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kartu Stok</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Riwayat pergerakan stok per produk</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <select
                    value={produkId}
                    onChange={(e) => { setProdukId(Number(e.target.value)); setPage(1); }}
                    className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 w-full sm:w-72"
                >
                    <option value={0}>-- Pilih Produk --</option>
                    {produkData?.data?.map((p) => (
                        <option key={p.id} value={p.id}>{p.code} - {p.nama}</option>
                    ))}
                </select>

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

                <input
                    type="date"
                    value={dari}
                    onChange={(e) => { setDari(e.target.value); setPage(1); }}
                    className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
                <input
                    type="date"
                    value={sampai}
                    onChange={(e) => { setSampai(e.target.value); setPage(1); }}
                    className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
            </div>

            {!produkId ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">inventory_2</span>
                    <p className="text-gray-400">Pilih produk untuk melihat kartu stok</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {selectedProduk && (
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedProduk.code} - {selectedProduk.nama}</span>
                            {selectedProduk.has_serial_number && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Serial Number</span>
                            )}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-12">No</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tanggal</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Kode Transaksi</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tipe</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Gudang</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Jumlah</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">UOM</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Keterangan</th>
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
                                        <td colSpan={8} className="px-4 py-12 text-center text-gray-400">Belum ada pergerakan stok</td>
                                    </tr>
                                ) : (
                                    data?.data?.map((item: InvTransaksiDetail, index: number) => {
                                        const trx = item.transaksi;
                                        const isPositive = trx?.tipe === 'Masuk' || (trx?.tipe === 'Adjustment' && item.jumlah > 0);
                                        return (
                                            <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3 text-gray-500">{(page - 1) * 20 + index + 1}</td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                    {trx && new Date(trx.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs font-semibold">{trx?.code}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                        {trx?.tipe} - {trx?.sub_tipe}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{trx?.gudang?.nama}</td>
                                                <td className={`px-4 py-3 text-right font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isPositive ? '+' : ''}{item.jumlah}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500">{item.uom?.nama}</td>
                                                <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{item.catatan || trx?.catatan || '-'}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {data?.pagination && data.pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                            <span className="text-sm text-gray-500">Total {data.pagination.total} pergerakan</span>
                            <div className="flex gap-1">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Sebelumnya</button>
                                <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">{data.pagination.page} / {data.pagination.totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))} disabled={page === data.pagination.totalPages} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Berikutnya</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default KartuStokPage;
