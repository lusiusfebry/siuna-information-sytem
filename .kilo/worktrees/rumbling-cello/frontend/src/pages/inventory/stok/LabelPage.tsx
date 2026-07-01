import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import inventoryLabelService from '../../../services/api/inventory-label.service';
import { useLookupQR } from '../../../hooks/useInventoryLabel';
import { useSerialNumberList } from '../../../hooks/useInventoryStok';
import { useInvGudangList, useInvProdukList } from '../../../hooks/useInventoryMasterData';

const STATUS_COLORS: Record<string, string> = {
    'Tersedia': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Digunakan': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Rusak': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Disposed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
};

const LabelPage = () => {
    // Filter state
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [gudangId, setGudangId] = useState<string>('');
    const [produkId, setProdukId] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Print config state
    const [paperType, setPaperType] = useState<'a4' | 'thermal'>('a4');
    const [thermalSize, setThermalSize] = useState<'50x30' | '70x40' | '100x50'>('70x40');
    const [columns, setColumns] = useState(3);
    const [printing, setPrinting] = useState(false);

    // QR Lookup state
    const [lookupCode, setLookupCode] = useState('');
    const [lookupQuery, setLookupQuery] = useState('');

    const limit = 15;
    const { data: snData, isLoading } = useSerialNumberList({
        page,
        limit,
        search: search || undefined,
        gudang_id: gudangId ? Number(gudangId) : undefined,
        produk_id: produkId ? Number(produkId) : undefined,
        status: statusFilter || undefined,
    } as any);
    const { data: gudangData } = useInvGudangList({ limit: 100, status: 'Aktif' });
    const { data: produkData } = useInvProdukList({ page: 1, limit: 200, search: '' });
    const { data: lookupResult, isLoading: lookupLoading } = useLookupQR(lookupQuery);

    const items = snData?.data || [];
    const totalItems = snData?.pagination?.total || 0;
    const totalPages = snData?.pagination?.totalPages || 1;
    const gudangList = gudangData?.data || [];
    const produkList = produkData?.data || [];

    const taggableItems = items.filter((sn: any) => sn.tag_number);

    const allCurrentSelected = taggableItems.length > 0 && taggableItems.every((sn: any) => selectedIds.has(sn.id));
    const someCurrentSelected = taggableItems.some((sn: any) => selectedIds.has(sn.id));

    const selectAllRef = useCallback((input: HTMLInputElement | null) => {
        if (input) {
            input.indeterminate = someCurrentSelected && !allCurrentSelected;
        }
    }, [someCurrentSelected, allCurrentSelected]);

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            taggableItems.forEach((sn: any) => {
                if (checked) next.add(sn.id);
                else next.delete(sn.id);
            });
            return next;
        });
    };

    const handleToggle = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handlePrint = async () => {
        if (selectedIds.size === 0) {
            toast.error('Pilih minimal satu asset tag untuk dicetak');
            return;
        }
        setPrinting(true);
        try {
            const blob = await inventoryLabelService.printLabels({
                items: Array.from(selectedIds).map(id => ({ type: 'asset_tag' as const, id })),
                paperType,
                ...(paperType === 'thermal' ? { thermalSize } : { columns }),
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Label-Inventaris-${paperType === 'thermal' ? thermalSize : 'A4'}.pdf`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 2000);
            toast.success(`${selectedIds.size} label berhasil dicetak`);
        } catch {
            toast.error('Gagal mencetak label');
        } finally {
            setPrinting(false);
        }
    };

    const handleLookup = () => {
        if (!lookupCode.trim()) return;
        setLookupQuery(lookupCode.trim());
    };

    const selectCls = 'border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary';

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Label & QR Code</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Cetak label bulk dan scan QR Code inventaris</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Panel — Bulk Label Print */}
                <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Cetak Label</h3>
                        {selectedIds.size > 0 && (
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                            >
                                Hapus Pilihan ({selectedIds.size})
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="px-6 py-3 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Cari tag / produk..."
                                    className={`${selectCls} w-full`}
                                />
                            </div>
                            <select value={gudangId} onChange={(e) => { setGudangId(e.target.value); setPage(1); }} className={selectCls}>
                                <option value="">Semua Gudang</option>
                                {gudangList.map((g: any) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                            </select>
                            <select value={produkId} onChange={(e) => { setProdukId(e.target.value); setPage(1); }} className={selectCls}>
                                <option value="">Semua Produk</option>
                                {produkList.map((p: any) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                            </select>
                            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={selectCls}>
                                <option value="">Semua Status</option>
                                <option value="Tersedia">Tersedia</option>
                                <option value="Digunakan">Digunakan</option>
                                <option value="Rusak">Rusak</option>
                                <option value="Disposed">Disposed</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                <tr>
                                    <th className="w-10 px-3 py-3">
                                        <input
                                            type="checkbox"
                                            ref={selectAllRef}
                                            checked={allCurrentSelected && taggableItems.length > 0}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Asset Tag</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Produk</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Gudang</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-3 py-3"><div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                                            <td className="px-3 py-3"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                                            <td className="px-3 py-3"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                                            <td className="px-3 py-3 hidden md:table-cell"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                                            <td className="px-3 py-3"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                                        </tr>
                                    ))
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-gray-400">
                                            <span className="material-symbols-outlined text-4xl mb-2 block">inventory_2</span>
                                            <p className="text-sm">Tidak ada data serial number</p>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((sn: any) => {
                                        const hasTag = !!sn.tag_number;
                                        return (
                                            <tr
                                                key={sn.id}
                                                className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedIds.has(sn.id) ? 'bg-primary/5' : ''}`}
                                            >
                                                <td className="px-3 py-2.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(sn.id)}
                                                        onChange={() => handleToggle(sn.id)}
                                                        disabled={!hasTag}
                                                        className="rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-30"
                                                    />
                                                </td>
                                                <td className="px-3 py-2.5 font-mono text-xs font-medium text-gray-900 dark:text-white">
                                                    {sn.tag_number || <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{sn.produk?.nama || '-'}</td>
                                                <td className="px-3 py-2.5 text-gray-500 hidden md:table-cell">{sn.gudang?.nama || '-'}</td>
                                                <td className="px-3 py-2.5">
                                                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[sn.status] || 'bg-gray-100 text-gray-600'}`}>
                                                        {sn.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                            Total {totalItems} item
                            {selectedIds.size > 0 && <span className="text-primary font-medium"> ({selectedIds.size} dipilih)</span>}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                            </button>
                            <span className="text-gray-600 dark:text-gray-400 min-w-[60px] text-center">{page} / {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    {/* Print Config + Button */}
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            {/* Paper Type Toggle */}
                            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <button
                                    onClick={() => setPaperType('a4')}
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                        paperType === 'a4'
                                            ? 'bg-primary text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    Kertas A4
                                </button>
                                <button
                                    onClick={() => setPaperType('thermal')}
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                        paperType === 'thermal'
                                            ? 'bg-primary text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    Thermal Label
                                </button>
                            </div>

                            {/* Sub-options */}
                            {paperType === 'a4' ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Kolom:</span>
                                    {[2, 3, 4].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setColumns(n)}
                                            className={`w-7 h-7 text-xs font-medium rounded-md transition-colors ${
                                                columns === n
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Ukuran:</span>
                                    {(['50x30', '70x40', '100x50'] as const).map(sz => (
                                        <button
                                            key={sz}
                                            onClick={() => setThermalSize(sz)}
                                            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                                                thermalSize === sz
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {sz.replace('x', '×')}mm
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Print Button */}
                            <button
                                onClick={handlePrint}
                                disabled={printing || selectedIds.size === 0}
                                className="sm:ml-auto flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[16px]">print</span>
                                {printing ? 'Mencetak...' : `Cetak ${selectedIds.size} Label`}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel — QR Scanner (unchanged) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Scan QR Code</h3>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kode QR</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={lookupCode}
                                    onChange={(e) => setLookupCode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                    placeholder="Masukkan atau scan kode QR"
                                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <button
                                    onClick={handleLookup}
                                    disabled={lookupLoading}
                                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[16px]">search</span>
                                    Cari
                                </button>
                            </div>
                        </div>

                        {lookupLoading && (
                            <div className="text-center py-8 text-gray-400">
                                <div className="animate-spin inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-2" />
                                <p className="text-sm">Mencari...</p>
                            </div>
                        )}

                        {lookupQuery && !lookupLoading && lookupResult?.data && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-600">check_circle</span>
                                    <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                                        {lookupResult.data.type === 'produk' ? 'Produk Ditemukan' : lookupResult.data.type === 'asset_tag' ? 'Asset Tag Ditemukan' : 'Serial Number Ditemukan'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    {lookupResult.data.type === 'produk' ? (
                                        <>
                                            <div>
                                                <p className="text-gray-500 text-xs">Kode</p>
                                                <p className="font-mono font-semibold text-gray-900 dark:text-white">{lookupResult.data.data?.code}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">Nama</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{lookupResult.data.data?.nama}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">Brand</p>
                                                <p className="text-gray-700 dark:text-gray-300">{lookupResult.data.data?.brand?.nama || '-'}</p>
                                            </div>
                                        </>
                                    ) : lookupResult.data.type === 'asset_tag' ? (
                                        <>
                                            <div>
                                                <p className="text-gray-500 text-xs">Asset Tag</p>
                                                <p className="font-mono font-semibold text-gray-900 dark:text-white">{lookupResult.data.data?.tag_number}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">Produk</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{lookupResult.data.data?.produk?.nama}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">Status</p>
                                                <p className="text-gray-700 dark:text-gray-300">{lookupResult.data.data?.status}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">Gudang</p>
                                                <p className="text-gray-700 dark:text-gray-300">{lookupResult.data.data?.gudang?.nama || '-'}</p>
                                            </div>
                                            {lookupResult.data.data?.serial_number && (
                                                <div>
                                                    <p className="text-gray-500 text-xs">Serial Number</p>
                                                    <p className="font-mono text-gray-700 dark:text-gray-300">{lookupResult.data.data.serial_number}</p>
                                                </div>
                                            )}
                                            {lookupResult.data.data?.karyawan && (
                                                <div>
                                                    <p className="text-gray-500 text-xs">Karyawan</p>
                                                    <p className="text-gray-700 dark:text-gray-300">{lookupResult.data.data.karyawan.nama_lengkap}</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <p className="text-gray-500 text-xs">Serial Number</p>
                                                <p className="font-mono font-semibold text-gray-900 dark:text-white">{lookupResult.data.data?.serial_number}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">Produk</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{lookupResult.data.data?.produk?.nama}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">Status</p>
                                                <p className="text-gray-700 dark:text-gray-300">{lookupResult.data.data?.status}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">Gudang</p>
                                                <p className="text-gray-700 dark:text-gray-300">{lookupResult.data.data?.gudang?.nama || '-'}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {lookupQuery && !lookupLoading && !lookupResult?.data && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
                                <span className="material-symbols-outlined text-red-400 text-3xl mb-1 block">error</span>
                                <p className="text-sm text-red-700 dark:text-red-300">Kode QR tidak ditemukan</p>
                            </div>
                        )}

                        {!lookupQuery && !lookupLoading && (
                            <div className="text-center py-8 text-gray-400">
                                <span className="material-symbols-outlined text-4xl mb-2 block">qr_code_scanner</span>
                                <p className="text-sm">Masukkan kode QR untuk melihat detail</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabelPage;
