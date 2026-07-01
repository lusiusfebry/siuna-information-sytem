
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useDepartmentList, useDivisiList, useCreateMasterData, useUpdateMasterData, useDeleteMasterData } from '../../../hooks/useMasterData';
import { useEmployeeList } from '../../../hooks/useEmployee';
import MasterDataTable, { Column } from '../../../components/hr/MasterDataTable';
import MasterDataForm from '../../../components/hr/MasterDataForm';
import LayoutSwitcher from '../../../components/layout/LayoutSwitcher';
import MasterDataLayout from '../../../components/layout/MasterDataLayout';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import SearchFilter from '../../../components/common/SearchFilter';
import { Department } from '../../../types/hr';
import { LayoutView } from '../../../types/layout';

const DepartmentPage: React.FC = () => {
    // State
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('Aktif');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Department | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    // Layout State
    const [layout, setLayout] = useState<LayoutView>(() => {
        const saved = localStorage.getItem('masterDataLayout');
        return (saved as LayoutView) || LayoutView.VIEW_1;
    });

    // API Hooks
    const { data, isLoading } = useDepartmentList({ page, limit: 10, search, status });
    // Fetch generic options for dropdowns
    const { data: divisiData } = useDivisiList({ limit: 100, status: 'true' });
    const { data: employeeData } = useEmployeeList();

    const createMutation = useCreateMasterData<Department>('department');
    const updateMutation = useUpdateMasterData<Department>('department');
    const deleteMutation = useDeleteMasterData('department');

    // Columns
    const columns: Column<Department>[] = [
        { header: 'No', accessor: (_, index) => (page - 1) * 10 + index + 1, className: 'w-16' },
        { header: 'Code', accessor: 'code' },
        { header: 'Nama Department', accessor: 'nama' },
        {
            header: 'Manager',
            accessor: (item: Department) => item.manager?.nama_lengkap || '-'
        },
        {
            header: 'Divisi',
            accessor: (item: Department) => item.divisi?.nama || '-'
        },
        { header: 'Status', accessor: 'status' },
    ];

    // Form Fields
    const formFields = [
        { name: 'nama', label: 'Nama Department', type: 'text' as const, required: true, autoTitleCase: true },
        {
            name: 'divisi_id',
            label: 'Divisi',
            type: 'select' as const,
            required: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options: divisiData?.data.map((d: any) => ({ label: d.nama, value: d.id })) || []
        },
        {
            name: 'manager_id',
            label: 'Manager',
            type: 'select' as const,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options: employeeData?.data.map((e: any) => ({ label: e.nama_lengkap, value: e.id })) || []
        },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea' as const, autoTitleCase: true },
        { name: 'status', label: 'Status', type: 'toggle' as const },
    ];

    // Handlers
    const handleAdd = () => {
        setModalMode('create');
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: Department) => {
        setModalMode('edit');
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (item: Department) => {
        setSelectedItem(item);
        setIsConfirmOpen(true);
    };

    const onFormSubmit = (formData: Record<string, unknown>) => {
        // Convert IDs to number if select returns string
        const payload = {
            ...formData,
            divisi_id: Number(formData.divisi_id),
            manager_id: formData.manager_id ? Number(formData.manager_id) : null,
        };

        if (modalMode === 'create') {
            createMutation.mutate(payload, {
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
            updateMutation.mutate({ id: selectedItem.id, data: payload }, {
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Department</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage company departments</p>
                    </div>
                </div>

                <SearchFilter
                    onSearchChange={setSearch}
                    onFilterChange={setStatus}
                    onAdd={handleAdd}
                    addButtonText="Tambah Department"
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

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={modalMode === 'create' ? 'Tambah Department' : 'Edit Department'}
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
                    title="Hapus Department"
                    message={`Apakah Anda yakin ingin menghapus department ${selectedItem?.nama}?`}
                    onConfirm={onConfirmDelete}
                    onCancel={() => setIsConfirmOpen(false)}
                    isLoading={deleteMutation.isPending}
                />
            </div>
        </MasterDataLayout>
    );
};

export default DepartmentPage;
