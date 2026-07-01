import React, { useState } from 'react';
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

export const EmployeeWizard: React.FC<EmployeeWizardProps> = ({ initialData, onComplete, onSaveDraft, onCancel }) => {
    const [currentStep, setCurrentStep] = useState(1);

    // We store partial data for each step. 
    // Step 1 returns structured values + optional file.
    // For simplicity, we can store the Step 1 values in state.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formData, setFormData] = useState<any>(initialData || {});

    // Save as Draft handler - receives data from step form
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSaveDraftFromStep = (stepData: any) => {
        const payload = new FormData();

        // Merge existing formData with step data
        const mergedData = { ...formData, ...stepData };

        Object.keys(mergedData).forEach(key => {
            if (key === 'foto_karyawan' && mergedData[key] instanceof File) {
                payload.append('foto_karyawan', mergedData[key]);
            } else if (key === 'data_anak' || key === 'data_saudara_kandung') {
                // Serialize JSON arrays only if they exist
                if (mergedData[key]) {
                    payload.append(key, JSON.stringify(mergedData[key]));
                }
            } else if (mergedData[key] !== undefined && mergedData[key] !== null && mergedData[key] !== '') {
                payload.append(key, String(mergedData[key]));
            }
        });

        // Set as draft
        payload.append('is_draft', 'true');

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

        // Construct FormData for submission
        const payload = new FormData();
        Object.keys(finalData).forEach(key => {
            if (key === 'foto_karyawan' && finalData[key] instanceof File) {
                payload.append('foto_karyawan', finalData[key]);
            } else if (key === 'data_anak' || key === 'data_saudara_kandung') {
                // Serialize JSON arrays only if they exist
                if (finalData[key]) {
                    payload.append(key, JSON.stringify(finalData[key]));
                }
            } else if (finalData[key] !== undefined && finalData[key] !== null) {
                payload.append(key, String(finalData[key]));
            }
        });

        // Explicitly set is_draft to false for final save
        payload.set('is_draft', 'false');

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
