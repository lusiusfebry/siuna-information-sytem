import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useCreateTransaksi } from '../../../hooks/useInventoryStok';
import { useInvGudangList, useInvProdukList, useInvUomList } from '../../../hooks/useInventoryMasterData';
import { useFacBuildingList, useFacRoomList } from '../../../hooks/useFacilityMasterData';
import { TransaksiPayload, TransaksiTipe, TransaksiSubTipe, TransaksiDetailPayload, InvSerialNumber } from '../../../types/inventory';
import Button from '../../../components/common/Button';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import inventoryStokService from '../../../services/api/inventory-stok.service';
import inventoryEmployeeService from '../../../services/api/inventory-employee.service';

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
    const { data: buildingData } = useFacBuildingList({ limit: 100, status: 'Aktif' });
    const { data: roomData } = useFacRoomList({ limit: 200, status: 'Tersedia' });

    const [tipe, setTipe] = useState<TransaksiTipe>('Masuk');
    const [subTipe, setSubTipe] = useState<TransaksiSubTipe>('Supplier');
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [gudangId, setGudangId] = useState<number>(0);
    const [gudangTujuanId, setGudangTujuanId] = useState<number>(0);
    const [buildingId, setBuildingId] = useState<number>(0);
    const [roomId, setRoomId] = useState<number>(0);
    const [karyawanId, setKaryawanId] = useState<number>(0);
    const [supplierNama, setSupplierNama] = useState('');
    const [noReferensi, setNoReferensi] = useState('');
    const [catatan, setCatatan] = useState('');
    const [dokumenFiles, setDokumenFiles] = useState<File[]>([]);
    const dokumenInputRef = useRef<HTMLInputElement>(null);

    const [karyawanSearch, setKaryawanSearch] = useState('');
    const [karyawanOptions, setKaryawanOptions] = useState<{ id: number; nama_lengkap: string; nomor_induk_karyawan: string }[]>([]);
    const [showKaryawanDropdown, setShowKaryawanDropdown] = useState(false);
    const [karyawanNama, setKaryawanNama] = useState('');
    const karyawanDropdownRef = useRef<HTMLDivElement>(null);

    const [beritaAcaraModal, setBeritaAcaraModal] = useState<{ show: boolean; employeeId: number; transaksiId: number; employeeName: string } | null>(null);
    const [downloadingBA, setDownloadingBA] = useState(false);
    const [availableSNs, setAvailableSNs] = useState<Record<string, InvSerialNumber[]>>({});
    const [snSearchTerms, setSnSearchTerms] = useState<Record<string, string>>({});

    const searchKaryawan = useCallback(async (query: string) => {
        if (query.length < 2) { setKaryawanOptions([]); return; }
        try {
            const res = await inventoryEmployeeService.searchEmployees(query);
            setKaryawanOptions(res.data);
            setShowKaryawanDropdown(true);
        } catch { setKaryawanOptions([]); }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => searchKaryawan(karyawanSearch), 300);
        return () => clearTimeout(timer);
    }, [karyawanSearch, searchKaryawan]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (karyawanDropdownRef.current && !karyawanDropdownRef.current.contains(e.target as Node)) {
                setShowKaryawanDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [details, setDetails] = useState<DetailRow[]>([
        { _key: '1', produk_id: 0, uom_id: 0, jumlah: 1, catatan: '', serial_numbers: [] },
    ]);

    useEffect(() => {
        if (tipe === 'Masuk' || gudangId === 0) return;
        details.forEach(d => {
            if (d.produk_id > 0) fetchAvailableSNs(d._key, d.produk_id, gudangId);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gudangId, tipe]);

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
        setDetails(prev => prev.map(d => {
            if (d._key !== key) return d;
            const updated = { ...d, [field]: value };
            if (field === 'produk_id') {
                const produk = produkData?.data?.find(p => p.id === Number(value));
                if (produk?.uom_id) updated.uom_id = produk.uom_id;
                updated.serial_numbers = [];
            }
            return updated;
        }));
        if (field === 'produk_id' && Number(value) > 0 && gudangId > 0 && tipe !== 'Masuk') {
            fetchAvailableSNs(key, Number(value), gudangId);
        }
    };

    const fetchAvailableSNs = async (key: string, produkId: number, gId: number) => {
        try {
            const res = await inventoryStokService.getSerialNumbers({
                produk_id: produkId, gudang_id: gId, status: 'Tersedia', limit: 200,
            });
            setAvailableSNs(prev => ({ ...prev, [key]: res.data || [] }));
        } catch {
            setAvailableSNs(prev => ({ ...prev, [key]: [] }));
        }
    };

    const toggleSNSelection = (key: string, identifier: string) => {
        setDetails(prev => prev.map(d => {
            if (d._key !== key) return d;
            const current = d.serial_numbers || [];
            const isSelected = current.includes(identifier);
            const updated = isSelected
                ? current.filter(s => s !== identifier)
                : [...current, identifier];
            return { ...d, serial_numbers: updated };
        }));
    };

    const updateSerialNumbers = (key: string, value: string) => {
        const sns = value.split('\n').map(s => s.trim()).filter(Boolean);
        setDetails(prev => prev.map(d => d._key === key ? { ...d, serial_numbers: sns } : d));
    };

    const showGudangTujuan = subTipe === 'Transfer Masuk' || subTipe === 'Transfer Gudang';
    const showBuilding = subTipe === 'Ke Gedung/Mess';
    const showKaryawan = subTipe === 'Ke Karyawan' || subTipe === 'Retur Karyawan';
    const showSupplier = subTipe === 'Supplier';

    const filteredRooms = roomData?.data?.filter(r => r.building_id === buildingId) || [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!gudangId) { toast.error('Pilih gudang'); return; }
        if (showGudangTujuan && !gudangTujuanId) { toast.error('Pilih gudang tujuan'); return; }
        if (showBuilding && !buildingId) { toast.error('Pilih gedung/mess tujuan'); return; }
        if (showSupplier && !supplierNama.trim()) { toast.error('Isi nama supplier'); return; }

        const invalidDetail = details.find(d => !d.produk_id || !d.uom_id || d.jumlah === 0);
        if (invalidDetail) { toast.error('Lengkapi semua detail item'); return; }

        const payload: TransaksiPayload = {
            tipe,
            sub_tipe: subTipe,
            tanggal,
            gudang_id: gudangId,
            gudang_tujuan_id: showGudangTujuan ? gudangTujuanId : null,
            facility_building_id: showBuilding ? buildingId : null,
            facility_room_id: showBuilding && roomId ? roomId : null,
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

                if (subTipe === 'Ke Karyawan' && karyawanId && result.data?.id) {
                    setBeritaAcaraModal({
                        show: true,
                        employeeId: karyawanId,
                        transaksiId: result.data.id,
                        employeeName: karyawanNama,
                    });
                } else {
                    toast.success('Transaksi berhasil dibuat');
                    navigate('/inventory/transaksi');
                }
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

                        {showBuilding && (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Gedung/Mess Tujuan *</label>
                                    <select value={buildingId} onChange={(e) => { setBuildingId(Number(e.target.value)); setRoomId(0); }} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                        <option value={0}>-- Pilih Gedung/Mess --</option>
                                        {buildingData?.data?.map((b) => (
                                            <option key={b.id} value={b.id}>{b.code} - {b.nama} ({b.tipe})</option>
                                        ))}
                                    </select>
                                </div>
                                {buildingId > 0 && filteredRooms.length > 0 && (
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Ruangan (opsional)</label>
                                        <select value={roomId} onChange={(e) => setRoomId(Number(e.target.value))} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                            <option value={0}>-- Semua / Tidak Spesifik --</option>
                                            {filteredRooms.map((r) => (
                                                <option key={r.id} value={r.id}>{r.code} - {r.nama}{r.lantai ? ` (Lt. ${r.lantai})` : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </>
                        )}

                        {showKaryawan && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Karyawan *</label>
                                <div className="relative" ref={karyawanDropdownRef}>
                                    <input
                                        type="text"
                                        placeholder="Ketik nama karyawan..."
                                        value={karyawanNama || karyawanSearch}
                                        onChange={(e) => {
                                            setKaryawanSearch(e.target.value);
                                            setKaryawanNama('');
                                            setKaryawanId(0);
                                        }}
                                        onFocus={() => { if (karyawanOptions.length > 0) setShowKaryawanDropdown(true); }}
                                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                    />
                                    {karyawanId > 0 && (
                                        <button type="button" onClick={() => { setKaryawanId(0); setKaryawanNama(''); setKaryawanSearch(''); }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                    )}
                                    {showKaryawanDropdown && karyawanOptions.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {karyawanOptions.map((emp) => (
                                                <button key={emp.id} type="button"
                                                    onClick={() => {
                                                        setKaryawanId(emp.id);
                                                        setKaryawanNama(`${emp.nama_lengkap} (${emp.nomor_induk_karyawan})`);
                                                        setKaryawanSearch('');
                                                        setShowKaryawanDropdown(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center">
                                                    <span className="text-gray-900 dark:text-white">{emp.nama_lengkap}</span>
                                                    <span className="text-xs text-gray-400 font-mono">{emp.nomor_induk_karyawan}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
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
                                            <SearchableSelect
                                                options={(produkData?.data || []).map(p => ({ value: p.id, label: `${p.code} - ${p.nama}` }))}
                                                value={detail.produk_id || null}
                                                onChange={(val) => updateDetail(detail._key, 'produk_id', Number(val))}
                                                placeholder="-- Pilih Produk --"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-gray-500">UOM *</label>
                                            {selectedProduk?.uom_id ? (
                                                <div className="flex h-9 w-full items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
                                                    {uomData?.data?.find(u => u.id === selectedProduk.uom_id)?.nama || '-'}
                                                </div>
                                            ) : (
                                                <select value={detail.uom_id} onChange={(e) => updateDetail(detail._key, 'uom_id', Number(e.target.value))} className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                                    <option value={0}>-- Pilih UOM --</option>
                                                    {uomData?.data?.map((u) => (
                                                        <option key={u.id} value={u.id}>{u.nama}</option>
                                                    ))}
                                                </select>
                                            )}
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

                                    {selectedProduk?.has_serial_number && tipe === 'Masuk' && (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-gray-500">
                                                Serial Numbers (satu per baris)
                                                <span className="ml-2 text-gray-400">
                                                    {detail.serial_numbers?.length || 0} / {detail.jumlah} diisi
                                                </span>
                                            </label>
                                            <textarea
                                                value={detail.serial_numbers?.join('\n') || ''}
                                                onChange={(e) => updateSerialNumbers(detail._key, e.target.value)}
                                                rows={Math.max(3, detail.jumlah)}
                                                placeholder={Array.from({length: Math.min(detail.jumlah, 5)}, (_, i) => `SN-${String(i+1).padStart(3,'0')}`).join('\n')}
                                                className="flex w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                            />
                                        </div>
                                    )}

                                    {(selectedProduk?.has_serial_number || selectedProduk?.has_tag_number) && tipe !== 'Masuk' && gudangId > 0 && (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-gray-500">
                                                Pilih {selectedProduk.has_serial_number ? 'Serial Number' : 'Tag Number'}
                                                <span className="ml-2 text-gray-400">
                                                    {detail.serial_numbers?.length || 0} / {detail.jumlah} dipilih
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Cari serial/tag number..."
                                                value={snSearchTerms[detail._key] || ''}
                                                onChange={(e) => setSnSearchTerms(prev => ({ ...prev, [detail._key]: e.target.value }))}
                                                className="flex h-8 w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                            />
                                            <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                                                {(availableSNs[detail._key] || [])
                                                    .filter(sn => {
                                                        const term = (snSearchTerms[detail._key] || '').toLowerCase();
                                                        if (!term) return true;
                                                        return (sn.serial_number || '').toLowerCase().includes(term) ||
                                                               (sn.tag_number || '').toLowerCase().includes(term);
                                                    })
                                                    .map((sn) => {
                                                        const identifier = selectedProduk.has_serial_number
                                                            ? (sn.serial_number || '')
                                                            : (sn.tag_number || '');
                                                        if (!identifier) return null;
                                                        const isChecked = (detail.serial_numbers || []).includes(identifier);
                                                        return (
                                                            <label key={sn.id} className={`flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${isChecked ? 'bg-primary/5' : ''}`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => toggleSNSelection(detail._key, identifier)}
                                                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                                                />
                                                                <span className="font-mono text-gray-700 dark:text-gray-300">
                                                                    {sn.serial_number || '-'}
                                                                </span>
                                                                {sn.tag_number && (
                                                                    <span className="text-gray-400 ml-auto">{sn.tag_number}</span>
                                                                )}
                                                            </label>
                                                        );
                                                    })}
                                                {(availableSNs[detail._key] || []).length === 0 && (
                                                    <div className="px-3 py-2 text-xs text-gray-400 italic">
                                                        {detail.produk_id ? 'Tidak ada item tersedia di gudang ini' : 'Pilih produk terlebih dahulu'}
                                                    </div>
                                                )}
                                            </div>
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

            {/* Berita Acara Confirmation Modal */}
            {beritaAcaraModal?.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                                <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Transaksi Berhasil</h3>
                                <p className="text-sm text-gray-500">Barang telah diserahkan ke {beritaAcaraModal.employeeName}</p>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                Cetak Berita Acara Serah Terima sebagai bukti penyerahan barang?
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    toast.success('Transaksi berhasil dibuat');
                                    navigate('/inventory/transaksi');
                                }}
                                className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                            >
                                Lewati
                            </button>
                            <button
                                onClick={async () => {
                                    setDownloadingBA(true);
                                    try {
                                        const blob = await inventoryEmployeeService.downloadBeritaAcara(
                                            beritaAcaraModal.employeeId,
                                            beritaAcaraModal.transaksiId
                                        );
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.style.display = 'none';
                                        a.href = url;
                                        a.download = `Berita-Acara-Serah-Terima-${beritaAcaraModal.transaksiId}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 2000);
                                        toast.success('Transaksi berhasil dibuat & berita acara diunduh');
                                    } catch {
                                        toast.error('Gagal mengunduh berita acara');
                                        toast.success('Transaksi berhasil dibuat');
                                    } finally {
                                        setDownloadingBA(false);
                                        navigate('/inventory/transaksi');
                                    }
                                }}
                                disabled={downloadingBA}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[18px]">description</span>
                                {downloadingBA ? 'Mengunduh...' : 'Cetak Berita Acara'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransaksiFormPage;
