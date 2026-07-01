import { useState } from 'react';
import Modal from '../common/Modal';
import { useSerialNumberList } from '../../hooks/useInventoryStok';
import { InvSerialNumber } from '../../types/inventory';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    produkId: number;
    gudangId: number;
    produkNama: string;
    produkCode: string;
    gudangNama: string;
}

const STATUS_COLORS: Record<string, string> = {
    'Tersedia': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Digunakan': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Rusak': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Disposed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
};

const SerialNumberModal: React.FC<Props> = ({ isOpen, onClose, produkId, gudangId, produkNama, produkCode, gudangNama }) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data, isLoading } = useSerialNumberList(
        isOpen ? { produk_id: produkId, gudang_id: gudangId, search: search || undefined, page, limit } : undefined
    );

    const items: InvSerialNumber[] = data?.data || [];
    const pagination = data?.pagination;

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detail Asset — Serial Number & Tag" description={`${produkCode} · ${produkNama} — ${gudangNama}`} size="xl">
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Cari serial number atau asset tag..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400 w-12">No</th>
                                <th className="text-left px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400">Serial Number</th>
                                <th className="text-left px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400">Asset Tag</th>
                                <th className="text-left px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400">Status</th>
                                <th className="text-left px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400">Digunakan Oleh</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                        {search ? 'Tidak ditemukan serial number yang cocok' : 'Tidak ada data serial number'}
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-2.5 text-gray-500">{(page - 1) * limit + index + 1}</td>
                                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                                            {item.serial_number || <span className="text-gray-400 italic">—</span>}
                                        </td>
                                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                            {item.tag_number || <span className="text-gray-400 italic">—</span>}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[item.status] || ''}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">
                                            {item.karyawan ? (
                                                <span>{item.karyawan.nama_lengkap} <span className="text-xs text-gray-400">({item.karyawan.nomor_induk_karyawan})</span></span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {pagination.total} item
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300"
                            >
                                Sebelumnya
                            </button>
                            <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300"
                            >
                                Berikutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default SerialNumberModal;
