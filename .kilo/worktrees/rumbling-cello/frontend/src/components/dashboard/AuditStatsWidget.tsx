import { useAuditStats } from '../../hooks/useAuditLogs';

export default function AuditStatsWidget() {
    const { stats, loading } = useAuditStats();

    if (loading || !stats) {
        return <div className="animate-pulse h-24 bg-gray-100 rounded-lg"></div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-medium">Total Aktivitas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_logs}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 font-medium mb-2">Aktivitas Terbanyak</p>
                <div className="space-y-1">
                    {stats.by_action.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                            <span className="capitalize text-gray-700">{item.action.toLowerCase()}</span>
                            <span className="font-semibold">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 font-medium mb-2">Top User</p>
                <div className="space-y-1">
                    {stats.top_users.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700 truncate w-32" title={item.user_name}>{item.user_name || 'System'}</span>
                            <span className="font-semibold">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
