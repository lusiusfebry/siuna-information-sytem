import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
    useWorkOrderList,
    useCreateWorkOrder,
    useUpdateWorkOrder,
} from '../../hooks/useFacilityWorkOrder';
import { useFacRoomList, useFacMaintenanceCategoryList } from '../../hooks/useFacilityMasterData';
import { useEmployeeList } from '../../hooks/useEmployee';
import MasterDataTable, { Column } from '../../components/hr/MasterDataTable';
import LayoutSwitcher from '../../components/layout/LayoutSwitcher';
import MasterDataLayout from '../../components/layout/MasterDataLayout';
import Modal from '../../components/common/Modal';
import SearchFilter from '../../components/common/SearchFilter';
import Button from '../../components/common/Button';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { usePermission } from '../../hooks/usePermission';
import { RESOURCES, ACTIONS } from '../../types/permission';
import {
    FacWorkOrder,
    WorkOrderPayload,
    WorkOrderFilterParams,
    WorkOrderPrioritas,
    WorkOrderStatus,
} from '../../types/facility';
import { LayoutView } from '../../types/layout';

// === Constants ===

const PRIORITAS_OPTIONS: { label: string; value: WorkOrderPrioritas }[] = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Critical', value: 'Critical' },
];

const STATUS_OPTIONS: { label: string; value: WorkOrderStatus }[] = [
    { label: 'Open', value: 'Open' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Resolved', value: 'Resolved' },
    { label: 'Closed', value: 'Closed' },
];

const STATUS_FILTER_OPTIONS = [
    { label: 'Semua Status', value: '' },
    { label: 'Open', value: 'Open' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Resolved', value: 'Resolved' },
    { label: 'Closed', value: 'Closed' },
];
// === Badge Helpers ===

const getPriorityBadge = (prioritas: WorkOrderPrioritas) => {
    const map: Record<WorkOrderPrioritas, string> = {
        Low: 'bg-gray-100 text-gray-700 ring-gray-300',
        Medium: 'bg-blue-50 text-blue-700 ring-blue-300',
        High: 'bg-orange-50 text-orange-700 ring-orange-300',
        Critical: 'bg-red-50 text-red-700 ring-red-300',
    };
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${map[prioritas]}`}>
            {prioritas}
        </span>
    );
};

const getStatusBadge = (status: WorkOrderStatus) => {
    const map: Record<WorkOrderStatus, string> = {
        Open: 'bg-yellow-50 text-yellow-700 ring-yellow-300',
        'In Progress': 'bg-blue-50 text-blue-700 ring-blue-300',
        Resolved: 'bg-green-50 text-green-700 ring-green-300',
        Closed: 'bg-gray-100 text-gray-700 ring-gray-300',
    };
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${map[status]}`}>
            {status}
        </span>
    );
};

const todayStr = () => new Date().toISOString().split('T')[0];

// === Form Data Interface ===

interface WorkOrderFormData {
    judul: string;
    deskripsi: string;
    room_id: string;
    kategori_id: string;
    prioritas: WorkOrderPrioritas;
    status: WorkOrderStatus;
    assigned_to: string;
    tanggal_lapor: string;
    estimasi_biaya: string;
    tanggal_selesai: string;
    realisasi_biaya: string;
    catatan_penyelesaian: string;
}

// === WorkOrderForm Component ===

const WorkOrderForm = ({
    initialValues,
    onSubmit,
    onCancel,
    isLoading,
}: {
    initialValues?: FacWorkOrder | null;
    onSubmit: (data: WorkOrderPayload) => void;
    onCancel: () => void;
    isLoading?: boolean;
}) => {
    const isEditMode = !!(initialValues && Object.keys(initialValues).length > 0);

    const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<WorkOrderFormData>({
        defaultValues: {
            judul: '',
            deskripsi: '',
            room_id: '',
            kategori_id: '',
            prioritas: 'Medium',
            status: 'Open',
            assigned_to: '',
            tanggal_lapor: todayStr(),
            estimasi_biaya: '',
            tanggal_selesai: '',
            realisasi_biaya: '',
            catatan_penyelesaian: '',
        },
    });

    const { data: roomData } = useFacRoomList({ limit: 100, status: 'Tersedia' });
    const { data: categoryData } = useFacMaintenanceCategoryList({ limit: 100, status: 'Aktif' });
    const { data: empData } = useEmployeeList();
    const roomList: any[] = roomData?.data || [];
    const categoryList: any[] = categoryData?.data || [];
    const employees: any[] = empData?.data || [];

    useEffect(() => {
        if (initialValues && Object.keys(initialValues).length > 0) {
            reset({
                judul: initialValues.judul || '',
                deskripsi: initialValues.deskripsi || '',
                room_id: initialValues.room_id ? String(initialValues.room_id) : '',
                kategori_id: initialValues.kategori_id ? String(initialValues.kategori_id) : '',
                prioritas: initialValues.prioritas || 'Medium',
                status: initialValues.status || 'Open',
                assigned_to: initialValues.assigned_to ? String(initialValues.assigned_to) : '',
                tanggal_lapor: initialValues.tanggal_lapor ? initialValues.tanggal_lapor.split('T')[0] : todayStr(),
                estimasi_biaya: initialValues.estimasi_biaya != null ? String(initialValues.estimasi_biaya) : '',
                tanggal_selesai: initialValues.tanggal_selesai ? initialValues.tanggal_selesai.split('T')[0] : '',
                realisasi_biaya: initialValues.realisasi_biaya != null ? String(initialValues.realisasi_biaya) : '',
                catatan_penyelesaian: initialValues.catatan_penyelesaian || '',
            });
        } else {
            reset({
                judul: '', deskripsi: '', room_id: '', kategori_id: '',
                prioritas: 'Medium', status: 'Open', assigned_to: '',
                tanggal_lapor: todayStr(), estimasi_biaya: '',
                tanggal_selesai: '', realisasi_biaya: '', catatan_penyelesaian: '',
            });
        }
    }, [initialValues, reset]);
    const onFormSubmit = (data: WorkOrderFormData) => {
        const payload: WorkOrderPayload = {
            judul: data.judul,
            deskripsi: data.deskripsi || null,
            room_id: Number(data.room_id),
            kategori_id: data.kategori_id ? Number(data.kategori_id) : null,
            prioritas: data.prioritas,
            status: data.status,
            assigned_to: data.assigned_to ? Number(data.assigned_to) : null,
            tanggal_lapor: data.tanggal_lapor || todayStr(),
            estimasi_biaya: data.estimasi_biaya ? Number(data.estimasi_biaya) : null,
        };
        if (isEditMode) {
            payload.tanggal_selesai = data.tanggal_selesai || null;
            payload.realisasi_biaya = data.realisasi_biaya ? Number(data.realisasi_biaya) : null;
            payload.catatan_penyelesaian = data.catatan_penyelesaian || null;
        }
        onSubmit(payload);
    };

    const cls = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors text-sm border-gray-300';
    const lbl = 'text-sm font-medium text-gray-700 dark:text-gray-300';
    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Judul <span className="text-red-500">*</span></label>
                <input
                    {...register('judul', { required: 'Judul harus diisi' })}
                    className={`${cls} ${errors.judul ? 'border-red-500' : ''}`}
                    placeholder="Judul work order"
                />
                {errors.judul && <span className="text-xs text-red-500">{errors.judul.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Deskripsi</label>
                <textarea {...register('deskripsi')} className={cls} placeholder="Deskripsi permasalahan" rows={3} />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Ruangan <span className="text-red-500">*</span></label>
                <Controller
                    control={control}
                    name="room_id"
                    rules={{ required: 'Ruangan harus dipilih' }}
                    render={({ field: { value } }) => (
                        <SearchableSelect
                            options={roomList.map((r: any) => ({ label: `${r.nama}${r.building ? ` - ${r.building.nama}` : ''}`, value: r.id }))}
                            value={value || null}
                            onChange={(val) => setValue('room_id', val ? String(val) : '')}
                            placeholder="Pilih Ruangan"
                            error={errors.room_id?.message}
                        />
                    )}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Kategori</label>
                <Controller
                    control={control}
                    name="kategori_id"
                    render={({ field: { value } }) => (
                        <SearchableSelect
                            options={categoryList.map((c: any) => ({ label: c.nama, value: c.id }))}
                            value={value || null}
                            onChange={(val) => setValue('kategori_id', val ? String(val) : '')}
                            placeholder="Pilih Kategori"
                        />
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className={lbl}>Prioritas</label>
                    <select {...register('prioritas')} className={cls}>
                        {PRIORITAS_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className={lbl}>Status</label>
                    <select {...register('status')} className={cls}>
                        {STATUS_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Assigned To</label>
                <Controller
                    control={control}
                    name="assigned_to"
                    render={({ field: { value } }) => (
                        <SearchableSelect
                            options={employees.map((e: any) => ({ label: e.nama_lengkap, value: e.id }))}
                            value={value || null}
                            onChange={(val) => setValue('assigned_to', val ? String(val) : '')}
                            placeholder="Pilih Karyawan"
                        />
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className={lbl}>Tanggal Lapor</label>
                    <input type="date" {...register('tanggal_lapor')} className={cls} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className={lbl}>Estimasi Biaya</label>
                    <input type="number" {...register('estimasi_biaya')} className={cls} placeholder="0" min={0} />
                </div>
            </div>
            {isEditMode && (
                <>
                    <div className="border-t border-gray-200 pt-4 mt-2">
                        <p className="text-sm font-semibold text-gray-600 mb-3">Penyelesaian</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className={lbl}>Tanggal Selesai</label>
                            <input type="date" {...register('tanggal_selesai')} className={cls} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className={lbl}>Realisasi Biaya</label>
                            <input type="number" {...register('realisasi_biaya')} className={cls} placeholder="0" min={0} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className={lbl}>Catatan Penyelesaian</label>
                        <textarea {...register('catatan_penyelesaian')} className={cls} placeholder="Catatan penyelesaian work order" rows={3} />
                    </div>
                </>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={isLoading}>Batal</Button>
                <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>Simpan</Button>
            </div>
        </form>
    );
};

// === Main Page Component ===

const WorkOrderPage = () => {
    const { can } = usePermission();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<FacWorkOrder | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    const [layout, setLayout] = useState<LayoutView>(() => {
        const saved = localStorage.getItem('masterDataLayout');
        return (saved as LayoutView) || LayoutView.VIEW_1;
    });

    const filters: WorkOrderFilterParams = {
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter,
    };

    const { data, isLoading } = useWorkOrderList(filters);
    const createMutation = useCreateWorkOrder();
    const updateMutation = useUpdateWorkOrder();

    const columns: Column<FacWorkOrder>[] = [
        {
            header: 'No',
            accessor: (_: FacWorkOrder, index: number) => (page - 1) * 10 + index + 1,
            className: 'w-16',
        },
        { header: 'Code', accessor: 'code' },
        { header: 'Judul', accessor: 'judul' },
        {
            header: 'Ruangan',
            accessor: (item: FacWorkOrder) => item.room?.nama || '-',
        },
        {
            header: 'Prioritas',
            accessor: (item: FacWorkOrder) => getPriorityBadge(item.prioritas),
        },
        {
            header: 'Status',
            accessor: (item: FacWorkOrder) => getStatusBadge(item.status),
        },
        {
            header: 'Assigned To',
            accessor: (item: FacWorkOrder) => item.assignee?.nama_lengkap || '-',
        },
        {
            header: 'Tanggal Lapor',
            accessor: (item: FacWorkOrder) =>
                item.tanggal_lapor
                    ? new Date(item.tanggal_lapor).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                      })
                    : '-',
        },
    ];

    const handleAdd = () => {
        setModalMode('create');
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: FacWorkOrder) => {
        setModalMode('edit');
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleFilterChange = (value: string) => {
        setStatusFilter(value ? (value as WorkOrderStatus) : undefined);
        setPage(1);
    };

    const onFormSubmit = (payload: WorkOrderPayload) => {
        if (modalMode === 'create') {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success('Work order berhasil dibuat');
                },
                onError: (err) => {
                    toast.error(err.response?.data?.message || 'Gagal membuat work order');
                },
            });
        } else {
            if (!selectedItem) return;
            updateMutation.mutate(
                { id: selectedItem.id, data: payload },
                {
                    onSuccess: () => {
                        setIsModalOpen(false);
                        toast.success('Work order berhasil diperbarui');
                    },
                    onError: (err) => {
                        toast.error(err.response?.data?.message || 'Gagal memperbarui work order');
                    },
                }
            );
        }
    };

    // No-op for onDelete since work orders don't support delete
    const handleDeleteNoop = () => {};

    return (
        <MasterDataLayout view={layout}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Work Order</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola work order fasilitas</p>
                    </div>
                </div>

                <SearchFilter
                    onSearchChange={setSearch}
                    onFilterChange={handleFilterChange}
                    onAdd={can(RESOURCES.FACILITY_WORK_ORDER, ACTIONS.CREATE) ? handleAdd : undefined}
                    addButtonText="Tambah Work Order"
                    filterOptions={STATUS_FILTER_OPTIONS}
                    transparent={true}
                />

                <div className="mb-4 flex justify-end">
                    <LayoutSwitcher currentLayout={layout} onLayoutChange={setLayout} />
                </div>

                <MasterDataTable permissionResource="facility_work_order"
                    view={layout}
                    columns={columns}
                    data={data?.data || []}
                    isLoading={isLoading}
                    pagination={{
                        page: data?.pagination?.page || 1,
                        totalPages: data?.pagination?.totalPages || 1,
                        totalItems: data?.pagination?.total || 0,
                        onPageChange: setPage,
                    }}
                    onEdit={handleEdit}
                    onDelete={handleDeleteNoop}
                    transparent={true}
                />

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={modalMode === 'create' ? 'Tambah Work Order' : 'Edit Work Order'}
                    size="lg"
                >
                    <WorkOrderForm
                        initialValues={selectedItem}
                        onSubmit={onFormSubmit}
                        isLoading={createMutation.isPending || updateMutation.isPending}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal>
            </div>
        </MasterDataLayout>
    );
};

export default WorkOrderPage;