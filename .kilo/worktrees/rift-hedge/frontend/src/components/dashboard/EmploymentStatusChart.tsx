import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EmploymentStatusProps {
    tetap_count: number;
    kontrak_count: number;
    tetap_percentage: number;
}

const COLORS = ['#3b82f6', '#94a3b8', '#10b981', '#f59e0b'];

const EmploymentStatusChart: React.FC<EmploymentStatusProps> = ({ tetap_count, kontrak_count, tetap_percentage }) => {
    const data = [
        { name: 'Tetap', value: tetap_count },
        { name: 'Kontrak', value: kontrak_count },
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm h-[350px]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Status Kepegawaian</h3>
            <div className="relative h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{tetap_percentage}%</span>
                    <p className="text-xs text-gray-500">Karyawan Tetap</p>
                </div>
            </div>
        </div>
    );
};

export default EmploymentStatusChart;
