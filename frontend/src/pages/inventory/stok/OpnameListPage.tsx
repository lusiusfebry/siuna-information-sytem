import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOpnameList, useCreateOpname } from '../../../hooks/useInventoryOpname';
import { useInvGudangList } from '../../../hooks/useInventoryMasterData';
import { usePermission } from '../../../hooks/usePermission';
import { employeeService } from '../../../services/api/employee.service';
import { InvOpnameSession, OpnameStatus } from '../../../types/inventory';
import Button from '../../../components/common/Button';

const STATUS_COLORS: Record<OpnameStatus, string> = {
    'Draft': 'bg-gray-100 text-gray-700',
    'Berjalan': 'bg-blue-100 text-blue-800',
    'Selesai': 'bg-amber-100 text-amber-800',
    'Approved': 'bg-green-100 text-green-800',
    'Dibatalkan': 'bg-red-100 text-red-700',
};

// PLACEHOLDER_MODAL

const CreateOpnameModal = ({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) => {
    const [gudangId, setGudangId] = useState<number | ''>('');
    const [catatan, setCatatan] = useState('');
    const [petugasIds, setPetugasIds] = useState<number[]>([]);
    const [karyawanList, setKaryawanList] = useState<Array<{ id: number; nama_lengkap: string; nomor_induk_karyawan?: string | null }>>([]);
    const [loadingKaryawan, setLoadingKaryawan] = useState(false);
    const [error, setError] = useState('');
    const { data: gudangData } = useInvGudangList({ limit: 100, status: 'Aktif' });
    const mutation = useCreateOpname();

    const gudangTerpilih = useMemo(
        () => gudangData?.data?.find((g: any) => g.id === Number(gudangId)),
        [gudangData, gudangId],
    );
    const departmentId = gudangTerpilih?.department_id;

    // Ambil karyawan sesuai department gudang.
    useEffect(() => {
        setPetugasIds([]);
        setKaryawanList([]);
        if (!departmentId) return;
        let alive = true;
        setLoadingKaryawan(true);
        employeeService
            .getAllEmployees({ department_id: departmentId, limit: 200 })
            .then((res: any) => {
                if (!alive) return;
                const list = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? []);
                setKaryawanList(
                    list.map((k: any) => ({
                        id: k.id,
                        nama_lengkap: k.nama_lengkap ?? '-',
                        nomor_induk_karyawan: k.nomor_induk_karyawan ?? null,
                    })),
                );
            })
            .catch(() => alive && setKaryawanList([]))
            .finally(() => alive && setLoadingKaryawan(false));
        return () => { alive = false; };
    }, [departmentId]);

    const togglePetugas = (id: number) => {
        setPetugasIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const handleSubmit = () => {
        if (!gudangId) { setError('Pilih gudang terlebih dahulu'); return; }
        if (petugasIds.length === 0) { setError('Pilih minimal 1 petugas opname'); return; }
        mutation.mutate({ gudang_id: Number(gudangId), catatan: catatan || null, petugas_ids: petugasIds }, {
            onSuccess: (res) => onCreated(res.data.id),
            onError: (err) => setError(err.response?.data?.message || 'Gagal membuat sesi opname'),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Buat Sesi Opname Baru</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gudang <span className="text-red-500">*</span></label>
                    <select
                        value={gudangId}
                        onChange={(e) => { setGudangId(e.target.value ? Number(e.target.value) : ''); setError(''); }}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-gray-100"
                    >
                        <option value="">-- Pilih Gudang --</option>
                        {gudangData?.data?.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                    </select>
                    {gudangTerpilih && !departmentId && (
                        <p className="text-xs text-amber-600 mt-1">
                            Gudang ini belum memiliki department. Petugas tidak dapat difilter.
                        </p>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Petugas Opname <span className="text-red-500">*</span>
                        </label>
                        <span className="text-xs text-gray-500">{petugasIds.length} dipilih</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-md border border-gray-300 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-800">
                        {!gudangId ? (
                            <div className="p-3 text-xs text-gray-400 italic">Pilih gudang terlebih dahulu.</div>
                        ) : loadingKaryawan ? (
                            <div className="p-3 text-xs text-gray-400 italic">Memuat karyawan...</div>
                        ) : karyawanList.length === 0 ? (
                            <div className="p-3 text-xs text-gray-400 italic">Tidak ada karyawan di department ini.</div>
                        ) : (
                            karyawanList.map((k) => (
                                <label key={k.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer text-sm">
                                    <input
                                        type="checkbox"
                                        checked={petugasIds.includes(k.id)}
                                        onChange={() => togglePetugas(k.id)}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="flex-1 dark:text-gray-100">{k.nama_lengkap}</span>
                                    <span className="text-xs text-gray-500">{k.nomor_induk_karyawan}</span>
                                </label>
                            ))
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catatan</label>
                    <textarea
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        rows={2}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-gray-100"
                        placeholder="Opsional..."
                    />
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Batal</button>
                    <button onClick={handleSubmit} disabled={mutation.isPending} className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
                        {mutation.isPending ? 'Menyimpan...' : 'Buat Sesi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const OpnameListPage = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<OpnameStatus | ''>('');
    const [gudangId, setGudangId] = useState<number | undefined>();
    const [showCreate, setShowCreate] = useState(false);

    const { data, isLoading } = useOpnameList({
        status: status || undefined,
        gudang_id: gudangId,
    });
    const { data: gudangData } = useInvGudangList({ limit: 100, status: 'Aktif' });
    const { can } = usePermission();
    const canCreate = can('inventory_stock', 'create');

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Opname</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Sesi perhitungan fisik stok gudang</p>
                </div>
                {canCreate && (
                    <Button onClick={() => setShowCreate(true)}>
                        <span className="material-symbols-outlined text-[18px] mr-1.5">add</span>
                        Sesi Opname Baru
                    </Button>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OpnameStatus | '')}
                    className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                >
                    <option value="">Semua Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Berjalan">Berjalan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Approved">Disetujui</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                </select>
                <select
                    value={gudangId || ''}
                    onChange={(e) => setGudangId(e.target.value ? Number(e.target.value) : undefined)}
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
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Kode</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Gudang</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Mulai</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Dibuat Oleh</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-20">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : data?.data?.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Tidak ada sesi opname</td></tr>
                            ) : (
                                data?.data?.map((item: InvOpnameSession) => (
                                    <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-mono text-xs font-semibold">{item.kode}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.gudang?.nama}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || ''}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                            {item.tanggal_mulai ? new Date(item.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.creator?.nama || '-'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => navigate(`/inventory/opname/${item.id}`)} className="text-primary hover:text-blue-700 text-xs font-medium">
                                                Buka
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showCreate && <CreateOpnameModal onClose={() => setShowCreate(false)} onCreated={(id) => navigate(`/inventory/opname/${id}`)} />}
        </div>
    );
};

export default OpnameListPage;
