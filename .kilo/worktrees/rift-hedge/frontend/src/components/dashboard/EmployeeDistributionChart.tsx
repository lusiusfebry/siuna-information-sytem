import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DistributionData {
    department_name: string;
    divisi_name?: string;
    employee_count: number;
}

interface EmployeeDistributionChartProps {
    data: DistributionData[];
}

const EmployeeDistributionChart: React.FC<EmployeeDistributionChartProps> = ({ data }) => {
    // Transform data if needed, ensure numbers
    const chartData = data.map(d => ({
        ...d,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        count: parseInt(d.employee_count as any) // Sequelize might return string for count
    }));

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm h-[400px]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Distribusi Karyawan per Departemen</h3>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                    <XAxis type="number" />
                    <YAxis dataKey="department_name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    />
                    <Legend />
                    <Bar dataKey="count" name="Jumlah Karyawan" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default EmployeeDistributionChart;
