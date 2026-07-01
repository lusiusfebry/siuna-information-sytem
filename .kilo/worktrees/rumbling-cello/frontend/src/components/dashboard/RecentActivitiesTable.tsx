import React from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Button from '../common/Button';
import { Link } from 'react-router-dom';

interface Activity {
    id: number;
    user_name: string;
    action: string;
    entity_type: string;
    entity_name: string;
    timestamp: string;
    nama_lengkap?: string; // Fallback
    department_name?: string; // Fallback or extra info
    status?: string; // Fallback
}

interface RecentActivitiesTableProps {
    activities: Activity[];
}

const RecentActivitiesTable: React.FC<RecentActivitiesTableProps> = ({ activities }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Aktivitas Terbaru</h3>
                <Link to="/hr/audit-logs">
                    <Button variant="ghost" size="sm" className="text-primary">Lihat Semua</Button>
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Aksi</th>
                            <th className="px-6 py-3">Data</th>
                            <th className="px-6 py-3">Waktu</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {activities.map((activity, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden text-xs font-bold text-gray-500">
                                        {(activity.user_name || activity.nama_lengkap || 'S').charAt(0)}
                                    </div>
                                    {activity.user_name || activity.nama_lengkap}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${activity.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                                            activity.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                                                activity.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                                                    activity.status ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {activity.action || activity.status || 'VIEW'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900 dark:text-white">{activity.entity_name || activity.nama_lengkap}</span>
                                        <span className="text-xs capitalize">{activity.entity_type?.replace(/_/g, ' ') || activity.department_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                    {format(new Date(activity.timestamp || (activity as { createdAt?: string }).createdAt || new Date()), 'dd MMM yyyy, HH:mm', { locale: id })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentActivitiesTable;
