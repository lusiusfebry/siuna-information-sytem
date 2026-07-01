import { useNavigate } from 'react-router-dom';
import { useDashboardStats, useEmployeeDistribution, useRecentActivities, useEmploymentStatus } from '../../hooks/useDashboard';
import StatCard from '../../components/dashboard/StatCard';
import EmployeeDistributionChart from '../../components/dashboard/EmployeeDistributionChart';
import RecentActivitiesTable from '../../components/dashboard/RecentActivitiesTable';
import EmploymentStatusChart from '../../components/dashboard/EmploymentStatusChart';
import QuickAccessWidget from '../../components/dashboard/QuickAccessWidget';
import Button from '../../components/common/Button';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ExportButton from '../../components/dashboard/ExportButton';
import { toast } from 'react-hot-toast';

const DashboardPage = () => {
    const navigate = useNavigate();

    // Fetch Data
    const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
    const { data: distribution, isLoading: distLoading } = useEmployeeDistribution();
    const { data: activities, isLoading: activitiesLoading } = useRecentActivities();
    const { data: empStatus, isLoading: statusLoading } = useEmploymentStatus();

    if (statsError) {
        toast.error('Gagal memuat data dashboard');
    }

    return (
        <div className="p-8 space-y-8 bg-gray-50 dark:bg-slate-900 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <nav className="flex text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <span>Beranda</span>
                        <span className="mx-2">&gt;</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">Ringkasan Eksekutif HR</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ringkasan Eksekutif HR</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gambaran umum performa SDM dan aktivitas terbaru.</p>
                </div>
                <div className="flex gap-3">
                    <ExportButton />
                    <Button
                        variant="primary"
                        onClick={() => navigate('/hr/employees/create')}
                        className="flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Tambah Karyawan
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {statsLoading ? (
                <LoadingSkeleton variant="card" count={4} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Karyawan"
                        value={stats?.totalEmployees || 0}
                        icon="groups"
                        trend="+2.4%"
                        trendValue={2.4}
                        subtitle="vs bulan lalu"
                        iconBgColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    />
                    <StatCard
                        title="Departemen"
                        value={stats?.totalDepartments || 0}
                        icon="apartment"
                        subtitle="Total unit kerja"
                        iconBgColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                    />
                    <StatCard
                        title="Izin/Cuti Hari Ini"
                        value={stats?.employeesOnLeave || 0}
                        icon="person_pin"
                        trend="-4.1%"
                        trendValue={-4.1}
                        subtitle="vs minggu lalu"
                        iconBgColor="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                    />
                    <StatCard
                        title="Tingkat Kehadiran"
                        value={`${stats?.attendanceRate || 0}%`}
                        icon="how_to_reg"
                        subtitle="Rata-rata minggu ini"
                        iconBgColor="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    />
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    {distLoading ? (
                        <LoadingSkeleton variant="chart" />
                    ) : (
                        <EmployeeDistributionChart data={distribution || []} />
                    )}

                    {activitiesLoading ? (
                        <LoadingSkeleton variant="table" count={5} />
                    ) : (
                        <RecentActivitiesTable activities={activities || []} />
                    )}
                </div>

                {/* Right Column (1/3) */}
                <div className="space-y-8">
                    {statusLoading ? (
                        <LoadingSkeleton variant="card" className="h-[350px]" />
                    ) : (
                        <EmploymentStatusChart
                            tetap_count={empStatus?.tetap_count || 0}
                            kontrak_count={empStatus?.kontrak_count || 0}
                            tetap_percentage={empStatus?.tetap_percentage || 0}
                        />
                    )}

                    <QuickAccessWidget />

                    {/* Security Info Card */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800 flex items-start gap-4">
                        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-3xl">verified_user</span>
                        <div>
                            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">Keamanan Sistem</h3>
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                                Sistem terproteksi dengan enkripsi end-to-end. Terakhir dibackup: Hari ini, 02:00 WIB.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
