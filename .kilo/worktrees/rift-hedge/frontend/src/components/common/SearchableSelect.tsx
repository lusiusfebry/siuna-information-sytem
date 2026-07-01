import React, { useState, useEffect, useRef } from 'react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Option {
    value: string | number;
    label: string;
}

interface SearchableSelectProps {
    label?: string;
    options: Option[];
    value?: string | number | null;
    onChange: (value: string | number) => void;
    error?: string;
    placeholder?: string;
    className?: string;
    required?: boolean;
    disabled?: boolean;
    loading?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    label,
    options,
    value,
    onChange,
    error,
    placeholder = 'Pilih...',
    className = '',
    required,
    disabled,
    loading
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Find selected label
    const selectedOption = options.find(opt => opt.value === value);

    // Filter options
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset search when opening
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const isDisabled = disabled || loading;

    return (
        <div className={twMerge("w-full relative", className)} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div
                className={clsx(
                    "relative w-full cursor-default rounded-md border bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm",
                    error ? "border-red-500" : "border-gray-300",
                    isDisabled ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"
                )}
                onClick={() => !isDisabled && setIsOpen(!isOpen)}
            >
                <span className={clsx("block truncate", !selectedOption && "text-gray-400")}>
                    {loading ? 'Memuat...' : (selectedOption ? selectedOption.label : placeholder)}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    )}
                </span>
            </div>

            {isOpen && !isDisabled && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    <div className="sticky top-0 z-10 bg-white px-2 py-1.5 border-b border-gray-100">
                        <input
                            type="text"
                            className="w-full rounded-md border-gray-300 py-1 px-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                            placeholder="Cari..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>

                    {filteredOptions.length === 0 ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700 italic">
                            Tidak ada hasil.
                        </div>
                    ) : (
                        filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                className={clsx(
                                    "relative cursor-default select-none py-2 pl-3 pr-9 hover:bg-primary-50 hover:text-primary-900",
                                    option.value === value ? "bg-primary-50 text-primary-900 font-semibold" : "text-gray-900"
                                )}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                            >
                                <span className="block truncate">{option.label}</span>
                                {option.value === value && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-600">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};
