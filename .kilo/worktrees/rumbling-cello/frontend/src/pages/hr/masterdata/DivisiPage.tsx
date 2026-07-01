
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useDivisiList, useCreateMasterData, useUpdateMasterData, useDeleteMasterData } from '../../../hooks/useMasterData';
import MasterDataTable, { Column } from '../../../components/hr/MasterDataTable';
import MasterDataForm from '../../../components/hr/MasterDataForm';
import LayoutSwitcher from '../../../components/layout/LayoutSwitcher';
import MasterDataLayout from '../../../components/layout/MasterDataLayout';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import SearchFilter from '../../../components/common/SearchFilter';
import { Divisi } from '../../../types/hr';
import { LayoutView } from '../../../types/layout';

// Plan mentions "Toast notifications".
// I'll check package.json for toast lib. If not, I'll use a simple alert or console for now or add it.
// Checking package.json earlier -> NO toast lib.
// But "Integrasi dengan react-hook-form... Toast notifications".
// I'll assume I should install `react - hot - toast` or similar. I'll add the import but comment it out if not available, OR better: use a simple custom toast or just window.alert for now to strict to plan without extra installs if not critical. 
// Actually, I'll install `react - hot - toast` as it's standard.
// For now, I'll use console.log/alert to avoid build breakage if I don't install it yet.
// Re-reading user plan: "Toast notifications untuk success/error messages".
// I will use `alert` temporarily or check if context has toast.
// I will install `react - hot - toast` in background.

const DivisiPage = () => {
    // State
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('Aktif');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Divisi | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    // Layout State with persistence init
    const [layout, setLayout] = useState<LayoutView>(() => {
        const saved = localStorage.getItem('masterDataLayout');
        return (saved as LayoutView) || LayoutView.VIEW_1;
    });

    // Hooks
    const { data, isLoading } = useDivisiList({ page, limit: 10, search, status });
    const createMutation = useCreateMasterData('divisi');
    const updateMutation = useUpdateMasterData('divisi');
    const deleteMutation = useDeleteMasterData('divisi');

    const isDeleting = deleteMutation.isPending;

    // Columns
    const columns: Column<Divisi>[] = [
        { header: 'No', accessor: (_, index) => (page - 1) * 10 + index + 1, className: 'w-16' },
        { header: 'Code', accessor: 'code' },
        { header: 'Nama Divisi', accessor: 'nama' },
        { header: 'Keterangan', accessor: 'keterangan' },
        {
            header: 'Jumlah Dept.',
            accessor: (item: Divisi) => item.departments?.length || 0
        },
        { header: 'Status', accessor: 'status' }, // handled by Table Status badge
    ];

    // Form Fields
    const formFields = [
        { name: 'nama', label: 'Nama Divisi', type: 'text' as const, required: true, placeholder: 'Contoh: IT, HR, Finance', autoTitleCase: true },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea' as const, placeholder: 'Deskripsi singkat divisi', autoTitleCase: true },
        { name: 'status', label: 'Status', type: 'toggle' as const },
    ];

    // Handlers
    const handleAdd = () => {
        setModalMode('create');
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: Divisi) => {
        setModalMode('edit');
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (item: Divisi) => {
        setSelectedItem(item);
        setIsConfirmOpen(true);
    };

    const onFormSubmit = (formData: Record<string, unknown>) => {
        if (modalMode === 'create') {
            createMutation.mutate(formData as unknown as Partial<Divisi>, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success('Data berhasil disimpan');
                },
                onError: (err: AxiosError<{ message: string }>) => {
                    const message = err.response?.data?.message || 'Gagal menyimpan data';
                    toast.error(message);
                    console.error(err);
                }
            });
        } else {
            if (!selectedItem) return;
            updateMutation.mutate({ id: selectedItem.id, data: formData }, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success('Data berhasil diperbarui');
                },
                onError: (err: AxiosError<{ message: string }>) => {
                    const message = err.response?.data?.message || 'Gagal memperbarui data';
                    toast.error(message);
                    console.error(err);
                }
            });
        }
    };

    const onConfirmDelete = () => {
        if (!selectedItem) return;
        deleteMutation.mutate(selectedItem.id, {
            onSuccess: () => {
                setIsConfirmOpen(false);
                toast.success('Data berhasil dihapus');
            },
            onError: (err: AxiosError<{ message: string }>) => {
                const message = err.response?.data?.message || 'Gagal menghapus data';
                toast.error(message);
                console.error(err);
            }
        });
    };

    return (
        <MasterDataLayout view={layout}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Divisi</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage company divisions</p>
                    </div>
                </div>

                <SearchFilter
                    onSearchChange={setSearch}
                    onFilterChange={setStatus}
                    onAdd={handleAdd}
                    addButtonText="Tambah Divisi"
                    transparent={true}
                />

                <div className="mb-4 flex justify-end">
                    <LayoutSwitcher currentLayout={layout} onLayoutChange={setLayout} />
                </div>

                <MasterDataTable
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
                    onDelete={handleDelete}
                    transparent={true}
                />

                {/* Modals ... */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={modalMode === 'create' ? 'Tambah Divisi' : 'Edit Divisi'}
                >
                    <MasterDataForm
                        fields={formFields}
                        initialValues={(selectedItem || {}) as Record<string, unknown>}
                        onSubmit={onFormSubmit}
                        isLoading={createMutation.isPending || updateMutation.isPending}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal>

                <ConfirmDialog
                    isOpen={isConfirmOpen}
                    title="Hapus Divisi"
                    message={`Apakah Anda yakin ingin menghapus divisi ${selectedItem?.nama}?`}
                    onConfirm={onConfirmDelete}
                    onCancel={() => setIsConfirmOpen(false)}
                    isLoading={isDeleting}
                />
            </div>
        </MasterDataLayout>
    );
};

export default DivisiPage;
