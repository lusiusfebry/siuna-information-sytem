import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    useOpnameSession,
    useStartOpname,
    useUpsertOpnameDetail,
    useUpsertOpnameSerial,
    useFinishOpname,
    useApproveOpname,
    useCancelOpname,
} from '../../../hooks/useInventoryOpname';
import inventoryOpnameService from '../../../services/api/inventory-opname.service';
import { usePermission } from '../../../hooks/usePermission';
import { InvOpnameDetail, InvOpnameSerial, OpnameStatus } from '../../../types/inventory';
import Button from '../../../components/common/Button';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Modal from '../../../components/common/Modal';

const STATUS_COLORS: Record<OpnameStatus, string> = {
    'Draft': 'bg-gray-100 text-gray-700',
    'Berjalan': 'bg-blue-100 text-blue-800',
    'Selesai': 'bg-amber-100 text-amber-800',
    'Approved': 'bg-green-100 text-green-800',
    'Dibatalkan': 'bg-red-100 text-red-700',
};

const OpnameInputRow = ({ item, sessionId }: { item: InvOpnameDetail; sessionId: number }) => {
    const [value, setValue] = useState<string>(item.jumlah_fisik != null ? String(item.jumlah_fisik) : '');
    const [catatan, setCatatan] = useState<string>(item.catatan ?? '');
    const [dirty, setDirty] = useState(false);
    const mutation = useUpsertOpnameDetail();

    const save = () => {
        if (!dirty) return;
        const parsed = value === '' ? null : Number(value);
        if (parsed != null && (Number.isNaN(parsed) || parsed < 0)) return;
        mutation.mutate(
            { id: sessionId, payload: { produk_id: item.produk_id, jumlah_fisik: parsed, catatan: catatan || null } },
            {
                onSuccess: () => setDirty(false),
                onError: (err) => toast.error(err.response?.data?.message || 'Gagal menyimpan'),
            }
        );
    };

    const fisik = value === '' ? null : Number(value);
    const selisih = fisik != null ? fisik - item.jumlah_sistem_snapshot : null;

    return (
        <tr className="border-b border-gray-50 dark:border-gray-800">
            <td className="px-4 py-3">{item.produk?.nama} <span className="text-gray-400 text-xs">({item.produk?.code})</span></td>
            <td className="px-4 py-3 text-right font-medium">{item.jumlah_sistem_snapshot}</td>
            <td className="px-4 py-3 text-right">
                <input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(e) => { setValue(e.target.value); setDirty(true); }}
                    onBlur={save}
                    className="w-24 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary dark:text-gray-100"
                    placeholder="—"
                />
            </td>
            <td className={`px-4 py-3 text-right font-semibold ${selisih == null ? 'text-gray-400' : selisih === 0 ? 'text-gray-500' : selisih > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {selisih == null ? '—' : selisih > 0 ? `+${selisih}` : selisih}
            </td>
            <td className="px-4 py-3">
                <input
                    type="text"
                    value={catatan}
                    onChange={(e) => { setCatatan(e.target.value); setDirty(true); }}
                    onBlur={save}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-gray-100"
                    placeholder="Catatan..."
                />
            </td>
            <td className="px-2 py-3 w-8 text-center">
                {mutation.isPending ? <span className="text-xs text-gray-400">...</span> : dirty ? <span className="text-xs text-amber-500" title="Belum tersimpan">●</span> : <span className="text-xs text-green-500" title="Tersimpan">✓</span>}
            </td>
        </tr>
    );
};

type PendingAction = 'start' | 'finish' | 'approve' | null;

// Baris toggle satu unit ber-serial di dalam sub-tabel produk tipe Serial.
const SerialToggleRow = ({ unit, sessionId, editable }: { unit: InvOpnameSerial; sessionId: number; editable: boolean }) => {
    const [catatan, setCatatan] = useState<string>(unit.catatan ?? '');
    const [catDirty, setCatDirty] = useState(false);
    const mutation = useUpsertOpnameSerial();

    const setKondisi = (kondisi: 'Ada' | 'Tidak Ada') => {
        mutation.mutate(
            { id: sessionId, payload: { opname_serial_id: unit.id, kondisi, catatan: catatan || null } },
            { onError: (err) => toast.error(err.response?.data?.message || 'Gagal menyimpan') },
        );
    };

    const saveCatatan = () => {
        if (!catDirty) return;
        mutation.mutate(
            { id: sessionId, payload: { opname_serial_id: unit.id, kondisi: unit.kondisi, catatan: catatan || null } },
            {
                onSuccess: () => setCatDirty(false),
                onError: (err) => toast.error(err.response?.data?.message || 'Gagal menyimpan'),
            },
        );
    };

    const ada = unit.kondisi === 'Ada';
    return (
        <tr className="border-b border-gray-50 dark:border-gray-800/60">
            <td className="px-4 py-2 font-mono text-xs">{unit.serial_number || '—'}</td>
            <td className="px-4 py-2 font-mono text-xs">{unit.tag_number || '—'}</td>
            <td className="px-4 py-2">
                {editable ? (
                    <div className="inline-flex rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden text-xs">
                        <button
                            type="button"
                            onClick={() => setKondisi('Ada')}
                            className={`px-2.5 py-1 ${ada ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >Ada</button>
                        <button
                            type="button"
                            onClick={() => setKondisi('Tidak Ada')}
                            className={`px-2.5 py-1 ${!ada ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >Tidak Ada</button>
                    </div>
                ) : (
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ada ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>{unit.kondisi}</span>
                )}
            </td>
            <td className="px-4 py-2">
                {editable ? (
                    <input
                        type="text"
                        value={catatan}
                        onChange={(e) => { setCatatan(e.target.value); setCatDirty(true); }}
                        onBlur={saveCatatan}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary dark:text-gray-100"
                        placeholder="Catatan..."
                    />
                ) : (
                    <span className="text-gray-600 dark:text-gray-400 text-xs">{unit.catatan || '—'}</span>
                )}
            </td>
        </tr>
    );
};

// Baris untuk produk tipe Serial: ringkasan + toggle expand daftar unit.
const SerialProductRow = ({ item, sessionId, editable, colCount }: { item: InvOpnameDetail; sessionId: number; editable: boolean; colCount: number }) => {
    const [open, setOpen] = useState(false);
    const serials = item.serials ?? [];
    const adaCount = serials.filter((s) => s.kondisi === 'Ada').length;
    const tidakAdaCount = serials.length - adaCount;
    const selisih = item.jumlah_fisik != null ? (item.jumlah_fisik - item.jumlah_sistem_snapshot) : (adaCount - item.jumlah_sistem_snapshot);
    return (
        <>
            <tr className="border-b border-gray-50 dark:border-gray-800 bg-blue-50/30 dark:bg-blue-900/10">
                <td className="px-4 py-3">
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        className="flex items-center gap-2 text-left"
                    >
                        <span className="material-symbols-outlined text-[18px] text-gray-500">{open ? 'expand_more' : 'chevron_right'}</span>
                        <span>
                            <span className="text-gray-900 dark:text-gray-100">{item.produk?.nama ?? '—'}</span>
                            <span className="text-gray-400 text-xs"> ({item.produk?.code})</span>
                            <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">Serial/Tag</span>
                        </span>
                    </button>
                </td>
                <td className="px-4 py-3 text-right font-medium">{item.jumlah_sistem_snapshot}</td>
                <td className="px-4 py-3 text-right">
                    <span className="text-green-600 font-medium">{adaCount}</span>
                    <span className="text-gray-400"> / </span>
                    <span className="text-red-600 font-medium">{tidakAdaCount}</span>
                    <div className="text-[10px] text-gray-500">Ada / Hilang</div>
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${selisih === 0 ? 'text-gray-500' : selisih > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selisih > 0 ? `+${selisih}` : selisih}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                    {editable ? 'Toggle per unit di bawah' : (item.catatan || '—')}
                </td>
                {editable && <td className="px-2 py-3 w-8" />}
            </tr>
            {open && (
                <tr>
                    <td colSpan={colCount} className="p-0 bg-gray-50/60 dark:bg-gray-900/40">
                        <div className="px-6 py-3">
                            {serials.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">Tidak ada unit ter-snapshot untuk produk ini.</p>
                            ) : (
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-left text-gray-500 dark:text-gray-400">
                                            <th className="px-4 py-1.5">Serial Number</th>
                                            <th className="px-4 py-1.5">Tag Number</th>
                                            <th className="px-4 py-1.5">Kondisi</th>
                                            <th className="px-4 py-1.5">Catatan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {serials.map((u) => <SerialToggleRow key={u.id} unit={u} sessionId={sessionId} editable={editable} />)}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

const OpnameDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const sessionId = Number(id);
    const navigate = useNavigate();
    const { can } = usePermission();

    const { data, isLoading, isError } = useOpnameSession(sessionId);
    const session = data?.data;

    const startMut = useStartOpname();
    const finishMut = useFinishOpname();
    const approveMut = useApproveOpname();
    const cancelMut = useCancelOpname();

    const [pending, setPending] = useState<PendingAction>(null);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [downloading, setDownloading] = useState(false);

    const canWrite = can('inventory_stock', 'update');

    if (isLoading) {
        return <div className="p-6 text-gray-500 dark:text-gray-400">Memuat sesi opname...</div>;
    }
    if (isError || !session) {
        return (
            <div className="p-6">
                <p className="text-red-600 mb-4">Sesi opname tidak ditemukan.</p>
                <Button variant="secondary" onClick={() => navigate('/inventory/opname')}>Kembali ke daftar</Button>
            </div>
        );
    }

    const runStart = () => {
        startMut.mutate(sessionId, {
            onSuccess: () => { setPending(null); toast.success('Stok opname dimulai. Snapshot stok telah dibuat.'); },
            onError: (err) => { setPending(null); toast.error(err.response?.data?.message || 'Gagal memulai stok opname'); },
        });
    };

    const runFinish = () => {
        finishMut.mutate(sessionId, {
            onSuccess: () => { setPending(null); toast.success('Sesi opname diselesaikan. Menunggu persetujuan.'); },
            onError: (err) => { setPending(null); toast.error(err.response?.data?.message || 'Gagal menyelesaikan sesi'); },
        });
    };

    const runApprove = () => {
        approveMut.mutate(sessionId, {
            onSuccess: () => { setPending(null); toast.success('Opname disetujui. Penyesuaian stok telah diterapkan.'); },
            onError: (err) => { setPending(null); toast.error(err.response?.data?.message || 'Gagal menyetujui opname'); },
        });
    };

    const runCancel = () => {
        const reason = cancelReason.trim();
        if (reason.length < 5) { toast.error('Alasan pembatalan minimal 5 karakter'); return; }
        cancelMut.mutate({ id: sessionId, reason }, {
            onSuccess: () => { setCancelOpen(false); setCancelReason(''); toast.success('Sesi opname dibatalkan.'); },
            onError: (err) => toast.error(err.response?.data?.message || 'Gagal membatalkan sesi'),
        });
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const blob = await inventoryOpnameService.downloadBeritaAcara(sessionId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Berita-Acara-Opname-${session.kode}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('Gagal mengunduh berita acara');
        } finally {
            setDownloading(false);
        }
    };

    const detail = session.detail ?? [];
    const totalSelisih = detail.reduce((acc, d) => acc + (d.jumlah_fisik != null && d.selisih != null ? d.selisih : 0), 0);
    const sudahDiinput = detail.filter((d) => d.jumlah_fisik != null).length;

    const confirmMap: Record<Exclude<PendingAction, null>, { title: string; message: string; confirmText: string; variant: 'danger' | 'warning' | 'info'; onConfirm: () => void; isLoading: boolean }> = {
        start: { title: 'Mulai Stok Opname', message: `Memulai opname akan mengunci gudang "${session.gudang?.nama ?? ''}" dari transaksi lain dan membuat snapshot stok saat ini. Lanjutkan?`, confirmText: 'Ya, Mulai', variant: 'warning', onConfirm: runStart, isLoading: startMut.isPending },
        finish: { title: 'Selesaikan Sesi', message: 'Setelah diselesaikan, jumlah fisik tidak bisa diubah lagi dan sesi menunggu persetujuan. Lanjutkan?', confirmText: 'Ya, Selesaikan', variant: 'warning', onConfirm: runFinish, isLoading: finishMut.isPending },
        approve: { title: 'Setujui Opname', message: `Menyetujui akan menerapkan penyesuaian stok untuk ${detail.filter((d) => d.jumlah_fisik != null && d.selisih !== 0).length} produk berselisih. Aksi ini tidak bisa dibatalkan. Lanjutkan?`, confirmText: 'Ya, Setujui', variant: 'info', onConfirm: runApprove, isLoading: approveMut.isPending },
    };
    const activeConfirm = pending ? confirmMap[pending] : null;
    const editable = session.status === 'Berjalan' && canWrite;

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <button onClick={() => navigate('/inventory/opname')} className="text-sm text-gray-500 hover:text-primary mb-1">← Kembali ke daftar</button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{session.kode}</h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[session.status]}`}>{session.status}</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {canWrite && session.status === 'Draft' && (
                        <Button variant="warning" onClick={() => setPending('start')} isLoading={startMut.isPending}>Mulai Stok Opname</Button>
                    )}
                    {canWrite && session.status === 'Berjalan' && (
                        <Button variant="warning" onClick={() => setPending('finish')} isLoading={finishMut.isPending}>Selesaikan</Button>
                    )}
                    {canWrite && session.status === 'Selesai' && (
                        <Button variant="info" onClick={() => setPending('approve')} isLoading={approveMut.isPending}>Setujui</Button>
                    )}
                    {(session.status === 'Approved' || session.status === 'Selesai') && (
                        <Button variant="secondary" onClick={handleDownload} isLoading={downloading}>Berita Acara</Button>
                    )}
                    {canWrite && ['Draft', 'Berjalan', 'Selesai'].includes(session.status) && (
                        <Button variant="danger" onClick={() => setCancelOpen(true)}>Batalkan</Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase">Gudang</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{session.gudang?.nama ?? '—'}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase">Dibuat oleh</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{session.creator?.nama ?? '—'}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase">Produk Diinput</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{sudahDiinput} / {detail.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase">Total Selisih</p>
                    <p className={`font-semibold ${totalSelisih === 0 ? 'text-gray-900 dark:text-gray-100' : totalSelisih > 0 ? 'text-green-600' : 'text-red-600'}`}>{totalSelisih > 0 ? `+${totalSelisih}` : totalSelisih}</p>
                </div>
            </div>

            {session.catatan && (
                <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
                    <span className="font-semibold">Catatan: </span>{session.catatan}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase mb-1">Penanggung Jawab Gudang</p>
                    {session.gudang?.penanggung_jawab ? (
                        <>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{session.gudang.penanggung_jawab.nama_lengkap}</p>
                            {session.gudang.penanggung_jawab.nomor_induk_karyawan && (
                                <p className="text-xs text-gray-500">NIK: {session.gudang.penanggung_jawab.nomor_induk_karyawan}</p>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Belum ditentukan</p>
                    )}
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase mb-1">Atasan (dari Manager PJ)</p>
                    {session.gudang?.penanggung_jawab?.manager ? (
                        <>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{session.gudang.penanggung_jawab.manager.nama_lengkap}</p>
                            {session.gudang.penanggung_jawab.manager.nomor_induk_karyawan && (
                                <p className="text-xs text-gray-500">NIK: {session.gudang.penanggung_jawab.manager.nomor_induk_karyawan}</p>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Belum ditentukan</p>
                    )}
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase mb-1">Petugas Opname ({session.petugas?.length ?? 0})</p>
                    {(session.petugas?.length ?? 0) === 0 ? (
                        <p className="text-sm text-gray-400 italic">Belum ada petugas</p>
                    ) : (
                        <ul className="text-sm text-gray-900 dark:text-gray-100 space-y-0.5">
                            {session.petugas!.map((p) => (
                                <li key={p.id} className="flex items-baseline gap-2">
                                    <span className="text-gray-400 text-xs">•</span>
                                    <span>{p.karyawan?.nama_lengkap ?? '—'}</span>
                                    {p.karyawan?.nomor_induk_karyawan && (
                                        <span className="text-xs text-gray-500">({p.karyawan.nomor_induk_karyawan})</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Produk</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Stok Sistem</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Jumlah Fisik</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Selisih</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Catatan</th>
                                {editable && <th className="px-2 py-3 w-8" />}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {detail.length === 0 ? (
                                <tr><td colSpan={editable ? 6 : 5} className="px-4 py-8 text-center text-gray-400">Tidak ada data produk</td></tr>
                            ) : (
                                detail.map((d) => {
                                    if (d.tipe_hitung === 'Serial') {
                                        return <SerialProductRow key={d.id} item={d} sessionId={sessionId} editable={editable} colCount={editable ? 6 : 5} />;
                                    }
                                    if (editable) {
                                        return <OpnameInputRow key={d.id} item={d} sessionId={sessionId} />;
                                    }
                                    return (
                                        <tr key={d.id} className="border-b border-gray-50 dark:border-gray-800">
                                            <td className="px-4 py-3">
                                                <span className="text-gray-900 dark:text-gray-100">{d.produk?.nama ?? '—'}</span>
                                                <span className="text-gray-400 text-xs"> ({d.produk?.code})</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">{d.jumlah_sistem_snapshot}</td>
                                            <td className="px-4 py-3 text-right">
                                                {d.jumlah_fisik != null ? d.jumlah_fisik : <span className="text-gray-400 italic">Belum diinput</span>}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-semibold ${d.selisih == null ? 'text-gray-400' : d.selisih === 0 ? 'text-gray-500' : d.selisih > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {d.selisih == null ? '—' : d.selisih > 0 ? `+${d.selisih}` : d.selisih}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{d.catatan || '—'}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {activeConfirm && (
                <ConfirmDialog
                    isOpen
                    title={activeConfirm.title}
                    message={activeConfirm.message}
                    confirmText={activeConfirm.confirmText}
                    variant={activeConfirm.variant}
                    isLoading={activeConfirm.isLoading}
                    onConfirm={activeConfirm.onConfirm}
                    onCancel={() => setPending(null)}
                />
            )}

            <Modal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} title="Batalkan Sesi Opname">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Masukkan alasan pembatalan sesi opname ini.</p>
                    <textarea
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                        placeholder="Alasan pembatalan..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setCancelOpen(false)}>Batal</Button>
                        <Button variant="danger" onClick={runCancel} isLoading={cancelMut.isPending}>Batalkan Sesi</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default OpnameDetailPage;
