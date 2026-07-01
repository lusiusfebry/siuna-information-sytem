import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    autoTitleCase?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, autoTitleCase, onChange, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (autoTitleCase) {
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;

                // Title Case transformation - preserving all-caps words
                const words = e.target.value.split(' ');
                const transformed = words.map(word => {
                    // If word is all uppercase (like PT, IT, HR), preserve it
                    if (word === word.toUpperCase() && word.length > 0) {
                        return word;
                    }
                    // Otherwise, capitalize first letter and lowercase the rest
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                }).join(' ');

                e.target.value = transformed;

                // Restore cursor position
                if (start !== null && end !== null) {
                    setTimeout(() => {
                        e.target.setSelectionRange(start, end);
                    }, 0);
                }
            }
            if (onChange) {
                onChange(e);
            }
        };

        return (
            <div className="flex flex-col gap-1.5">
                {label && <label htmlFor={props.id} className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>}
                <input
                    ref={ref}
                    onChange={handleChange}
                    className={twMerge(
                        clsx(
                            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100',
                            error && 'border-red-500 focus:ring-red-500',
                            className
                        )
                    )}
                    {...props}
                />
                {error && <span className="text-sm text-red-500">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
export default Input;
