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
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Find selected label. Compare with String() coercion so a numeric option
    // value (e.g. 1) still matches a string form value (e.g. "1") — react-hook-form
    // stores ids as strings while option values are often numbers.
    const isSelected = (optValue: string | number) =>
        value !== null && value !== undefined && value !== '' && String(optValue) === String(value);
    const selectedOption = options.find(opt => isSelected(opt.value));

    // Filter options
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isDisabled = disabled || loading;

    const open = (initialSearch = '') => {
        if (isDisabled) return;
        setSearchTerm(initialSearch);
        setIsOpen(true);
    };

    const close = (returnFocus = true) => {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(0);
        if (returnFocus) triggerRef.current?.focus();
    };

    const selectOption = (opt: Option) => {
        onChange(opt.value);
        close();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus the search box and reset highlight when opening
    useEffect(() => {
        if (isOpen) {
            setHighlightedIndex(0);
            // Focus after the popup has rendered
            const id = setTimeout(() => inputRef.current?.focus(), 0);
            return () => clearTimeout(id);
        }
    }, [isOpen]);

    // Keep the highlighted option in view
    useEffect(() => {
        if (isOpen) {
            optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex, isOpen]);

    // Keyboard handling on the (focusable) trigger — opens the dropdown
    const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (isDisabled) return;
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            open();
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // Start typing to open + filter
            e.preventDefault();
            open(e.key);
        }
    };

    // Keyboard handling inside the search box — navigate & select
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(i => Math.min(i + 1, filteredOptions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                // Prevent the form from submitting; commit the highlighted option instead
                e.preventDefault();
                e.stopPropagation();
                if (filteredOptions[highlightedIndex]) {
                    selectOption(filteredOptions[highlightedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                e.stopPropagation();
                close();
                break;
            case 'Tab':
                // Move on without selecting — close and keep focus on the field trigger
                e.preventDefault();
                close();
                break;
        }
    };

    return (
        <div className={twMerge("w-full relative", className)} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div
                ref={triggerRef}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                tabIndex={isDisabled ? -1 : 0}
                className={clsx(
                    "relative w-full cursor-default rounded-md border bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm",
                    error ? "border-red-500" : "border-gray-300",
                    isDisabled ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"
                )}
                onClick={() => !isDisabled && (isOpen ? close(false) : open())}
                onKeyDown={handleTriggerKeyDown}
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
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" role="listbox">
                    <div className="sticky top-0 z-10 bg-white px-2 py-1.5 border-b border-gray-100">
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full rounded-md border-gray-300 py-1 px-2 text-sm focus:border-primary focus:ring-primary"
                            placeholder="Cari..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setHighlightedIndex(0); }}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={handleSearchKeyDown}
                        />
                    </div>

                    {filteredOptions.length === 0 ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700 italic">
                            Tidak ada hasil.
                        </div>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <div
                                key={option.value}
                                ref={(el) => { optionRefs.current[index] = el; }}
                                role="option"
                                aria-selected={isSelected(option.value)}
                                className={clsx(
                                    "relative cursor-default select-none py-2 pl-3 pr-9",
                                    index === highlightedIndex ? "bg-primary/10 text-primary-900" : "text-gray-900",
                                    isSelected(option.value) && "font-semibold"
                                )}
                                onClick={() => selectOption(option)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            >
                                <span className="block truncate">{option.label}</span>
                                {isSelected(option.value) && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary">
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
