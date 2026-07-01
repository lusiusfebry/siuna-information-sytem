import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Button from '../common/Button';
import Input from '../common/Input';
// Removed Switch import as we use custom implementation

// Plan assumed no headlessui install check, but I can use custom simple toggle or check styles.
// I'll implement a custom simple toggle to avoid dependency issues if headlessui is meant to be implicit or installed.
// Or effectively use a checkbox styled as toggle.
// I'll stick to simple Checkbox or custom HTML for toggle to be safe.

interface FieldConfig {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'toggle' | 'color' | 'number';
    required?: boolean;
    options?: { label: string; value: string | number }[];
    placeholder?: string;
    disabled?: boolean;
    autoTitleCase?: boolean;
}

interface MasterDataFormProps {
    fields: FieldConfig[];
    initialValues?: Record<string, unknown> | null;
    onSubmit: (data: Record<string, unknown>) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const MasterDataForm: React.FC<MasterDataFormProps> = ({
    fields,
    initialValues,
    onSubmit,
    onCancel,
    isLoading
}) => {
    const { register, control, handleSubmit, formState: { errors }, reset } = useForm({
        defaultValues: initialValues || { status: true } // Default active
    });

    useEffect(() => {
        if (initialValues && Object.keys(initialValues).length > 0) {
            // Transform status string 'Aktif'/'Tidak Aktif' back to boolean if needed, or handle in component
            const values = { ...initialValues };
            if (values.status === 'Aktif') values.status = true;
            if (values.status === 'Tidak Aktif') values.status = false;
            reset(values);
        } else {
            reset({ status: true });
        }
    }, [initialValues, reset]);

    const onFormSubmit = (data: Record<string, unknown>) => {
        // Transform boolean status to string if backend expects string enum 'Aktif'
        // But our backend handles 'true' mapped to 'Aktif'.
        // Wait, backend service `findAll` handling: if true -> 'Aktif'.
        // `create` endpoint validates using `validateMasterData`:
        // `status: z.union([z.boolean(), z.string().transform...])`
        // So sending boolean `true` is fine.
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
            {fields.map((field) => (
                <div key={field.name} className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.type === 'text' && (
                        <Input
                            {...register(field.name, { required: field.required ? `${field.label} harus diisi` : false })}
                            placeholder={field.placeholder}
                            disabled={field.disabled}
                            autoTitleCase={field.autoTitleCase}
                            error={errors[field.name]?.message as string}
                        />
                    )}

                    {field.type === 'textarea' && (
                        <textarea
                            {...register(field.name, { required: field.required ? `${field.label} harus diisi` : false })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors text-sm ${errors[field.name] ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder={field.placeholder}
                            rows={3}
                            disabled={field.disabled}
                            onChange={(e) => {
                                if (field.autoTitleCase) {
                                    const start = e.target.selectionStart;
                                    const end = e.target.selectionEnd;
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
                                    if (start !== null && end !== null) {
                                        setTimeout(() => e.target.setSelectionRange(start, end), 0);
                                    }
                                }
                                register(field.name).onChange(e);
                            }}
                        />
                    )}

                    {field.type === 'select' && (
                        <select
                            {...register(field.name, { required: field.required ? `${field.label} harus dipilih` : false })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors text-sm ${errors[field.name] ? 'border-red-500' : 'border-gray-300'
                                }`}
                            disabled={field.disabled}
                        >
                            <option value="">Pilih {field.label}</option>
                            {field.options?.map(opt => (
                                <option key={String(opt.value)} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    )}

                    {field.type === 'color' && (
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                {...register(field.name)}
                                className="h-10 w-20 p-1 border border-gray-300 rounded cursor-pointer"
                            />
                            <span className="text-xs text-gray-500">Pilih warna untuk {field.label}</span>
                        </div>
                    )}

                    {field.type === 'number' && (
                        <Input
                            type="number"
                            {...register(field.name, { required: field.required ? `${field.label} harus diisi` : false, valueAsNumber: true })}
                            placeholder={field.placeholder}
                            disabled={field.disabled}
                            error={errors[field.name]?.message as string}
                        />
                    )}

                    {field.type === 'toggle' && (
                        <Controller
                            control={control}
                            name={field.name}
                            render={({ field: { onChange, value } }) => (
                                <div className="flex items-center">
                                    <button
                                        type="button"
                                        className={`${value ? 'bg-primary' : 'bg-gray-200'
                                            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                                        onClick={() => onChange(!value)}
                                        aria-pressed={!!value}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`${value ? 'translate-x-5' : 'translate-x-0'
                                                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                        />
                                    </button>
                                    <span className="ml-3 text-sm text-gray-700">
                                        {value ? 'Aktif' : 'Tidak Aktif'}
                                    </span>
                                </div>
                            )}
                        />
                    )}

                    {errors[field.name] && field.type !== 'text' && (
                        <span className="text-xs text-red-500 mt-0.5">{errors[field.name]?.message as string}</span>
                    )}
                </div>
            ))}

            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={isLoading}>
                    Batal
                </Button>
                <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
                    Simpan
                </Button>
            </div>
        </form>
    );
};

export default MasterDataForm;
