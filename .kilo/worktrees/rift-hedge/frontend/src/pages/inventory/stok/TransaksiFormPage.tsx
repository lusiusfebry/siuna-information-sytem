import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useCreateTransaksi } from '../../../hooks/useInventoryStok';
import { useInvGudangList, useInvProdukList, useInvUomList } from '../../../hooks/useInventoryMasterData';
import { TransaksiPayload, TransaksiTipe, TransaksiSubTipe, TransaksiDetailPayload } from '../../../types/inventory';
import Button from '../../../components/common/Button';
import inventoryStokService from '../../../services/api/inventory-stok.service';

const SUB_TIPE_MAP: Record<TransaksiTipe, { value: TransaksiSubTipe; label: string }[]> = {
    'Masuk': [
        { value: 'Supplier', label: 'Dari Supplier' },
        { value: 'Transfer Masuk', label: 'Transfer Masuk' },
        { value: 'Retur Karyawan', label: 'Retur dari Karyawan' },
    ],
    'Keluar': [
        { value: 'Ke Karyawan', label: 'Ke Karyawan' },
        { value: 'Ke Gedung/Mess', label: 'Ke Gedung/Mess' },
        { value: 'Transfer Gudang', label: 'Transfer Gudang' },
        { value: 'Disposal', label: 'Disposal' },
        { value: 'Rusak/Terbuang', label: 'Rusak / Terbuang' },
    ],
    'Adjustment': [
        { value: 'Opname', label: 'Stock Opname' },
    ],
};

interface DetailRow extends TransaksiDetailPayload {
    _key: string;
}

const TransaksiFormPage = () => {
    const navigate = useNavigate();
    const createMutation = useCreateTransaksi();

    const { data: gudangData } = useInvGudangList({ limit: 100, status: 'Aktif' });
    const { data: produkData } = useInvProdukList({ limit: 200, status: 'Aktif' });
    const { data: uomData } = useInvUomList({ limit: 100, status: 'Aktif' });

    const [tipe, setTipe] = useState<TransaksiTipe>('Masuk');
    const [subTipe, setSubTipe] = useState<TransaksiSubTipe>('Supplier');
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [gudangId, setGudangId] = useState<number>(0);
    const [gudangTujuanId, setGudangTujuanId] = useState<number>(0);
    const [karyawanId, setKaryawanId] = useState<number>(0);
    const [supplierNama, setSupplierNama] = useState('');
    const [noReferensi, setNoReferensi] = useState('');
    const [catatan, setCatatan] = useState('');
    const [dokumenFiles, setDokumenFiles] = useState<File[]>([]);
    const dokumenInputRef = useRef<HTMLInputElement>(null);

    const [details, setDetails] = useState<DetailRow[]>([
        { _key: '1', produk_id: 0, uom_id: 0, jumlah: 1, catatan: '', serial_numbers: [] },
    ]);

    const handleTipeChange = (newTipe: TransaksiTipe) => {
        setTipe(newTipe);
        setSubTipe(SUB_TIPE_MAP[newTipe][0].value);
    };

    const addDetail = () => {
        setDetails(prev => [...prev, { _key: Date.now().toString(), produk_id: 0, uom_id: 0, jumlah: 1, catatan: '', serial_numbers: [] }]);
    };

    const removeDetail = (key: string) => {
        if (details.length <= 1) return;
        setDetails(prev => prev.filter(d => d._key !== key));
    };

    const updateDetail = (key: string, field: keyof TransaksiDetailPayload, value: any) => {
        setDetails(prev => prev.map(d => d._key === key ? { ...d, [field]: value } : d));
    };

    const updateSerialNumbers = (key: string, value: string) => {
        const sns = value.split('\n').map(s => s.trim()).filter(Boolean);
        setDetails(prev => prev.map(d => d._key === key ? { ...d, serial_numbers: sns } : d));
    };

    const showGudangTujuan = subTipe === 'Transfer Masuk' || subTipe === 'Transfer Gudang' || subTipe === 'Ke Gedung/Mess';
    const showKaryawan = subTipe === 'Ke Karyawan' || subTipe === 'Retur Karyawan';
    const showSupplier = subTipe === 'Supplier';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!gudangId) { toast.error('Pilih gudang'); return; }
        if (showGudangTujuan && !gudangTujuanId) { toast.error('Pilih gudang tujuan'); return; }
        if (showSupplier && !supplierNama.trim()) { toast.error('Isi nama supplier'); return; }

        const invalidDetail = details.find(d => !d.produk_id || !d.uom_id || d.jumlah === 0);
        if (invalidDetail) { toast.error('Lengkapi semua detail item'); return; }

        const payload: TransaksiPayload = {
            tipe,
            sub_tipe: subTipe,
            tanggal,
            gudang_id: gudangId,
            gudang_tujuan_id: showGudangTujuan ? gudangTujuanId : null,
            karyawan_id: showKaryawan ? karyawanId : null,
            supplier_nama: showSupplier ? supplierNama : null,
            no_referensi: noReferensi || null,
            catatan: catatan || null,
            details: details.map(({ _key, ...rest }) => ({
                ...rest,
                serial_numbers: rest.serial_numbers?.length ? rest.serial_numbers : undefined,
            })),
        };

        createMutation.mutate(payload, {
            onSuccess: async (result) => {
                if (dokumenFiles.length > 0 && result.data?.id) {
                    try {
                        await inventoryStokService.uploadDokumen(result.data.id, dokumenFiles);
                    } catch {
                        toast.error('Transaksi berhasil, tapi gagal upload dokumen');
                    }
                }
                toast.success('Transaksi berhasil dibuat');
                navigate('/inventory/transaksi');
            },
            onError: (err: AxiosError<any>) => {
                const msg = err.response?.data?.message || 'Gagal membuat transaksi';
                toast.error(msg);
            },
        });
    };

    return (
        <div className="p-6 max-w-4xl">
            <div className="mb-6">
                <button onClick={() => navigate('/inventory/transaksi')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span> Kembali
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Buat Transaksi Baru</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Informasi Transaksi</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Tipe Transaksi *</label>
                            <select value={tipe} onChange={(e) => handleTipeChange(e.target.value as TransaksiTipe)} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                <option value="Masuk">Stok Masuk</option>
                                <option value="Keluar">Stok Keluar</option>
                                <option value="Adjustment">Adjustment</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Sub Tipe *</label>
                            <select value={subTipe} onChange={(e) => setSubTipe(e.target.value as TransaksiSubTipe)} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                {SUB_TIPE_MAP[tipe].map((st) => (
                                    <option key={st.value} value={st.value}>{st.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Tanggal *</label>
                            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" required />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Gudang *</label>
                            <select value={gudangId} onChange={(e) => setGudangId(Number(e.target.value))} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" required>
                                <option value={0}>-- Pilih Gudang --</option>
                                {gudangData?.data?.map((g) => (
                                    <option key={g.id} value={g.id}>{g.nama}</option>
                                ))}
                            </select>
                        </div>

                        {showGudangTujuan && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Gudang Tujuan *</label>
                                <select value={gudangTujuanId} onChange={(e) => setGudangTujuanId(Number(e.target.value))} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                    <option value={0}>-- Pilih Gudang Tujuan --</option>
                                    {gudangData?.data?.filter(g => g.id !== gudangId).map((g) => (
                                        <option key={g.id} value={g.id}>{g.nama}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {showKaryawan && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Karyawan *</label>
                                <input
                                    type="number"
                                    placeholder="ID Karyawan"
                                    value={karyawanId || ''}
                                    onChange={(e) => setKaryawanId(Number(e.target.value))}
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                />
                            </div>
                        )}

                        {showSupplier && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Nama Supplier *</label>
                                <input
                                    type="text"
                                    placeholder="Nama supplier"
                                    value={supplierNama}
                                    onChange={(e) => setSupplierNama(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                />
                            </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">No. Referensi</label>
                            <input type="text" placeholder="Nomor surat jalan / PO" value={noReferensi} onChange={(e) => setNoReferensi(e.target.value)} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Catatan</label>
                        <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" placeholder="Catatan tambahan..." />
                    </div>
                </div>

                {/* Detail Items */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Detail Item</h2>
                        <Button type="button" variant="outline" size="sm" onClick={addDetail}>
                            <span className="material-symbols-outlined text-[16px] mr-1">add</span> Tambah Item
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {details.map((detail, idx) => {
                            const selectedProduk = produkData?.data?.find(p => p.id === detail.produk_id);
                            return (
                                <div key={detail._key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-500">Item #{idx + 1}</span>
                                        {details.length > 1 && (
                                            <button type="button" onClick={() => removeDetail(detail._key)} className="text-red-500 hover:text-red-700 text-xs">Hapus</button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-gray-500">Produk *</label>
                                            <select value={detail.produk_id} onChange={(e) => updateDetail(detail._key, 'produk_id', Number(e.target.value))} className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                                <option value={0}>-- Pilih Produk --</option>
                                                {produkData?.data?.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.code} - {p.nama}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-gray-500">UOM *</label>
                                            <select value={detail.uom_id} onChange={(e) => updateDetail(detail._key, 'uom_id', Number(e.target.value))} className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                                <option value={0}>-- Pilih UOM --</option>
                                                {uomData?.data?.map((u) => (
                                                    <option key={u.id} value={u.id}>{u.nama}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-gray-500">Jumlah *</label>
                                            <input
                                                type="number"
                                                value={detail.jumlah}
                                                onChange={(e) => updateDetail(detail._key, 'jumlah', Number(e.target.value))}
                                                min={tipe === 'Adjustment' ? undefined : 1}
                                                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                            />
                                        </div>
                                    </div>

                                    {selectedProduk?.has_serial_number && (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-gray-500">Serial Numbers (satu per baris)</label>
                                            <textarea
                                                value={detail.serial_numbers?.join('\n') || ''}
                                                onChange={(e) => updateSerialNumbers(detail._key, e.target.value)}
                                                rows={3}
                                                placeholder="SN-001&#10;SN-002&#10;SN-003"
                                                className="flex w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium text-gray-500">Catatan Item</label>
                                        <input type="text" value={detail.catatan || ''} onChange={(e) => updateDetail(detail._key, 'catatan', e.target.value)} placeholder="Catatan untuk item ini" className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Dokumen Lampiran */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Dokumen Lampiran</h2>
                    <p className="text-xs text-gray-500">Upload surat jalan, invoice, atau dokumen pendukung lainnya (maks 5 file, 5MB per file)</p>

                    <input ref={dokumenInputRef} type="file" accept="image/*,.pdf" multiple className="hidden"
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const total = dokumenFiles.length + files.length;
                            if (total > 5) { toast.error('Maksimal 5 dokumen'); return; }
                            setDokumenFiles(prev => [...prev, ...files]);
                            if (dokumenInputRef.current) dokumenInputRef.current.value = '';
                        }}
                    />

                    {dokumenFiles.length > 0 && (
                        <div className="space-y-2">
                            {dokumenFiles.map((f, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-gray-400">
                                            {f.type.startsWith('image/') ? 'image' : 'description'}
                                        </span>
                                        <span className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-[300px]">{f.name}</span>
                                        <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                                    </div>
                                    <button type="button" onClick={() => setDokumenFiles(prev => prev.filter((_, idx) => idx !== i))}
                                        className="text-red-400 hover:text-red-600">
                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {dokumenFiles.length < 5 && (
                        <button type="button" onClick={() => dokumenInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-700">
                            <span className="material-symbols-outlined text-[18px]">upload_file</span>
                            Tambah Dokumen
                        </button>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => navigate('/inventory/transaksi')}>Batal</Button>
                    <Button type="submit" isLoading={createMutation.isPending}>Simpan Transaksi</Button>
                </div>
            </form>
        </div>
    );
};

export default TransaksiFormPage;
