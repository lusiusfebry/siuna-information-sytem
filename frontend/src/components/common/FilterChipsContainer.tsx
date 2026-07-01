
import React from 'react';
import { FilterChip } from './FilterChip';

interface FilterChipsContainerProps {
    filters: Record<string, { label: string; value: string }>;
    onRemoveFilter: (key: string) => void;
    onClearAll: () => void;
}

export const FilterChipsContainer: React.FC<FilterChipsContainerProps> = ({
    filters,
    onRemoveFilter,
    onClearAll
}) => {
    const hasFilters = Object.keys(filters).length > 0;

    if (!hasFilters) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mt-4 px-4 sm:px-6 lg:px-8">
            <span className="text-sm text-gray-500 mr-2">Filter Aktif:</span>
            {Object.entries(filters).map(([key, config]) => (
                <FilterChip
                    key={key}
                    label={`${config.label}: ${config.value}`}
                    onRemove={() => onRemoveFilter(key)}
                />
            ))}
            <button
                onClick={onClearAll}
                className="text-sm text-red-600 hover:text-red-800 font-medium ml-2 hover:underline"
            >
                Clear All
            </button>
        </div>
    );
};
