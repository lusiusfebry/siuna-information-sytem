import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransaksiList, useTransaksiDetail } from '../../../hooks/useInventoryStok';
import { useInvGudangList } from '../../../hooks/useInventoryMasterData';
import { InvTransaksi, TransaksiTipe } from '../../../types/inventory';
import Button from '../../../components/common/Button';

const TIPE_COLORS: Record<string, string> = {
    'Masuk': 'bg-green-100 text-green-800',
    'Keluar': 'bg-red-100 text-red-800',
    'Adjustment': 'bg-yellow-100 text-yellow-800',
};

const TransaksiListPage = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [tipe, setTipe] = useState<TransaksiTipe | ''>('');
    const [gudangId, setGudangId] = useState<number | undefined>();
    const [tanggalDari, setTanggalDari] = useState('');
    const [tanggalSampai, setTanggalSampai] = useState('');

    const { data, isLoading } = useTransaksiList({
        page,
        limit: 15,
        search,
        tipe: tipe || undefined,
        gudang_id: gudangId,
        tanggal_dari: tanggalDari || undefined,
        tanggal_sampai: tanggalSampai || undefined,
    });
    const { data: gudangData } = useInvGudangList({ limit: 100, status: 'Aktif' });

    const [detailModal, setDetailModal] = useState<InvTransaksi | null>(null);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaksi Stok</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Riwayat transaksi masuk, keluar, dan adjustment</p>
                </div>
                <Button onClick={() => navigate('/inventory/transaksi/baru')}>
                    <span className="material-symbols-outlined text-[18px] mr-1.5">add</span>
                    Buat Transaksi
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <input
                    type="text"
                    placeholder="Cari kode/supplier/referensi..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 w-full sm:w-64"
                />
                <select
                    value={tipe}
                    onChange={(e) => { setTipe(e.target.value as TransaksiTipe | ''); setPage(1); }}
                    className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                >
                    <option value="">Semua Tipe</option>
                    <option value="Masuk">Masuk</option>
                    <option value="Keluar">Keluar</option>
                    <option value="Adjustment">Adjustment</option>
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
                    value={tanggalDari}
                    onChange={(e) => { setTanggalDari(e.target.value); setPage(1); }}
                    className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    placeholder="Dari tanggal"
                />
                <input
                    type="date"
                    value={tanggalSampai}
                    onChange={(e) => { setTanggalSampai(e.target.value); setPage(1); }}
                    className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    placeholder="Sampai tanggal"
                />
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-12">No</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Kode</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tanggal</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tipe</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Sub Tipe</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Gudang</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Keterangan</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Dibuat Oleh</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-20">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                                        {Array.from({ length: 9 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : data?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-gray-400">Tidak ada transaksi</td>
                                </tr>
                            ) : (
                                data?.data?.map((item: InvTransaksi, index: number) => {
                                    const keterangan = item.supplier_nama
                                        ? `Supplier: ${item.supplier_nama}`
                                        : item.karyawan
                                            ? `Karyawan: ${item.karyawan.nama_lengkap}`
                                            : item.gudang_tujuan
                                                ? `Ke: ${item.gudang_tujuan.nama}`
                                                : item.catatan || '-';

                                    return (
                                        <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 text-gray-500">{(page - 1) * 15 + index + 1}</td>
                                            <td className="px-4 py-3 font-mono text-xs font-semibold">{item.code}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TIPE_COLORS[item.tipe] || ''}`}>
                                                    {item.tipe}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.sub_tipe}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.gudang?.nama}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[200px] truncate">{keterangan}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.creator?.nama}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => setDetailModal(item)}
                                                    className="text-primary hover:text-blue-700 text-xs font-medium"
                                                >
                                                    Detail
                                                </button>
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
                        <span className="text-sm text-gray-500">Total {data.pagination.total} transaksi</span>
                        <div className="flex gap-1">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Sebelumnya</button>
                            <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">{data.pagination.page} / {data.pagination.totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))} disabled={page === data.pagination.totalPages} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Berikutnya</button>
                        </div>
                    </div>
                )}
            </div>

            {detailModal && <TransaksiDetailModal transaksi={detailModal} onClose={() => setDetailModal(null)} />}
        </div>
    );
};

const TransaksiDetailModal = ({ transaksi, onClose }: { transaksi: InvTransaksi; onClose: () => void }) => {
    const { data, isLoading } = useTransaksiDetail(transaksi.id);
    const detail = data?.data;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Detail Transaksi {transaksi.code}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {transaksi.tipe} - {transaksi.sub_tipe} | {new Date(transaksi.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    {isLoading ? (
                        <div className="animate-pulse space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-4 bg-gray-200 rounded w-3/4" />)}
                        </div>
                    ) : detail && (
                        <>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-gray-500">Gudang:</span> <span className="font-medium">{detail.gudang?.nama}</span></div>
                                {detail.gudang_tujuan && <div><span className="text-gray-500">Gudang Tujuan:</span> <span className="font-medium">{detail.gudang_tujuan.nama}</span></div>}
                                {detail.karyawan && <div><span className="text-gray-500">Karyawan:</span> <span className="font-medium">{detail.karyawan.nama_lengkap}</span></div>}
                                {detail.supplier_nama && <div><span className="text-gray-500">Supplier:</span> <span className="font-medium">{detail.supplier_nama}</span></div>}
                                {detail.no_referensi && <div><span className="text-gray-500">No. Referensi:</span> <span className="font-medium">{detail.no_referensi}</span></div>}
                                {detail.catatan && <div className="col-span-2"><span className="text-gray-500">Catatan:</span> <span className="font-medium">{detail.catatan}</span></div>}
                            </div>
                            <table className="w-full text-sm mt-4">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left px-3 py-2 font-medium text-gray-500">Produk</th>
                                        <th className="text-right px-3 py-2 font-medium text-gray-500">Jumlah</th>
                                        <th className="text-left px-3 py-2 font-medium text-gray-500">UOM</th>
                                        <th className="text-left px-3 py-2 font-medium text-gray-500">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detail.details?.map((d) => (
                                        <tr key={d.id} className="border-b border-gray-50">
                                            <td className="px-3 py-2">{d.produk?.nama} <span className="text-gray-400 text-xs">({d.produk?.code})</span></td>
                                            <td className="px-3 py-2 text-right font-semibold">{d.jumlah}</td>
                                            <td className="px-3 py-2 text-gray-500">{d.uom?.nama}</td>
                                            <td className="px-3 py-2 text-gray-500">{d.catatan || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransaksiListPage;
