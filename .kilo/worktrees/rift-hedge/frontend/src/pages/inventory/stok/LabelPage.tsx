import { useState } from 'react';
import { toast } from 'react-hot-toast';
import QRCode from 'react-qr-code';
import inventoryLabelService from '../../../services/api/inventory-label.service';
import { useLookupQR } from '../../../hooks/useInventoryLabel';
import { useInvProdukList } from '../../../hooks/useInventoryMasterData';
import { useSerialNumberList } from '../../../hooks/useInventoryStok';

const LabelPage = () => {
    const [selectedItems, setSelectedItems] = useState<Array<{ type: 'produk' | 'serial_number' | 'asset_tag'; id: number; label: string; code: string }>>([]);
    const [printing, setPrinting] = useState(false);
    const [lookupCode, setLookupCode] = useState('');
    const [lookupQuery, setLookupQuery] = useState('');
    const [selectedProdukId, setSelectedProdukId] = useState<number | null>(null);
    const { data: lookupResult, isLoading: lookupLoading } = useLookupQR(lookupQuery);
    const { data: produkData } = useInvProdukList({ page: 1, limit: 100, search: '' });
    const { data: assetTagData } = useSerialNumberList({ page: 1, limit: 100 });

    const produkList = produkData?.data || [];
    const allAssetTags = (assetTagData?.data || []).filter((sn: any) => sn.tag_number);
    const assetTagList = selectedProdukId
        ? allAssetTags.filter((sn: any) => sn.produk_id === selectedProdukId)
        : [];
    const selectedProduk = produkList.find((p: any) => p.id === selectedProdukId);

    const handleProdukSelect = (produk: { id: number; code: string; nama: string; has_tag_number?: boolean }) => {
        if (produk.has_tag_number) {
            setSelectedProdukId(produk.id);
        } else {
            if (selectedItems.some(i => i.type === 'produk' && i.id === produk.id)) {
                toast.error('Produk sudah ditambahkan');
                return;
            }
            setSelectedItems(prev => [...prev, { type: 'produk', id: produk.id, label: produk.nama, code: produk.code }]);
        }
    };

    const addAssetTag = (tag: { id: number; tag_number?: string | null; produk?: { nama: string } }) => {
        if (!tag.tag_number) return;
        if (selectedItems.some(i => i.type === 'asset_tag' && i.id === tag.id)) {
            toast.error('Asset tag sudah ditambahkan');
            return;
        }
        setSelectedItems(prev => [...prev, { type: 'asset_tag' as const, id: tag.id, label: tag.produk?.nama || '', code: tag.tag_number! }]);
    };

    const removeItem = (idx: number) => {
        setSelectedItems(prev => prev.filter((_, i) => i !== idx));
    };

    const handlePrint = async () => {
        if (!selectedItems.length) {
            toast.error('Pilih minimal satu item untuk dicetak');
            return;
        }
        setPrinting(true);
        try {
            const blob = await inventoryLabelService.printLabels(
                selectedItems.map(i => ({ type: i.type, id: i.id }))
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Label-Inventaris.pdf';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Label berhasil dicetak');
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

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Label & QR Code</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Cetak label dan scan QR Code inventaris</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cetak Label Section */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Cetak Label</h3>
                        <button
                            onClick={handlePrint}
                            disabled={printing || !selectedItems.length}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]">print</span>
                            {printing ? 'Mencetak...' : 'Cetak Label'}
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pilih Produk</label>
                            <select
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                onChange={(e) => {
                                    const p = produkList.find((p: any) => p.id === Number(e.target.value));
                                    if (p) handleProdukSelect(p);
                                    if (!p?.has_tag_number) e.target.value = '';
                                }}
                                value={selectedProdukId ? String(selectedProdukId) : ''}
                            >
                                <option value="">-- Pilih produk untuk ditambahkan --</option>
                                {produkList.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.code} - {p.nama}</option>
                                ))}
                            </select>
                        </div>

                        {selectedProdukId && selectedProduk?.has_tag_number && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Pilih Asset Tag — {selectedProduk?.nama}
                                </label>
                                {assetTagList.length > 0 ? (
                                    <select
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        onChange={(e) => {
                                            const t = assetTagList.find((t: any) => t.id === Number(e.target.value));
                                            if (t) addAssetTag(t);
                                            e.target.value = '';
                                        }}
                                        value=""
                                    >
                                        <option value="">-- Pilih asset tag untuk ditambahkan --</option>
                                        {assetTagList.map((t: any) => (
                                            <option key={t.id} value={t.id}>{t.tag_number}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Belum ada asset tag untuk produk ini</p>
                                )}
                            </div>
                        )}

                        {selectedItems.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{selectedItems.length} item dipilih:</p>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {selectedItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white dark:bg-gray-700 p-1 rounded">
                                                    <QRCode value={item.type === 'asset_tag' ? `INV:TAG:${item.code}` : `INV:PRODUK:${item.code}`} size={40} level="M" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{item.code}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!selectedItems.length && (
                            <div className="text-center py-8 text-gray-400">
                                <span className="material-symbols-outlined text-4xl mb-2 block">qr_code_2</span>
                                <p className="text-sm">Pilih produk untuk melihat preview QR Code</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scan / Lookup Section */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
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
                                    placeholder="Masukkan atau scan kode QR (contoh: INV:PRODUK:PRD001)"
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
                                <p className="text-sm">Masukkan kode QR untuk melihat detail produk</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabelPage;
