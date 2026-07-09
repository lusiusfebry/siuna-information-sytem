import React, { useState, useEffect } from 'react';
import { Employee } from '../../types/hr';
import { EmployeeStep1Form } from './EmployeeStep1Form';
import { EmployeeStep2Form } from './EmployeeStep2Form';
import { EmployeeStep3Form } from './EmployeeStep3Form';
import { CheckIcon } from '@heroicons/react/24/solid';

interface EmployeeWizardProps {
    initialData?: Employee;
    onComplete: (data: FormData) => void;
    onSaveDraft?: (data: FormData) => void;
    onCancel: () => void;
}

// Builds the multipart FormData sent to the API from the merged wizard values.
// Critically, it SKIPS plain relation objects (e.g. `divisi`, `department`,
// `manager` that leak in when editing an existing employee) — those would
// otherwise be serialized as the literal string "[object Object]". The real
// foreign keys travel as separate scalar fields (`divisi_id`, etc.).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildEmployeeFormData = (data: Record<string, any>, opts: { isDraft: boolean }): FormData => {
    const payload = new FormData();
    Object.keys(data).forEach((key) => {
        const value = data[key];
        if (key === 'foto_karyawan') {
            if (value instanceof File) payload.append('foto_karyawan', value);
            return;
        }
        if (key === 'data_anak' || key === 'data_saudara_kandung') {
            if (value) payload.append(key, JSON.stringify(value));
            return;
        }
        if (value === undefined || value === null) return;
        // Draft additionally drops empty strings to keep the payload minimal.
        if (opts.isDraft && value === '') return;
        // Skip relation objects / arrays / nested structures — only scalars go through.
        if (typeof value === 'object') return;
        payload.append(key, String(value));
    });
    payload.set('is_draft', opts.isDraft ? 'true' : 'false');
    return payload;
};

export const EmployeeWizard: React.FC<EmployeeWizardProps> = ({ initialData, onComplete, onSaveDraft, onCancel }) => {
    const [currentStep, setCurrentStep] = useState(1);

    // Scroll to top whenever the step changes (forward or back).
    // The scrollable element is the layout's <main>, not the window.
    useEffect(() => {
        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    // We store partial data for each step. 
    // Step 1 returns structured values + optional file.
    // For simplicity, we can store the Step 1 values in state.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formData, setFormData] = useState<any>(initialData || {});

    // Save as Draft handler - receives data from step form
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSaveDraftFromStep = (stepData: any) => {
        const mergedData = { ...formData, ...stepData };
        const payload = buildEmployeeFormData(mergedData, { isDraft: true });
        if (onSaveDraft) {
            onSaveDraft(payload);
        }
    };

    const steps = [
        { id: 1, name: 'Data Personal' },
        { id: 2, name: 'Informasi HR' },
        { id: 3, name: 'Data Keluarga' }
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleStep1Next = (data: any) => {
        // Merge data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFormData((prev: any) => ({ ...prev, ...data }));
        // For Step 1 implementation per plan, we might stop here or simulate next.
        // The plan says "Implement Step 1". 
        // But the Wizard needs to handle navigation.
        // Let's assume we move to step 2.

        // HOWEVER, since we are only strictly implementing Step 1 in this session (as per "Employee Wizard Step 1 Implementation" title often implies, but the plan says "Create Wizard... Create Step 1...").
        // The plan actually mentions "Step 2: Informasi HR" in the Wizard description.
        // It doesn't explicitly say "Implement Step 2 Form".
        // It says "Create Employee Step 1 Form Component".
        // So Step 2 and 3 might be placeholders for now.

        setCurrentStep(2);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleStep2Next = (data: any) => {
        // Merge data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFormData((prev: any) => ({ ...prev, ...data }));
        setCurrentStep(3);
    };

    const handleStep2Back = () => {
        setCurrentStep(1);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleStep3Next = (data: any) => {
        const finalData = { ...formData, ...data };
        setFormData(finalData);
        const payload = buildEmployeeFormData(finalData, { isDraft: false });
        onComplete(payload);
    };

    const handleStep3Back = () => {
        setCurrentStep(2);
    };

    // Placeholder for final submission (temporary until step 2/3 built)
    // If user wants to save just Step 1? Usually wizard requires all steps.
    // But for this task, maybe we just verify step 1 works.

    // Check if we can submit from later steps.
    // Let's implement basic render logic.

    // Important: The plan "Update Employee Create Page" says "Handle wizard completion... Convert form data... Call service".
    // This implies the Wizard calls onComplete when ALL steps are done.

    return (
        <div className="space-y-6">
            {/* Steps Indicator */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <nav aria-label="Progress">
                        <ol role="list" className="flex items-center">
                            {steps.map((step, stepIdx) => (
                                <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                                    <div className="flex items-center">
                                        <div
                                            className={`${step.id < currentStep
                                                ? 'bg-primary-600 hover:bg-primary-900 w-8 h-8 flex items-center justify-center rounded-full'
                                                : step.id === currentStep
                                                    ? 'border-2 border-primary-600 w-8 h-8 flex items-center justify-center rounded-full bg-white'
                                                    : 'border-2 border-gray-300 w-8 h-8 flex items-center justify-center rounded-full bg-white'
                                                }`}
                                        >
                                            {step.id < currentStep ? (
                                                <CheckIcon className="w-5 h-5 text-white" aria-hidden="true" />
                                            ) : (
                                                <span
                                                    className={`${step.id === currentStep ? 'text-primary-600' : 'text-gray-500'
                                                        } text-sm font-medium`}
                                                >
                                                    {step.id}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`ml-4 text-sm font-medium ${step.id === currentStep ? 'text-primary-800' : 'text-gray-500'}`}>
                                            {step.name}
                                        </span>
                                    </div>
                                    {stepIdx !== steps.length - 1 && (
                                        <div className="absolute top-4 w-full h-0.5 bg-gray-200 left-0 -ml-px mt-0.5 hidden sm:block" style={{ left: '2rem', width: 'calc(100% - 2rem)' }} />
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div>
                {currentStep === 1 && (
                    <EmployeeStep1Form
                        initialData={formData}
                        employeeId={initialData?.id}
                        onNext={handleStep1Next}
                        onSaveDraft={handleSaveDraftFromStep}
                        onCancel={onCancel}
                    />
                )}
                {currentStep === 2 && (
                    <EmployeeStep2Form
                        initialData={formData}
                        headData={formData} // Pass collected data to populate read-only fields
                        employeeId={initialData?.id}
                        onNext={handleStep2Next}
                        onSaveDraft={handleSaveDraftFromStep}
                        onBack={handleStep2Back}
                    />
                )}
                {currentStep === 3 && (
                    <EmployeeStep3Form
                        initialData={formData}
                        headData={formData}
                        onNext={handleStep3Next}
                        onSaveDraft={handleSaveDraftFromStep}
                        onBack={handleStep3Back}
                    />
                )}
            </div>
        </div>
    );
};
