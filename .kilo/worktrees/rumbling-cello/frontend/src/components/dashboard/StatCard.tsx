import React from 'react';
import clsx from 'clsx';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    trend?: string;
    trendValue?: number;
    subtitle?: string;
    iconBgColor?: string;
    className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    trend,
    trendValue,
    subtitle,
    iconBgColor = 'bg-primary/10 text-primary',
    className
}) => {
    const isPositiveTrend = trendValue && trendValue > 0;

    return (
        <div className={clsx("bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm", className)}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</h3>
                </div>
                <div className={clsx("p-3 rounded-lg flex items-center justify-center", iconBgColor)}>
                    <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
            </div>

            {(trend || subtitle) && (
                <div className="flex items-center gap-2 text-sm">
                    {trend && (
                        <span className={clsx(
                            "flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                            isPositiveTrend
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                            <span className="material-symbols-outlined text-[14px] mr-1">
                                {isPositiveTrend ? 'trending_up' : 'trending_down'}
                            </span>
                            {trend}
                        </span>
                    )}
                    {subtitle && (
                        <span className="text-gray-500 dark:text-gray-400">{subtitle}</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default StatCard;
