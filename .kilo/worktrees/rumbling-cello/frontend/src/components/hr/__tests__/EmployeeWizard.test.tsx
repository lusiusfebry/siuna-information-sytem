import { render, screen, fireEvent } from '../../../test/utils';
import { EmployeeWizard } from '../EmployeeWizard';
import { describe, it, expect, vi } from 'vitest';

// Mock child components to simplify integration test
vi.mock('../EmployeeStep1Form', () => ({
    default: ({ onNext }: { onNext: (data: Record<string, unknown>) => void }) => (
        <div>
            Step 1 Form
            <button onClick={() => onNext({ nama_lengkap: 'John' })}>Next Step</button>
        </div>
    )
}));

vi.mock('../EmployeeStep2Form', () => ({
    default: ({ onNext, onBack }: { onNext: (data: Record<string, unknown>) => void, onBack: () => void }) => (
        <div>
            Step 2 Form
            <button onClick={onBack}>Back</button>
            <button onClick={() => onNext({ job_title: 'Dev' })}>Next Step</button>
        </div>
    )
}));

vi.mock('../EmployeeStep3Form', () => ({
    default: ({ onSubmit, onBack }: { onSubmit: (data: Record<string, unknown>) => void, onBack: () => void }) => (
        <div>
            Step 3 Form
            <button onClick={onBack}>Back</button>
            <button onClick={() => onSubmit({ family: 'data' })}>Submit</button>
        </div>
    )
}));

// Mock API service
vi.mock('../../../services/employee.service', () => ({
    default: {
        createEmployee: vi.fn().mockResolvedValue({ id: 1, nama: 'John' }),
        uploadPhoto: vi.fn(),
        uploadDocuments: vi.fn()
    }
}));

describe('EmployeeWizard', () => {
    const defaultProps = {
        onComplete: vi.fn(),
        onCancel: vi.fn()
    };

    it('renders step 1 initially', () => {
        render(<EmployeeWizard {...defaultProps} />);
        expect(screen.getByText('Step 1 Form')).toBeInTheDocument();
    });

    it('navigates to step 2', () => {
        render(<EmployeeWizard {...defaultProps} />);
        fireEvent.click(screen.getByText('Next Step'));
        expect(screen.getByText('Step 2 Form')).toBeInTheDocument();
    });

    it('navigates back from step 2', () => {
        render(<EmployeeWizard {...defaultProps} />);
        fireEvent.click(screen.getByText('Next Step')); // Go to 2
        fireEvent.click(screen.getByText('Back')); // Go back to 1
        expect(screen.getByText('Step 1 Form')).toBeInTheDocument();
    });

    it('navigates to step 3 and submits', () => {
        render(<EmployeeWizard {...defaultProps} />);
        fireEvent.click(screen.getByText('Next Step')); // Go to 2
        fireEvent.click(screen.getByText('Next Step')); // Go to 3
        expect(screen.getByText('Step 3 Form')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Submit'));
        // We can assert API call if we import the mocked service and spy on it, 
        // or check for success message toast if we mocked toast.
    });
});
