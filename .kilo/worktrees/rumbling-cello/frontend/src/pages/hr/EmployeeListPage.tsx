import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api/client';
import Button from '../../components/common/Button';
import VirtualEmployeeTable from '../../components/hr/VirtualEmployeeTable';
import EmployeeGrid from '../../components/hr/EmployeeGrid';
import LayoutSwitcher from '../../components/layout/LayoutSwitcher';
import { LayoutView } from '../../types/layout';
import { toast } from 'react-hot-toast';
import { useMasterDataList } from '../../hooks/useMasterData';
import { AdvancedEmployeeFilter } from '../../components/hr/AdvancedEmployeeFilter';
import { FilterChipsContainer } from '../../components/common/FilterChipsContainer';
import { ExportButton } from '../../components/hr/ExportButton';
import { EmployeeFilterParams, Divisi, Department, PosisiJabatan, StatusKaryawan, LokasiKerja, Tag } from '../../types/hr';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { RESOURCES, ACTIONS } from '../../types/permission';
import { useDebounce } from '../../hooks/useDebounce';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { usePermission } from '../../hooks/usePermission';

const EmployeeListPage = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<import('../../types/hr').Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [hasNextPage, setHasNextPage] = useState(true);
    const [page, setPage] = useState(1);
    const [layout, setLayout] = useState<LayoutView>(() => {
        const saved = localStorage.getItem('employeeListLayout');
        return (saved as LayoutView) || LayoutView.VIEW_1; // VIEW_1 is List, VIEW_4 is Grid
    });

    // Advanced Filters State
    const [filters, setFilters] = useState<EmployeeFilterParams>({});
    const [showDrafts, setShowDrafts] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<import('../../types/hr').Employee | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { can } = usePermission();
    const canDelete = can(RESOURCES.EMPLOYEES, ACTIONS.DELETE);

    const debouncedSearch = useDebounce(search, 500);

    const handleFilterChange = (newFilters: EmployeeFilterParams) => {
        setFilters(newFilters);
        setPage(1);
        setEmployees([]);
        setHasNextPage(true);
    };

    // Master Data for Chips Label Lookup
    const { data: divisiList } = useMasterDataList('divisi');
    const { data: deptList } = useMasterDataList('department');
    const { data: posisiList } = useMasterDataList('posisi_jabatan');
    const { data: statusList } = useMasterDataList('status_karyawan');
    const { data: lokasiList } = useMasterDataList('lokasi_kerja');
    const { data: tagList } = useMasterDataList('tag');

    const fetchEmployees = useCallback(async (pageNum: number) => {
        setLoading(true);
        try {
            const params = {
                search: debouncedSearch,
                ...filters,
                is_draft: showDrafts ? true : undefined,
                page: pageNum,
                limit: 20 // Increase limit for virtual scrolling
            };
            const response = await api.get('/hr/employees', { params });
            const newEmployees = response.data.data;

            if (pageNum === 1) {
                setEmployees(newEmployees);
            } else {
                setEmployees(prev => [...prev, ...newEmployees]);
            }

            setHasNextPage(pageNum < response.data.totalPages);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            toast.error('Gagal memuat data karyawan');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, filters, showDrafts]);

    // Track if this is the initial load to set default status filter only once
    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        // Only set default Status to Aktif on initial load, not when user clears the filter
        if (statusList?.data && isInitialLoadRef.current) {
            const activeStatus = (statusList.data as import('../../types/hr').StatusKaryawan[]).find(s => s.nama === 'Aktif');
            if (activeStatus && !filters.status_karyawan_id) {
                setFilters(prev => ({ ...prev, status_karyawan_id: activeStatus.id }));
            }
            isInitialLoadRef.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusList]); // Intentionally only depend on statusList to prevent infinite loop

    useEffect(() => {
        setPage(1);
        setEmployees([]);
        setHasNextPage(true);
        fetchEmployees(1);
    }, [debouncedSearch, filters, fetchEmployees]); // Reset when filter changes

    const loadNextPage = async () => {
        if (!loading && hasNextPage) {
            const nextPage = page + 1;
            setPage(nextPage);
            await fetchEmployees(nextPage);
        }
    };

    const handleDeleteClick = (id: number) => {
        const employee = employees.find(e => e.id === id);
        if (employee) {
            setEmployeeToDelete(employee);
            setShowDeleteConfirm(true);
        }
    };

    const handleConfirmDelete = async () => {
        if (!employeeToDelete) return;

        setDeleting(true);
        try {
            console.log(`Attempting to delete employee ID: ${employeeToDelete.id}`);
            await api.delete(`/hr/employees/${employeeToDelete.id}`);
            console.log(`Successfully deleted employee ID: ${employeeToDelete.id}`);
            toast.success('Karyawan berhasil dihapus');
            setShowDeleteConfirm(false);
            setEmployeeToDelete(null);
            // Refresh list
            setPage(1);
            fetchEmployees(1);
        } catch (error: unknown) {
            console.error('Failed to delete employee:', error);
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message = axiosError.response?.data?.message || 'Gagal menghapus karyawan';
            toast.error(message);
        } finally {
            setDeleting(false);
        }
    };

    const handleResetFilters = () => {
        setFilters({});
        setPage(1);
        setEmployees([]);
        setHasNextPage(true);
        setSearch('');
    };

    const handleRemoveFilter = (key: string) => {
        const newFilters = { ...filters };
        delete newFilters[key as keyof EmployeeFilterParams];
        setFilters(newFilters);
    };

    // Prepare chips data
    const activeFiltersChips = useMemo(() => {
        const chips: Record<string, { label: string; value: string }> = {};
        if (filters.divisi_id) {
            const item = (divisiList?.data as Divisi[])?.find((d) => d.id === filters.divisi_id);
            chips.divisi_id = { label: 'Divisi', value: item?.nama || '...' };
        }
        if (filters.department_id) {
            const item = (deptList?.data as Department[])?.find((d) => d.id === filters.department_id);
            chips.department_id = { label: 'Department', value: item?.nama || '...' };
        }
        if (filters.posisi_jabatan_id) {
            const item = (posisiList?.data as PosisiJabatan[])?.find((d) => d.id === filters.posisi_jabatan_id);
            chips.posisi_jabatan_id = { label: 'Posisi', value: item?.nama || '...' };
        }
        if (filters.status_karyawan_id) {
            const item = (statusList?.data as StatusKaryawan[])?.find((d) => d.id === filters.status_karyawan_id);
            chips.status_karyawan_id = { label: 'Status', value: item?.nama || '...' };
        }
        if (filters.lokasi_kerja_id) {
            const item = (lokasiList?.data as LokasiKerja[])?.find((d) => d.id === filters.lokasi_kerja_id);
            chips.lokasi_kerja_id = { label: 'Lokasi', value: item?.nama || '...' };
        }
        if (filters.tag_id) {
            const item = (tagList?.data as Tag[])?.find((d) => d.id === filters.tag_id);
            chips.tag_id = { label: 'Tag', value: item?.nama || '...' };
        }
        return chips;
    }, [filters, divisiList, deptList, posisiList, statusList, lokasiList, tagList]);

    return (
        <div className="space-y-6 p-6 h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manajemen Karyawan</h1>
                    <p className="text-gray-500 dark:text-gray-400">Kelola data karyawan, filter, dan export.</p>
                </div>
                <div className="flex gap-2">
                    <PermissionGuard resource={RESOURCES.EXPORT} action={ACTIONS.EXPORT}>
                        <ExportButton filters={{ ...filters, search: debouncedSearch }} />
                    </PermissionGuard>

                    <PermissionGuard resource={RESOURCES.IMPORT} action={ACTIONS.IMPORT}>
                        <Button onClick={() => navigate('/hr/import')} variant="secondary" className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">upload_file</span>
                            Import Excel
                        </Button>
                    </PermissionGuard>

                    <PermissionGuard resource={RESOURCES.EMPLOYEES} action={ACTIONS.CREATE}>
                        <Button onClick={() => navigate('/hr/employees/create')} className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Tambah Karyawan
                        </Button>
                    </PermissionGuard>

                    {/* Draft Toggle */}
                    <Button
                        variant={showDrafts ? 'primary' : 'outline'}
                        onClick={() => {
                            setShowDrafts(!showDrafts);
                            setPage(1);
                            setEmployees([]);
                            setHasNextPage(true);
                        }}
                        className={`flex items-center gap-2 ${showDrafts ? 'bg-amber-500 hover:bg-amber-600 border-amber-500' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">draft</span>
                        {showDrafts ? 'Showing Drafts' : 'View Drafts'}
                    </Button>

                    <div className="h-10 w-px bg-gray-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                    <LayoutSwitcher
                        currentLayout={layout}
                        onLayoutChange={(newLayout) => {
                            setLayout(newLayout);
                            localStorage.setItem('employeeListLayout', newLayout);
                        }}
                    />
                </div>
            </div>

            {/* Search & Filter Section */}
            <div className="space-y-4 flex-shrink-0">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cari Karyawan</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-gray-400">search</span>
                            </span>
                            <input
                                type="text"
                                placeholder="Cari nama atau NIK..."
                                className="pl-10 block w-full rounded-lg border-gray-300 bg-gray-50 dark:bg-slate-900 dark:border-slate-700 focus:border-primary focus:ring-primary sm:text-sm p-2.5"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <AdvancedEmployeeFilter
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onReset={handleResetFilters}
                    />
                </div>

                <FilterChipsContainer
                    filters={activeFiltersChips}
                    onRemoveFilter={handleRemoveFilter}
                    onClearAll={handleResetFilters}
                />
            </div>

            {/* Data Representative */}
            <div className="flex-grow overflow-hidden">
                {layout === LayoutView.VIEW_4 ? (
                    <EmployeeGrid
                        employees={employees}
                        hasNextPage={hasNextPage}
                        isNextPageLoading={loading}
                        loadNextPage={loadNextPage}
                        onRowClick={(employee) => navigate(`/hr/employees/${employee.id}`)}
                        onDelete={canDelete ? handleDeleteClick : undefined}
                    />
                ) : (
                    <VirtualEmployeeTable
                        employees={employees}
                        hasNextPage={hasNextPage}
                        isNextPageLoading={loading}
                        loadNextPage={loadNextPage}
                        onRowClick={(employee) => {
                            // Drafts go to edit page, regular employees go to detail page
                            if (employee.is_draft) {
                                navigate(`/hr/employees/${employee.id}/edit`);
                            } else {
                                navigate(`/hr/employees/${employee.id}`);
                            }
                        }}
                        onDelete={canDelete ? handleDeleteClick : undefined}
                        showDraftBadge={showDrafts}
                    />
                )}
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Hapus Karyawan"
                message={`Apakah Anda yakin ingin menghapus data karyawan ${employeeToDelete?.nama_lengkap}? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Ya, Hapus"
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setEmployeeToDelete(null);
                }}
                isLoading={deleting}
                itemPreview={employeeToDelete ? {
                    "NIK": employeeToDelete.nomor_induk_karyawan,
                    "Nama": employeeToDelete.nama_lengkap,
                    "Jabatan": employeeToDelete.posisi_jabatan?.nama || '-'
                } : null}
            />
        </div>
    );
};

export default EmployeeListPage;
