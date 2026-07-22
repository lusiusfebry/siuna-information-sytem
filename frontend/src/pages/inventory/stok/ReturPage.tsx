import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ReturAssetPicker, { ReturSelection } from '../../../components/inventory/ReturAssetPicker';
import { useReturKaryawan } from '../../../hooks/useReturKaryawan';
import inventoryEmployeeService from '../../../services/api/inventory-employee.service';
import { InvSerialNumber } from '../../../types/inventory';
import Button from '../../../components/common/Button';

const ReturPage = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const initialKaryawanId = Number(params.get('karyawan')) || undefined;

    const { submitRetur, isPending } = useReturKaryawan();
    const [sel, setSel] = useState<ReturSelection | null>(null);
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [catatan, setCatatan] = useState('');

    // Opsi C: serial/tag lookup
    const [lookupTerm, setLookupTerm] = useState('');
    const [lookupResult, setLookupResult] = useState<InvSerialNumber | null | 'notfound'>(null);
    const [preselectKaryawan, setPreselectKaryawan] = useState<number | undefined>(initialKaryawanId);
    const [preselectSerialIds, setPreselectSerialIds] = useState<number[]>([]);

    const runLookup = async () => {
        if (!lookupTerm.trim()) return;
        const res = await inventoryEmployeeService.lookupAsset(lookupTerm.trim());
        setLookupResult(res.data || 'notfound');
    };

    const returUnit = (unit: InvSerialNumber) => {
        if (!unit.karyawan?.id) { toast.error('Aset ini tidak sedang dipegang karyawan'); return; }
        setPreselectKaryawan(unit.karyawan.id);
        setPreselectSerialIds([unit.id]);
        toast.success(`Dipilih: ${unit.produk?.nama} milik ${unit.karyawan.nama_lengkap}`);
    };

    const downloadBA = async (empId: number, trxId: number) => {
        try {
            const blob = await inventoryEmployeeService.downloadBeritaAcara(empId, trxId, 'kembali');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `Berita-Acara-Pengembalian-${trxId}.pdf`;
            document.body.appendChild(a); a.click();
            setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 2000);
        } catch { toast.error('Retur tercatat, tapi gagal mengunduh berita acara'); }
    };

    const handleSubmit = async () => {
        if (!sel || !sel.karyawan_id) { toast.error('Pilih karyawan'); return; }
        if (!sel.gudang_id) { toast.error('Pilih gudang tujuan'); return; }
        if (sel.items.length === 0) { toast.error('Pilih minimal satu aset untuk diretur'); return; }
        try {
            const result = await submitRetur(sel, tanggal, catatan);
            if (result?.id && sel.karyawan_id) {
                await downloadBA(sel.karyawan_id, result.id);
            }
            toast.success('Retur berhasil dicatat');
            navigate('/inventory/transaksi');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Gagal memproses retur');
        }
    };

    return (
        <div className="p-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Retur Aset dari Karyawan</h1>

            {/* Opsi C: lacak via serial/tag */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-6 space-y-3">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Lacak via Serial / Tag Number</h2>
                <div className="flex gap-2">
                    <input value={lookupTerm} onChange={e => setLookupTerm(e.target.value)}
                        placeholder="Masukkan serial / tag number..."
                        className="flex h-10 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                    <Button type="button" variant="outline" onClick={runLookup}>Cari</Button>
                </div>
                {lookupResult === 'notfound' && <p className="text-sm text-red-500">Serial/Tag number tidak ditemukan</p>}
                {lookupResult && lookupResult !== 'notfound' && (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">{lookupResult.produk?.nama}</div>
                        <div className="text-xs text-gray-500 font-mono">{lookupResult.serial_number || lookupResult.tag_number}</div>
                        <div className="mt-1 text-gray-600 dark:text-gray-300">
                            Pemegang: {lookupResult.karyawan?.nama_lengkap
                                ? `${lookupResult.karyawan.nama_lengkap} (${lookupResult.karyawan.nomor_induk_karyawan})`
                                : 'Tidak sedang dipegang karyawan'}
                        </div>
                        {lookupResult.karyawan?.id && (
                            <button type="button" onClick={() => returUnit(lookupResult)}
                                className="mt-2 text-sm font-medium text-primary hover:underline">Retur unit ini</button>
                        )}
                    </div>
                )}
            </div>

            {/* Picker inti */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Tanggal *</label>
                        <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                    </div>
                </div>

                <ReturAssetPicker
                    initialKaryawanId={preselectKaryawan}
                    preselectSerialIds={preselectSerialIds}
                    onChange={setSel}
                />

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Catatan</label>
                    <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2}
                        className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                </div>

                <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => navigate('/inventory/transaksi')}>Batal</Button>
                    <Button type="button" isLoading={isPending} onClick={handleSubmit}>Proses Retur</Button>
                </div>
            </div>
        </div>
    );
};

export default ReturPage;
