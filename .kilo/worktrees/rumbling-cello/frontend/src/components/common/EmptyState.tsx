import React from 'react';
import clsx from 'clsx';
import Button from './Button'; // Assuming Button component exists

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'inbox',
    title,
    description,
    actionLabel,
    onAction,
    className
}) => {
    return (
        <div className={clsx("flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700", className)}>
            <div className="h-16 w-16 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-3xl">
                    {icon}
                </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {title}
            </h3>
            {description && (
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6">
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="primary">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
