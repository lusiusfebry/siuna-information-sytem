import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Button from './Button';

export interface ExtraFilter {
    /** placeholder / first "all" option label, e.g. "Semua Divisi" */
    placeholder: string;
    /** controlled value ('' = all) */
    value: string;
    options: { label: string; value: string | number }[];
    onChange: (value: string) => void;
}

interface SearchFilterProps {
    searchPlaceholder?: string;
    onSearchChange: (value: string) => void;
    onFilterChange: (value: string) => void;
    onAdd?: () => void;
    addButtonText?: string;
    filterOptions?: { label: string; value: string }[];
    transparent?: boolean;
    /** controlled status value; when provided the status dropdown is controlled */
    statusValue?: string;
    /** additional relational dropdown filters (e.g. by divisi, by department) */
    extraFilters?: ExtraFilter[];
}

const SearchFilter: React.FC<SearchFilterProps> = ({
    searchPlaceholder = "Cari data...",
    onSearchChange,
    onFilterChange,
    onAdd,
    addButtonText = "Tambah",
    transparent = false,
    statusValue,
    extraFilters = [],
    filterOptions = [
        { label: 'Semua Status', value: '' },
        { label: 'Aktif', value: 'true' },
        { label: 'Tidak Aktif', value: 'false' }
    ]
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onSearchChange(searchTerm);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, onSearchChange]);

    const selectClass = "block w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm appearance-none bg-white";

    return (
        <div className={`flex flex-col md:flex-row gap-4 mb-4 justify-between items-center ${transparent
            ? 'bg-transparent p-0 border-0 shadow-none'
            : 'bg-white p-4 rounded-xl border border-gray-100 shadow-sm'
            }`}>
            <div className="flex flex-1 w-full flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Relational filters (by divisi, by department, etc.) */}
                {extraFilters.map((ef, i) => (
                    <div key={i} className="relative min-w-[180px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FunnelIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                            className={selectClass}
                            value={ef.value}
                            onChange={(e) => ef.onChange(e.target.value)}
                        >
                            <option value="">{ef.placeholder}</option>
                            {ef.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                ))}

                {/* Status filter (controlled when statusValue is provided) */}
                <div className="relative min-w-[160px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FunnelIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                        className={selectClass}
                        onChange={(e) => onFilterChange(e.target.value)}
                        {...(statusValue !== undefined ? { value: statusValue } : { defaultValue: '' })}
                    >
                        {filterOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            {onAdd && (
                <Button onClick={onAdd} className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 whitespace-nowrap">
                    <PlusIcon className="w-5 h-5" />
                    {addButtonText}
                </Button>
            )}
        </div>
    );
};

export default SearchFilter;
