import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useInvGudangList, useCreateInventoryMasterData, useUpdateInventoryMasterData, useDeleteInventoryMasterData } from '../../../hooks/useInventoryMasterData';
import { useEmployeeList } from '../../../hooks/useEmployee';
import { useLokasiKerjaList } from '../../../hooks/useMasterData';
import MasterDataTable, { Column } from '../../../components/hr/MasterDataTable';
import MasterDataForm from '../../../components/hr/MasterDataForm';
import LayoutSwitcher from '../../../components/layout/LayoutSwitcher';
import MasterDataLayout from '../../../components/layout/MasterDataLayout';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import SearchFilter from '../../../components/common/SearchFilter';
import { InvGudang } from '../../../types/inventory';
import { LayoutView } from '../../../types/layout';

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
    const { data: employeeData } = useEmployeeList();
    const { data: lokasiKerjaData } = useLokasiKerjaList({ limit: 100, status: 'Aktif' });
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

    const formFields = [
        { name: 'nama', label: 'Nama Gudang', type: 'text' as const, required: true, placeholder: 'Contoh: Gudang Utama, Gudang Site A', autoTitleCase: true },
        {
            name: 'penanggung_jawab_id',
            label: 'Penanggung Jawab',
            type: 'select' as const,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options: employeeData?.data.map((e: any) => ({ label: e.nama_lengkap, value: e.id })) || []
        },
        {
            name: 'lokasi_kerja_id',
            label: 'Lokasi Kerja',
            type: 'select' as const,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options: lokasiKerjaData?.data.map((l: any) => ({ label: l.nama, value: l.id })) || []
        },
        { name: 'lokasi', label: 'Lokasi', type: 'textarea' as const },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea' as const, autoTitleCase: true },
        { name: 'status', label: 'Status', type: 'toggle' as const },
    ];

    const handleAdd = () => { setModalMode('create'); setSelectedItem(null); setIsModalOpen(true); };
    const handleEdit = (item: InvGudang) => { setModalMode('edit'); setSelectedItem(item); setIsModalOpen(true); };
    const handleDelete = (item: InvGudang) => { setSelectedItem(item); setIsConfirmOpen(true); };

    const onFormSubmit = (formData: Record<string, unknown>) => {
        const payload = {
            ...formData,
            penanggung_jawab_id: formData.penanggung_jawab_id ? Number(formData.penanggung_jawab_id) : null,
            lokasi_kerja_id: formData.lokasi_kerja_id ? Number(formData.lokasi_kerja_id) : null,
        };
        if (modalMode === 'create') {
            createMutation.mutate(payload, {
                onSuccess: () => { setIsModalOpen(false); toast.success('Data berhasil disimpan'); },
                onError: (err: AxiosError<{ message: string }>) => { toast.error(err.response?.data?.message || 'Gagal menyimpan data'); }
            });
        } else {
            if (!selectedItem) return;
            updateMutation.mutate({ id: selectedItem.id, data: payload }, {
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

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Tambah Gudang' : 'Edit Gudang'}>
                    <MasterDataForm fields={formFields} initialValues={(selectedItem || {}) as Record<string, unknown>}
                        onSubmit={onFormSubmit} isLoading={createMutation.isPending || updateMutation.isPending} onCancel={() => setIsModalOpen(false)} />
                </Modal>

                <ConfirmDialog isOpen={isConfirmOpen} title="Hapus Gudang"
                    message={`Apakah Anda yakin ingin menghapus gudang ${selectedItem?.nama}?`}
                    onConfirm={onConfirmDelete} onCancel={() => setIsConfirmOpen(false)} isLoading={deleteMutation.isPending} />
            </div>
        </MasterDataLayout>
    );
};

export default GudangPage;
