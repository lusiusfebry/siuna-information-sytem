import { useState } from 'react';
import { useLaporanKonsumsi } from '../../../hooks/useInventoryStok';
import { useInvProdukList, useInvGudangList } from '../../../hooks/useInventoryMasterData';
import { useMasterDataList } from '../../../hooks/useMasterData';
import { InvTransaksi } from '../../../types/inventory';

const LaporanKonsumsiPage = () => {
    const [departmentId, setDepartmentId] = useState<number | undefined>();
    const [gudangId, setGudangId] = useState<number | undefined>();
    const [produkId, setProdukId] = useState<number | undefined>();
    const [dari, setDari] = useState('');
    const [sampai, setSampai] = useState('');
    const [page, setPage] = useState(1);

    const { data: produkData } = useInvProdukList({ limit: 200, status: 'Aktif' });
    const { data: gudangData } = useInvGudangList({ limit: 100, status: 'Aktif' });
    const { data: deptData } = useMasterDataList('department', { limit: 200 });

    const { data, isLoading } = useLaporanKonsumsi({
        department_id: departmentId,
        gudang_id: gudangId,
        produk_id: produkId,
        dari: dari || undefined,
        sampai: sampai || undefined,
        page,
        limit: 20,
    });

    const inputCls = 'flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100';

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan Konsumsi</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Riwayat pemakaian barang consumable</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <select value={departmentId || ''} onChange={(e) => { setDepartmentId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }} className={inputCls}>
                    <option value="">Semua Department</option>
                    {(deptData?.data as any[] || []).map((d: any) => (
                        <option key={d.id} value={d.id}>{d.code ? `${d.code} - ` : ''}{d.nama}</option>
                    ))}
                </select>

                <select value={gudangId || ''} onChange={(e) => { setGudangId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }} className={inputCls}>
                    <option value="">Semua Gudang</option>
                    {gudangData?.data?.map((g) => (
                        <option key={g.id} value={g.id}>{g.nama}</option>
                    ))}
                </select>

                <select value={produkId || ''} onChange={(e) => { setProdukId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }} className={`${inputCls} w-full sm:w-64`}>
                    <option value="">Semua Produk</option>
                    {produkData?.data?.filter(p => p.is_consumable).map((p) => (
                        <option key={p.id} value={p.id}>{p.code} - {p.nama}</option>
                    ))}
                </select>

                <input type="date" value={dari} onChange={(e) => { setDari(e.target.value); setPage(1); }} className={inputCls} />
                <input type="date" value={sampai} onChange={(e) => { setSampai(e.target.value); setPage(1); }} className={inputCls} />
            </div>

            {data?.summary && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                        <p className="text-xs text-gray-500 mb-1">Total Transaksi</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.total_transaksi}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                        <p className="text-xs text-gray-500 mb-2">Top Produk</p>
                        {data.summary.per_produk.slice(0, 3).map(p => (
                            <div key={p.id} className="flex justify-between text-sm">
                                <span className="text-gray-700 dark:text-gray-300 truncate">{p.nama}</span>
                                <span className="font-semibold ml-2">{p.total_jumlah}</span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                        <p className="text-xs text-gray-500 mb-2">Top Department</p>
                        {data.summary.per_department.slice(0, 3).map(d => (
                            <div key={d.id} className="flex justify-between text-sm">
                                <span className="text-gray-700 dark:text-gray-300 truncate">{d.nama}</span>
                                <span className="font-semibold ml-2">{d.total_jumlah}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                                <th className="text-left px-4 py-3 font-medium text-gray-500 w-12">No</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Tanggal</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Kode</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Gudang</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Penerima</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Item</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Catatan</th>
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
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">Belum ada data konsumsi</td>
                                </tr>
                            ) : (
                                data?.data?.map((trx: InvTransaksi, index: number) => (
                                    <tr key={trx.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 text-gray-500">{(page - 1) * 20 + index + 1}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                            {new Date(trx.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs font-semibold">{trx.code}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{trx.gudang?.nama || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                            {trx.karyawan ? trx.karyawan.nama_lengkap : trx.department ? trx.department.nama : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                            {trx.details?.map(d => `${d.produk?.nama} (${d.jumlah})`).join(', ') || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{trx.catatan || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {data?.pagination && data.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-500">Total {data.pagination.total} transaksi</span>
                        <div className="flex gap-1">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Sebelumnya</button>
                            <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">{data.pagination.page} / {data.pagination.totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))} disabled={page === data.pagination.totalPages} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Berikutnya</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LaporanKonsumsiPage;
