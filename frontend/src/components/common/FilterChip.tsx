
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface FilterChipProps {
    label: string;
    onRemove: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, onRemove }) => {
    return (
        <span className="inline-flex items-center gap-x-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            {label}
            <button
                type="button"
                className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-blue-600/20"
                onClick={onRemove}
            >
                <span className="sr-only">Remove filter</span>
                <XMarkIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
        </span>
    );
};
