import { useState, useEffect, useCallback, useRef } from 'react';
import { useInvGudangList } from '../../hooks/useInventoryMasterData';
import inventoryEmployeeService, { EmployeeWithAssets } from '../../services/api/inventory-employee.service';
import { InvSerialNumber } from '../../types/inventory';
import { SearchableSelect } from '../common/SearchableSelect';

export interface ReturSelection {
    karyawan_id: number;
    karyawan_nama: string;
    gudang_id: number;
    items: { serial_number_id: number; produk_id: number; uom_id: number; identifier: string }[];
}

interface Props {
    initialKaryawanId?: number;
    preselectSerialIds?: number[];
    onChange: (sel: ReturSelection) => void;
}

const ReturAssetPicker: React.FC<Props> = ({ initialKaryawanId, preselectSerialIds, onChange }) => {
    const { data: gudangData } = useInvGudangList({ limit: 100, status: 'Aktif' });

    const [search, setSearch] = useState('');
    const [options, setOptions] = useState<EmployeeWithAssets[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [karyawanId, setKaryawanId] = useState<number>(initialKaryawanId || 0);
    const [karyawanNama, setKaryawanNama] = useState('');
    const [assets, setAssets] = useState<InvSerialNumber[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [gudangId, setGudangId] = useState<number>(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadAssets = useCallback(async (empId: number) => {
        const res = await inventoryEmployeeService.getEmployeeAssets(empId);
        setAssets(res.data || []);
    }, []);

    const runSearch = useCallback(async (q: string) => {
        try {
            const res = await inventoryEmployeeService.getEmployeesWithAssets(q);
            setOptions(res.data);
            setShowDropdown(true);
        } catch { setOptions([]); }
    }, []);

    // Preselect employee (entry A / C) and load assets immediately.
    useEffect(() => {
        if (initialKaryawanId) {
            setKaryawanId(initialKaryawanId);
            loadAssets(initialKaryawanId);
        }
    }, [initialKaryawanId, loadAssets]);

    // Preselect specific units (entry C).
    useEffect(() => {
        if (preselectSerialIds?.length) setSelectedIds(preselectSerialIds);
    }, [preselectSerialIds]);

    useEffect(() => {
        const timer = setTimeout(() => runSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search, runSearch]);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    // Notify parent whenever selection changes.
    useEffect(() => {
        const items = assets
            .filter(a => selectedIds.includes(a.id))
            .map(a => ({
                serial_number_id: a.id,
                produk_id: a.produk_id,
                uom_id: a.produk?.uom_id || 0,
                identifier: a.serial_number || a.tag_number || '',
            }));
        onChange({ karyawan_id: karyawanId, karyawan_nama: karyawanNama, gudang_id: gudangId, items });
    }, [karyawanId, karyawanNama, gudangId, selectedIds, assets, onChange]);

    const pickEmployee = (emp: EmployeeWithAssets) => {
        setKaryawanId(emp.id);
        setKaryawanNama(`${emp.nama_lengkap} (${emp.nomor_induk_karyawan})`);
        setSearch('');
        setShowDropdown(false);
        setSelectedIds([]);
        loadAssets(emp.id);
    };

    const toggle = (id: number) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Karyawan (pemegang aset) *</label>
                <div className="relative" ref={dropdownRef}>
                    <input
                        type="text"
                        placeholder="Ketik nama/NIK karyawan..."
                        value={karyawanNama || search}
                        onFocus={() => { if (!karyawanId) runSearch(search); }}
                        onChange={(e) => { setSearch(e.target.value); setKaryawanNama(''); setKaryawanId(0); setAssets([]); }}
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    />
                    {showDropdown && options.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {options.map(emp => (
                                <button key={emp.id} type="button" onClick={() => pickEmployee(emp)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center">
                                    <span className="text-gray-900 dark:text-white">{emp.nama_lengkap}</span>
                                    <span className="text-xs text-gray-400">{emp.asset_count} aset · {emp.nomor_induk_karyawan}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Gudang Tujuan (pengembalian) *</label>
                <SearchableSelect
                    options={(gudangData?.data || []).map(g => ({ value: g.id, label: g.nama }))}
                    value={gudangId || null}
                    onChange={(val) => setGudangId(Number(val) || 0)}
                    placeholder="-- Pilih Gudang Tujuan --"
                />
            </div>

            {karyawanId > 0 && (
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Aset yang Diretur <span className="text-gray-400">({selectedIds.length} dipilih)</span>
                    </label>
                    <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                        {assets.length === 0 && (
                            <div className="px-3 py-2 text-xs text-gray-400 italic">Karyawan ini tidak memegang aset ber-serial/tag</div>
                        )}
                        {assets.map(a => (
                            <label key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                <input type="checkbox" checked={selectedIds.includes(a.id)} onChange={() => toggle(a.id)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary" />
                                <span className="font-medium text-gray-900 dark:text-white">{a.produk?.nama}</span>
                                <span className="ml-auto font-mono text-xs text-gray-500">{a.serial_number || a.tag_number || '-'}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReturAssetPicker;
