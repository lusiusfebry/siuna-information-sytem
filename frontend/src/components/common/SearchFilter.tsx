import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Button from './Button';

interface SearchFilterProps {
    searchPlaceholder?: string;
    onSearchChange: (value: string) => void;
    onFilterChange: (value: string) => void;
    onAdd?: () => void;
    addButtonText?: string;
    filterOptions?: { label: string; value: string }[];
    transparent?: boolean;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
    searchPlaceholder = "Cari data...",
    onSearchChange,
    onFilterChange,
    onAdd,
    addButtonText = "Tambah",
    transparent = false,
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

    return (
        <div className={`flex flex-col md:flex-row gap-4 mb-4 justify-between items-center ${transparent
            ? 'bg-transparent p-0 border-0 shadow-none'
            : 'bg-white p-4 rounded-xl border border-gray-100 shadow-sm'
            }`}>
            <div className="flex flex-1 w-full gap-4">
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
                <div className="relative min-w-[160px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FunnelIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm appearance-none bg-white"
                        onChange={(e) => onFilterChange(e.target.value)}
                        defaultValue=""
                    >
                        {filterOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            {onAdd && (
                <Button onClick={onAdd} className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" />
                    {addButtonText}
                </Button>
            )}
        </div>
    );
};

export default SearchFilter;
