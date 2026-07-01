import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import WelcomePage from './pages/WelcomePage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PermissionGuard } from './components/auth/PermissionGuard';
import { RESOURCES, ACTIONS } from './types/permission';
import PermissionDeniedPage from './pages/error/PermissionDeniedPage';
import { Suspense, lazy } from 'react';
import LoadingSpinner from './components/common/LoadingSpinner';

const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const EmployeeListPage = lazy(() => import('./pages/hr/EmployeeListPage'));
const EmployeeImportPage = lazy(() => import('./pages/hr/EmployeeImportPage'));
const EmployeeCreatePage = lazy(() => import('./pages/hr/EmployeeCreatePage'));
const EmployeeEditPage = lazy(() => import('./pages/hr/EmployeeEditPage'));
const EmployeeDetailPage = lazy(() => import('./pages/hr/EmployeeDetailPage'));

// Settings Pages
const RoleManagementPage = lazy(() => import('./pages/admin/RoleManagementPage'));
const RoleFormPage = lazy(() => import('./pages/admin/RoleFormPage'));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'));

// Master Data Pages
const DivisiPage = lazy(() => import('./pages/hr/masterdata/DivisiPage'));
const DepartmentPage = lazy(() => import('./pages/hr/masterdata/DepartmentPage'));
const PosisiJabatanPage = lazy(() => import('./pages/hr/masterdata/PosisiJabatanPage'));
const KategoriPangkatPage = lazy(() => import('./pages/hr/masterdata/KategoriPangkatPage'));
const GolonganPage = lazy(() => import('./pages/hr/masterdata/GolonganPage'));
const SubGolonganPage = lazy(() => import('./pages/hr/masterdata/SubGolonganPage'));
const JenisHubunganKerjaPage = lazy(() => import('./pages/hr/masterdata/JenisHubunganKerjaPage'));
const TagPage = lazy(() => import('./pages/hr/masterdata/TagPage'));
const LokasiKerjaPage = lazy(() => import('./pages/hr/masterdata/LokasiKerjaPage'));
const StatusKaryawanPage = lazy(() => import('./pages/hr/masterdata/StatusKaryawanPage'));
const AuditLogPage = lazy(() => import('./pages/hr/AuditLogPage'));

// Inventory Master Data Pages
const InvKategoriPage = lazy(() => import('./pages/inventory/masterdata/KategoriPage'));
const InvSubKategoriPage = lazy(() => import('./pages/inventory/masterdata/SubKategoriPage'));
const InvBrandPage = lazy(() => import('./pages/inventory/masterdata/BrandPage'));
const InvUomPage = lazy(() => import('./pages/inventory/masterdata/UomPage'));
const InvProdukPage = lazy(() => import('./pages/inventory/masterdata/ProdukPage'));
const InvGudangPage = lazy(() => import('./pages/inventory/masterdata/GudangPage'));

// Inventory Stock Pages
const StokPage = lazy(() => import('./pages/inventory/stok/StokPage'));
const TransaksiFormPage = lazy(() => import('./pages/inventory/stok/TransaksiFormPage'));
const TransaksiListPage = lazy(() => import('./pages/inventory/stok/TransaksiListPage'));
const KartuStokPage = lazy(() => import('./pages/inventory/stok/KartuStokPage'));

// Inventory Dashboard & Label Pages
const InventoryDashboardPage = lazy(() => import('./pages/inventory/DashboardPage'));
const LabelPage = lazy(() => import('./pages/inventory/stok/LabelPage'));
const InventoryImportPage = lazy(() => import('./pages/inventory/ImportPage'));

function App() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/403" element={<PermissionDeniedPage />} />

                {/* Protected Welcome Page (Standalone Layout) */}
                <Route
                    path="/welcome"
                    element={
                        <ProtectedRoute>
                            <WelcomePage />
                        </ProtectedRoute>
                    }
                />

                {/* Protected Module Routes (with MainLayout) */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <MainLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/welcome" replace />} />

                    <Route path="dashboard" element={
                        <PermissionGuard resource={RESOURCES.DASHBOARD} action={ACTIONS.READ} redirectTo="/403">
                            <DashboardPage />
                        </PermissionGuard>
                    } />

                    <Route path="hr">
                        <Route index element={<Navigate to="/dashboard" replace />} />

                        <Route path="employees" element={
                            <PermissionGuard resource={RESOURCES.EMPLOYEES} action={ACTIONS.READ} redirectTo="/403">
                                <EmployeeListPage />
                            </PermissionGuard>
                        } />

                        <Route path="import" element={
                            <PermissionGuard resource={RESOURCES.IMPORT} action={ACTIONS.IMPORT} redirectTo="/403">
                                <EmployeeImportPage />
                            </PermissionGuard>
                        } />

                        <Route path="employees/create" element={
                            <PermissionGuard resource={RESOURCES.EMPLOYEES} action={ACTIONS.CREATE} redirectTo="/403">
                                <EmployeeCreatePage />
                            </PermissionGuard>
                        } />

                        <Route path="employees/:id" element={
                            <PermissionGuard resource={RESOURCES.EMPLOYEES} action={ACTIONS.READ} redirectTo="/403">
                                <EmployeeDetailPage />
                            </PermissionGuard>
                        } />

                        <Route path="employees/:id/edit" element={
                            <PermissionGuard resource={RESOURCES.EMPLOYEES} action={ACTIONS.UPDATE} redirectTo="/403">
                                <EmployeeEditPage />
                            </PermissionGuard>
                        } />

                        {/* Master Data Routes */}
                        <Route path="master-data" element={
                            <PermissionGuard resource={RESOURCES.MASTER_DATA} action={ACTIONS.READ} redirectTo="/403">
                                {/* Represents layout for master data if any, direct children rendered below */}
                                {/* React Router outlet logic handled by parent or just grouping */}
                                <Navigate to="divisi" replace />
                            </PermissionGuard>
                        } />
                        {/* Note: In v6 nested routes render in Outlet. If Route has no element, it acts as wrapper.
                            Here I want to protect the whole block. 
                            However, defining element on parent requires Outlet. 
                            I'll wrap each child or use a wrapper component. 
                            Simple way: Wrap the block? No, Route element props.
                            I will wrap individual routes for now to be safe, or assume parent check is enough if I had a layout.
                            I'll just wrap the sub-routes since I don't have a shared MasterDataLayout file handy.
                        */}
                        <Route path="master-data/divisi" element={
                            <PermissionGuard resource={RESOURCES.MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><DivisiPage /></PermissionGuard>
                        } />
                        <Route path="master-data/department" element={
                            <PermissionGuard resource={RESOURCES.MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><DepartmentPage /></PermissionGuard>
                        } />
                        <Route path="master-data/posisi-jabatan" element={
                            <PermissionGuard resource={RESOURCES.MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><PosisiJabatanPage /></PermissionGuard>
                        } />
                        <Route path="master-data/kategori-pangkat" element={
                            <PermissionGuard resource={RESOURCES.MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><KategoriPangkatPage /></PermissionGuard>
                        } />
                        <Route path="master-data/golongan" element={
                            <PermissionGuard resource={RESOURCES.MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><GolonganPage /></PermissionGuard>
                        } />
                        <Route path="master-data/sub-golongan" element={
                            <PermissionGuard resource={RESOURCES.MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><SubGolonganPage /></PermissionGuard>
                        } />
                        <Route path="master-data/jenis-hubungan-kerja" element={
                            <PermissionGuard resource={RESOURCES.MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><JenisHubunganKerjaPage /></PermissionGuard>
                        } />
                        <Route path="master-data/tag" element={
                            <PermissionGuard resource={RESOURCES.MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><TagPage /></PermissionGuard>
                        } />
                        <Route path="master-data/lokasi-kerja" element={
                            <PermissionGuard resource={RESOURCES.MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><LokasiKerjaPage /></PermissionGuard>
                        } />
                        <Route path="master-data/status-karyawan" element={
                            <PermissionGuard resource={RESOURCES.MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><StatusKaryawanPage /></PermissionGuard>
                        } />

                        <Route path="audit-logs" element={
                            <PermissionGuard resource={RESOURCES.AUDIT_LOGS} action={ACTIONS.READ} redirectTo="/403">
                                <AuditLogPage />
                            </PermissionGuard>
                        } />
                    </Route>

                    {/* Inventory Routes */}
                    <Route path="inventory">
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={
                            <PermissionGuard resource={RESOURCES.INVENTORY_STOCK} action={ACTIONS.READ} redirectTo="/403"><InventoryDashboardPage /></PermissionGuard>
                        } />
                        <Route path="master-data/kategori" element={
                            <PermissionGuard resource={RESOURCES.INVENTORY_MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><InvKategoriPage /></PermissionGuard>
                        } />
                        <Route path="master-data/sub-kategori" element={
                            <PermissionGuard resource={RESOURCES.INVENTORY_MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><InvSubKategoriPage /></PermissionGuard>
                        } />
                        <Route path="master-data/brand" element={
                            <PermissionGuard resource={RESOURCES.INVENTORY_MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><InvBrandPage /></PermissionGuard>
                        } />
                        <Route path="master-data/uom" element={
                            <PermissionGuard resource={RESOURCES.INVENTORY_MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><InvUomPage /></PermissionGuard>
                        } />
                        <Route path="master-data/produk" element={
                            <PermissionGuard resource={RESOURCES.INVENTORY_MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><InvProdukPage /></PermissionGuard>
                        } />
                        <Route path="master-data/gudang" element={
                            <PermissionGuard resource={RESOURCES.INVENTORY_MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><InvGudangPage /></PermissionGuard>
                        } />

                        {/* Stock Management Routes */}
                        <Route path="stok" element={
                            <PermissionGuard resource={RESOURCES.INVENTORY_STOCK} action={ACTIONS.READ} redirectTo="/403"><StokPage /></PermissionGuard>
                        } />
                        <Route path="transaksi" element={
                            <PermissionGuard resource={RESOURCES.INVENTORY_STOCK} action={ACTIONS.READ} redirectTo="/403"><TransaksiListPage /></PermissionGuard>
                        } />
                        <Route path="transaksi/baru" element={
                            <PermissionGuard resource={RESOURCES.INVENTORY_STOCK} action={ACTIONS.CREATE} redirectTo="/403"><TransaksiFormPage /></PermissionGuard>
                        } />
                        <Route path="kartu-stok" element={
                            <PermissionGuard resource={RESOURCES.INVENTORY_STOCK} action={ACTIONS.READ} redirectTo="/403"><KartuStokPage /></PermissionGuard>
                        } />
                        <Route path="label" element={
                            <PermissionGuard resource={RESOURCES.INVENTORY_STOCK} action={ACTIONS.READ} redirectTo="/403"><LabelPage /></PermissionGuard>
                        } />
                        <Route path="import" element={
                            <PermissionGuard resource={RESOURCES.INVENTORY_STOCK} action={ACTIONS.CREATE} redirectTo="/403"><InventoryImportPage /></PermissionGuard>
                        } />
                    </Route>

                    {/* Settings Routes */}
                    <Route path="settings">
                        <Route index element={<Navigate to="users" replace />} />
                        <Route path="users" element={
                            <PermissionGuard resource={RESOURCES.USERS} action={ACTIONS.READ} redirectTo="/403">
                                <UserManagementPage />
                            </PermissionGuard>
                        } />
                        <Route path="roles" element={
                            <PermissionGuard resource={RESOURCES.ROLES} action={ACTIONS.READ} redirectTo="/403">
                                <RoleManagementPage />
                            </PermissionGuard>
                        } />
                        <Route path="roles/create" element={
                            <PermissionGuard resource={RESOURCES.ROLES} action={ACTIONS.CREATE} redirectTo="/403">
                                <RoleFormPage />
                            </PermissionGuard>
                        } />
                        <Route path="roles/:id" element={
                            <PermissionGuard resource={RESOURCES.ROLES} action={ACTIONS.UPDATE} redirectTo="/403">
                                <RoleFormPage />
                            </PermissionGuard>
                        } />
                    </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Suspense>
    );
}

export default App;
