import React from 'react';
import clsx from 'clsx';

interface LoadingSkeletonProps {
    variant?: 'card' | 'table' | 'chart';
    count?: number;
    className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ variant = 'card', count = 1, className }) => {
    const renderSkeleton = () => {
        if (variant === 'card') {
            return (
                <div className={clsx("animate-pulse bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 h-32", className)}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
                        <div className="h-10 w-10 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
                </div>
            );
        }

        if (variant === 'chart') {
            return (
                <div className={clsx("animate-pulse bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 h-[400px] flex flex-col justify-between", className)}>
                    <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
                    <div className="flex-1 flex items-end justify-between gap-4 px-4">
                        {[40, 70, 50, 90, 60, 80].map((h, i) => (
                            <div key={i} className="bg-gray-200 dark:bg-slate-700 rounded-t w-full" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                </div>
            );
        }

        // Table default
        return (
            <div className={clsx("animate-pulse space-y-4", className)}>
                {[...Array(count)].map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-lg bg-white dark:bg-slate-800">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-700"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
                            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            {count > 1 && variant === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(count)].map((_, i) => (
                        <React.Fragment key={i}>{renderSkeleton()}</React.Fragment>
                    ))}
                </div>
            ) : (
                renderSkeleton()
            )}
        </>
    );
};

export default LoadingSkeleton;
