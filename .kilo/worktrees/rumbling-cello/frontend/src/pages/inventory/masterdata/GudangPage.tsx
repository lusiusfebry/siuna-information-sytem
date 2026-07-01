import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useInvGudangList, useCreateInventoryMasterData, useUpdateInventoryMasterData, useDeleteInventoryMasterData } from '../../../hooks/useInventoryMasterData';
import { useEmployeesByDepartment } from '../../../hooks/useEmployee';
import { useDepartmentList, useLokasiKerjaList } from '../../../hooks/useMasterData';
import MasterDataTable, { Column } from '../../../components/hr/MasterDataTable';
import LayoutSwitcher from '../../../components/layout/LayoutSwitcher';
import MasterDataLayout from '../../../components/layout/MasterDataLayout';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import SearchFilter from '../../../components/common/SearchFilter';
import Button from '../../../components/common/Button';
import { InvGudang } from '../../../types/inventory';
import { LayoutView } from '../../../types/layout';

interface GudangFormData {
    nama: string;
    department_id: string;
    penanggung_jawab_id: string;
    lokasi_kerja_id: string;
    lokasi: string;
    keterangan: string;
    status: boolean;
}

const GudangForm = ({
    initialValues,
    onSubmit,
    onCancel,
    isLoading,
}: {
    initialValues?: InvGudang | null;
    onSubmit: (data: Record<string, unknown>) => void;
    onCancel: () => void;
    isLoading?: boolean;
}) => {
    const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm<GudangFormData>({
        defaultValues: {
            nama: '',
            department_id: '',
            penanggung_jawab_id: '',
            lokasi_kerja_id: '',
            lokasi: '',
            keterangan: '',
            status: true,
        },
    });

    const watchDeptId = watch('department_id');
    const watchPjId = watch('penanggung_jawab_id');

    const deptIdNum = watchDeptId ? parseInt(watchDeptId, 10) : undefined;
    const { data: deptData } = useDepartmentList({ limit: 100, status: 'Aktif' });
    const { data: empData } = useEmployeesByDepartment(deptIdNum);
    const { data: lokasiData } = useLokasiKerjaList({ limit: 100, status: 'Aktif' });

    const departments = deptData?.data || [];
    const employees: any[] = empData?.data || [];
    const lokasiList = lokasiData?.data || [];

    const userChangedDept = useRef(false);

    useEffect(() => {
        userChangedDept.current = false;
        if (initialValues && Object.keys(initialValues).length > 0) {
            reset({
                nama: initialValues.nama || '',
                department_id: initialValues.department_id ? String(initialValues.department_id) : '',
                penanggung_jawab_id: initialValues.penanggung_jawab_id ? String(initialValues.penanggung_jawab_id) : '',
                lokasi_kerja_id: initialValues.lokasi_kerja_id ? String(initialValues.lokasi_kerja_id) : '',
                lokasi: initialValues.lokasi || '',
                keterangan: initialValues.keterangan || '',
                status: initialValues.status === 'Aktif' || initialValues.status === undefined,
            });
        } else {
            reset({ nama: '', department_id: '', penanggung_jawab_id: '', lokasi_kerja_id: '', lokasi: '', keterangan: '', status: true });
        }
    }, [initialValues, reset]);

    // Re-apply department value once departments finish loading (edit mode)
    useEffect(() => {
        if (initialValues?.department_id && departments.length > 0) {
            const deptId = String(initialValues.department_id);
            const exists = departments.some((d: any) => String(d.id) === deptId);
            if (exists) {
                setValue('department_id', deptId);
            }
        }
    }, [departments, initialValues, setValue]);

    // Re-apply PJ value once employees finish loading (edit mode)
    useEffect(() => {
        if (initialValues?.penanggung_jawab_id && employees.length > 0 && !userChangedDept.current) {
            const pjId = String(initialValues.penanggung_jawab_id);
            const exists = employees.some((e: any) => String(e.id) === pjId);
            if (exists) {
                setValue('penanggung_jawab_id', pjId);
            }
        }
    }, [employees, initialValues, setValue]);

    // Auto-fill lokasi_kerja when PJ is selected
    useEffect(() => {
        if (watchPjId && employees.length > 0) {
            const emp = employees.find((e: any) => String(e.id) === watchPjId);
            if (emp?.lokasi_kerja?.id) {
                setValue('lokasi_kerja_id', String(emp.lokasi_kerja.id));
            }
        }
    }, [watchPjId, employees, setValue]);

    const deptRegister = register('department_id');

    const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        deptRegister.onChange(e);
        userChangedDept.current = true;
        setValue('penanggung_jawab_id', '');
        setValue('lokasi_kerja_id', '');
    };

    const onFormSubmit = (data: GudangFormData) => {
        onSubmit({
            nama: data.nama,
            department_id: data.department_id ? Number(data.department_id) : null,
            penanggung_jawab_id: data.penanggung_jawab_id ? Number(data.penanggung_jawab_id) : null,
            lokasi_kerja_id: data.lokasi_kerja_id ? Number(data.lokasi_kerja_id) : null,
            lokasi: data.lokasi || null,
            keterangan: data.keterangan || null,
            status: data.status,
        });
    };

    const selectClass = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors text-sm border-gray-300`;
    const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
            <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Nama Gudang <span className="text-red-500">*</span></label>
                <input
                    {...register('nama', { required: 'Nama Gudang harus diisi' })}
                    className={`${selectClass} ${errors.nama ? 'border-red-500' : ''}`}
                    placeholder="Contoh: Gudang Utama, Gudang Site A"
                />
                {errors.nama && <span className="text-xs text-red-500">{errors.nama.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Department</label>
                <select {...deptRegister} onChange={handleDeptChange} className={selectClass}>
                    <option value="">Pilih Department</option>
                    {departments.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.nama}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Penanggung Jawab</label>
                <select {...register('penanggung_jawab_id')} className={selectClass} disabled={!watchDeptId}>
                    <option value="">{watchDeptId ? 'Pilih Penanggung Jawab' : 'Pilih Department terlebih dahulu'}</option>
                    {employees.map((e: any) => (
                        <option key={e.id} value={e.id}>{e.nama_lengkap}</option>
                    ))}
                </select>
                {!watchDeptId && <span className="text-xs text-gray-400">Pilih department untuk menampilkan daftar karyawan</span>}
            </div>

            <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Lokasi Kerja</label>
                <select {...register('lokasi_kerja_id')} className={selectClass}>
                    <option value="">Pilih Lokasi Kerja</option>
                    {lokasiList.map((l: any) => (
                        <option key={l.id} value={l.id}>{l.nama}</option>
                    ))}
                </select>
                {watchPjId && <span className="text-xs text-gray-400">Otomatis terisi berdasarkan lokasi karyawan</span>}
            </div>

            <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Lokasi</label>
                <textarea {...register('lokasi')} className={selectClass} placeholder="Detail lokasi gudang" rows={2} />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Keterangan</label>
                <textarea {...register('keterangan')} className={selectClass} rows={2} />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Status</label>
                <Controller
                    control={control}
                    name="status"
                    render={({ field: { onChange, value } }) => (
                        <div className="flex items-center">
                            <button
                                type="button"
                                className={`${value ? 'bg-primary' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                                onClick={() => onChange(!value)}
                            >
                                <span className={`${value ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                            </button>
                            <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{value ? 'Aktif' : 'Tidak Aktif'}</span>
                        </div>
                    )}
                />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={isLoading}>Batal</Button>
                <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>Simpan</Button>
            </div>
        </form>
    );
};

const GudangPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('Aktif');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InvGudang | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    const [layout, setLayout] = useState<LayoutView>(() => {
        const saved = localStorage.getItem('masterDataLayout');
        return (saved as LayoutView) || LayoutView.VIEW_1;
    });

    const { data, isLoading } = useInvGudangList({ page, limit: 10, search, status });
    const createMutation = useCreateInventoryMasterData<InvGudang>('gudang');
    const updateMutation = useUpdateInventoryMasterData<InvGudang>('gudang');
    const deleteMutation = useDeleteInventoryMasterData('gudang');

    const columns: Column<InvGudang>[] = [
        { header: 'No', accessor: (_, index) => (page - 1) * 10 + index + 1, className: 'w-16' },
        { header: 'Code', accessor: 'code' },
        { header: 'Nama Gudang', accessor: 'nama' },
        { header: 'Penanggung Jawab', accessor: (item: InvGudang) => item.penanggung_jawab?.nama_lengkap || '-' },
        { header: 'Department', accessor: (item: InvGudang) => item.department?.nama || '-' },
        { header: 'Lokasi Kerja', accessor: (item: InvGudang) => item.lokasi_kerja?.nama || '-' },
        { header: 'Lokasi', accessor: (item: InvGudang) => item.lokasi || '-' },
        { header: 'Status', accessor: 'status' },
    ];

    const handleAdd = () => { setModalMode('create'); setSelectedItem(null); setIsModalOpen(true); };
    const handleEdit = (item: InvGudang) => { setModalMode('edit'); setSelectedItem(item); setIsModalOpen(true); };
    const handleDelete = (item: InvGudang) => { setSelectedItem(item); setIsConfirmOpen(true); };

    const onFormSubmit = (formData: Record<string, unknown>) => {
        if (modalMode === 'create') {
            createMutation.mutate(formData, {
                onSuccess: () => { setIsModalOpen(false); toast.success('Data berhasil disimpan'); },
                onError: (err: AxiosError<{ message: string }>) => { toast.error(err.response?.data?.message || 'Gagal menyimpan data'); }
            });
        } else {
            if (!selectedItem) return;
            updateMutation.mutate({ id: selectedItem.id, data: formData }, {
                onSuccess: () => { setIsModalOpen(false); toast.success('Data berhasil diperbarui'); },
                onError: (err: AxiosError<{ message: string }>) => { toast.error(err.response?.data?.message || 'Gagal memperbarui data'); }
            });
        }
    };

    const onConfirmDelete = () => {
        if (!selectedItem) return;
        deleteMutation.mutate(selectedItem.id, {
            onSuccess: () => { setIsConfirmOpen(false); toast.success('Data berhasil dihapus'); },
            onError: (err: AxiosError<{ message: string }>) => { toast.error(err.response?.data?.message || 'Gagal menghapus data'); }
        });
    };

    return (
        <MasterDataLayout view={layout}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gudang</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola gudang dan lokasi penyimpanan</p>
                    </div>
                </div>

                <SearchFilter onSearchChange={setSearch} onFilterChange={setStatus} onAdd={handleAdd} addButtonText="Tambah Gudang" transparent={true} />

                <div className="mb-4 flex justify-end">
                    <LayoutSwitcher currentLayout={layout} onLayoutChange={setLayout} />
                </div>

                <MasterDataTable view={layout} columns={columns} data={data?.data || []} isLoading={isLoading}
                    pagination={{ page: data?.pagination?.page || 1, totalPages: data?.pagination?.totalPages || 1, totalItems: data?.pagination?.total || 0, onPageChange: setPage }}
                    onEdit={handleEdit} onDelete={handleDelete} transparent={true} />

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Tambah Gudang' : 'Edit Gudang'} size="lg">
                    <GudangForm
                        initialValues={selectedItem}
                        onSubmit={onFormSubmit}
                        isLoading={createMutation.isPending || updateMutation.isPending}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal>

                <ConfirmDialog isOpen={isConfirmOpen} title="Hapus Gudang"
                    message={`Apakah Anda yakin ingin menghapus gudang ${selectedItem?.nama}?`}
                    onConfirm={onConfirmDelete} onCancel={() => setIsConfirmOpen(false)} isLoading={deleteMutation.isPending} />
            </div>
        </MasterDataLayout>
    );
};

export default GudangPage;
