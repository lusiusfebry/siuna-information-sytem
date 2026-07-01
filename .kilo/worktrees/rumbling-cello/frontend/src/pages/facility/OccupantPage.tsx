import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useOccupantList, useCreateOccupant, useCheckoutOccupant } from '../../hooks/useFacilityOccupant';
import { useFacRoomList, useFacBuildingList } from '../../hooks/useFacilityMasterData';
import { useEmployeeList } from '../../hooks/useEmployee';
import MasterDataTable, { Column } from '../../components/hr/MasterDataTable';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { FacOccupant, OccupantPayload } from '../../types/facility';

interface OccFormData { room_id: string; employee_id: string; tanggal_masuk: string; keterangan: string; }
interface CheckoutFormData { tanggal_keluar: string; keterangan: string; }

const cls = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white';
const lbl = 'text-sm font-medium text-gray-700 dark:text-gray-300';
const selectCls = 'px-3 py-2 border rounded-lg text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

/* ---------- Add Occupant Form ---------- */
const OccupantForm = ({ onSubmit, onCancel, isLoading }: {
    onSubmit: (d: OccupantPayload) => void; onCancel: () => void; isLoading?: boolean;
}) => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm<OccFormData>({
        defaultValues: { room_id: '', employee_id: '', tanggal_masuk: new Date().toISOString().split('T')[0], keterangan: '' },
    });
    const { data: roomData } = useFacRoomList({ limit: 200 });
    const { data: empData } = useEmployeeList();
    const rooms = (roomData?.data || []) as any[];
    const employees = (empData?.data || []) as any[];

    const selectedRoomId = watch('room_id');
    const selectedRoom = rooms.find((r: any) => String(r.id) === selectedRoomId);

    const submit = (d: OccFormData) => onSubmit({
        room_id: Number(d.room_id), employee_id: Number(d.employee_id),
        tanggal_masuk: d.tanggal_masuk, keterangan: d.keterangan || null,
    });

    return (
        <form onSubmit={handleSubmit(submit)} className="space-y-5">
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Ruangan <span className="text-red-500">*</span></label>
                <select {...register('room_id', { required: 'Wajib dipilih' })} className={`${cls} ${errors.room_id ? 'border-red-500' : ''}`}>
                    <option value="">Pilih Ruangan</option>
                    {rooms.map((r: any) => (
                        <option key={r.id} value={r.id}>
                            {r.nama}{r.building ? ` — ${r.building.nama}` : ''} (Kap: {r.kapasitas ?? '-'})
                        </option>
                    ))}
                </select>
                {selectedRoom && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Kapasitas: {selectedRoom.kapasitas ?? '-'} orang
                        {selectedRoom.status === 'Penuh' && (
                            <span className="ml-2 text-red-500 font-medium">— Penuh</span>
                        )}
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Karyawan <span className="text-red-500">*</span></label>
                <select {...register('employee_id', { required: 'Wajib dipilih' })} className={`${cls} ${errors.employee_id ? 'border-red-500' : ''}`}>
                    <option value="">Pilih Karyawan</option>
                    {employees.map((e: any) => <option key={e.id} value={e.id}>{e.nama_lengkap}</option>)}
                </select>
            </div>
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Tanggal Masuk <span className="text-red-500">*</span></label>
                <input type="date" {...register('tanggal_masuk', { required: 'Wajib diisi' })} className={`${cls} ${errors.tanggal_masuk ? 'border-red-500' : ''}`} />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Keterangan</label>
                <textarea {...register('keterangan')} className={cls} rows={2} />
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={isLoading}>Batal</Button>
                <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>Simpan</Button>
            </div>
        </form>
    );
};

/* ---------- Checkout Form ---------- */
const CheckoutForm = ({ item, onSubmit, onCancel, isLoading }: {
    item: FacOccupant; onSubmit: (d: CheckoutFormData) => void; onCancel: () => void; isLoading?: boolean;
}) => {
    const { register, handleSubmit } = useForm<CheckoutFormData>({
        defaultValues: { tanggal_keluar: new Date().toISOString().split('T')[0], keterangan: '' },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <p className="text-sm"><span className="font-medium">Karyawan:</span> {item.employee?.nama_lengkap || '-'}</p>
                <p className="text-sm"><span className="font-medium">Ruangan:</span> {item.room?.nama || '-'}{item.room?.building ? ` — ${item.room.building.nama}` : ''}</p>
                <p className="text-sm"><span className="font-medium">Tgl Masuk:</span> {item.tanggal_masuk ? new Date(item.tanggal_masuk).toLocaleDateString('id-ID') : '-'}</p>
            </div>
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Tanggal Keluar <span className="text-red-500">*</span></label>
                <input type="date" {...register('tanggal_keluar', { required: true })} className={cls} />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Keterangan</label>
                <textarea {...register('keterangan')} className={cls} rows={2} placeholder="Alasan checkout (opsional)" />
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={isLoading}>Batal</Button>
                <Button type="submit" variant="danger" className="flex-1" isLoading={isLoading}>Checkout</Button>
            </div>
        </form>
    );
};

/* ---------- Main Page ---------- */
const OccupantPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Aktif');
    const [buildingFilter, setBuildingFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<FacOccupant | null>(null);

    const { data: buildingData } = useFacBuildingList({ limit: 100 });
    const buildings = (buildingData?.data || []) as any[];

    const { data, isLoading } = useOccupantList({
        page, limit: 10, search,
        status: statusFilter as any,
        building_id: buildingFilter ? Number(buildingFilter) : undefined,
    });
    const createMutation = useCreateOccupant();
    const checkoutMutation = useCheckoutOccupant();

    const columns: Column<FacOccupant>[] = [
        { header: 'No', accessor: (_, i) => (page - 1) * 10 + i + 1, className: 'w-12' },
        { header: 'Karyawan', accessor: (item) => item.employee?.nama_lengkap || '-' },
        { header: 'NIK', accessor: (item) => item.employee?.nomor_induk_karyawan || '-' },
        { header: 'Ruangan', accessor: (item) => item.room?.nama || '-' },
        { header: 'Gedung', accessor: (item) => item.room?.building?.nama || '-' },
        { header: 'Tgl Masuk', accessor: (item) => item.tanggal_masuk ? new Date(item.tanggal_masuk).toLocaleDateString('id-ID') : '-' },
        { header: 'Tgl Keluar', accessor: (item) => item.tanggal_keluar ? new Date(item.tanggal_keluar).toLocaleDateString('id-ID') : '-' },
        { header: 'Status', accessor: (item) => (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                item.status === 'Aktif'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
                {item.status}
            </span>
        )},
        { header: 'Aksi', accessor: (item) => item.status === 'Aktif' ? (
            <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleCheckout(item); }}>
                <span className="material-symbols-outlined text-sm mr-1">logout</span>Checkout
            </Button>
        ) : null, className: 'w-32' },
    ];

    const handleAdd = () => { setSelectedItem(null); setIsModalOpen(true); };
    const handleCheckout = (item: FacOccupant) => { setSelectedItem(item); setIsCheckoutOpen(true); };

    const onFormSubmit = (formData: OccupantPayload) => {
        createMutation.mutate(formData, {
            onSuccess: () => { setIsModalOpen(false); toast.success('Penghuni berhasil ditambahkan'); },
            onError: (err) => { toast.error(err.response?.data?.message || 'Gagal menambahkan penghuni'); },
        });
    };

    const onCheckoutSubmit = (formData: CheckoutFormData) => {
        if (!selectedItem) return;
        checkoutMutation.mutate({ id: selectedItem.id, data: formData }, {
            onSuccess: () => { setIsCheckoutOpen(false); setSelectedItem(null); toast.success('Penghuni berhasil di-checkout'); },
            onError: (err) => { toast.error(err.response?.data?.message || 'Gagal checkout penghuni'); },
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Penghuni</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola data penghuni ruangan</p>
                </div>
                <Button variant="primary" onClick={handleAdd}>
                    <span className="material-symbols-outlined text-sm mr-1">add</span> Tambah Penghuni
                </Button>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <input type="text" placeholder="Cari nama / NIK / ruangan..." value={search}
                    className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                <select className={selectCls} value={buildingFilter}
                    onChange={(e) => { setBuildingFilter(e.target.value); setPage(1); }}>
                    <option value="">Semua Gedung</option>
                    {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.nama}</option>)}
                </select>
                <select className={selectCls} value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="Aktif">Aktif</option>
                    <option value="Selesai">Selesai</option>
                </select>
            </div>

            <MasterDataTable columns={columns} data={data?.data || []} isLoading={isLoading}
                pagination={{ page: data?.pagination?.page || 1, totalPages: data?.pagination?.totalPages || 1, totalItems: data?.pagination?.total || 0, onPageChange: setPage }}
                onEdit={() => {}} onDelete={() => {}} transparent={true} />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Penghuni" size="lg">
                <OccupantForm onSubmit={onFormSubmit} isLoading={createMutation.isPending} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            <Modal isOpen={isCheckoutOpen} onClose={() => { setIsCheckoutOpen(false); setSelectedItem(null); }} title="Checkout Penghuni" size="lg">
                {selectedItem && (
                    <CheckoutForm item={selectedItem} onSubmit={onCheckoutSubmit}
                        isLoading={checkoutMutation.isPending} onCancel={() => { setIsCheckoutOpen(false); setSelectedItem(null); }} />
                )}
            </Modal>
        </div>
    );
};

export default OccupantPage;