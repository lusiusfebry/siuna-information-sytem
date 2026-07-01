import { render, screen, fireEvent } from '../../../test/utils';
import VirtualEmployeeTable from '../VirtualEmployeeTable';
import { describe, it, expect, vi } from 'vitest';

// Mock react-window and related libraries
vi.mock('react-virtualized-auto-sizer', () => ({
    default: ({ children }: { children: (props: { height: number, width: number }) => React.ReactNode }) => children({ height: 600, width: 800 }),
    AutoSizer: ({ children }: { children: (props: { height: number, width: number }) => React.ReactNode }) => children({ height: 600, width: 800 })
}));

vi.mock('react-window-infinite-loader', () => ({
    default: ({ children }: { children: (props: { onItemsRendered: (info: unknown) => void, ref: (ref: unknown) => void }) => React.ReactNode }) => children({ onItemsRendered: vi.fn(), ref: vi.fn() }),
    InfiniteLoader: ({ children }: { children: (props: { onItemsRendered: (info: unknown) => void, ref: (ref: unknown) => void }) => React.ReactNode }) => children({ onItemsRendered: vi.fn(), ref: vi.fn() })
}));

vi.mock('react-window', () => ({
    FixedSizeList: ({ children, itemCount }: { children: (props: { index: number, style: React.CSSProperties }) => React.ReactNode, itemCount: number }) => (
        <div>
            {Array.from({ length: itemCount }).map((_, index) => (
                <div key={index}>
                    {children({ index, style: {} })}
                </div>
            ))}
        </div>
    )
}));

describe('VirtualEmployeeTable', () => {
    const mockEmployees = [
        { id: 1, nama_lengkap: 'John Doe', nomor_induk_karyawan: '123', posisi_jabatan: { nama: 'IT' }, department: { nama: 'Tech' } },
        { id: 2, nama_lengkap: 'Jane Doe', nomor_induk_karyawan: '456', posisi_jabatan: { nama: 'HR' }, department: { nama: 'Ops' } }
    ];

    const defaultProps = {
        employees: mockEmployees,
        hasNextPage: false,
        isNextPageLoading: false,
        loadNextPage: vi.fn(),
        onRowClick: vi.fn(),
        onDelete: vi.fn()
    };

    it('renders list of employees', () => {
        render(<VirtualEmployeeTable {...defaultProps} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('handles row click', () => {
        render(<VirtualEmployeeTable {...defaultProps} />);
        fireEvent.click(screen.getByText('John Doe'));
        expect(defaultProps.onRowClick).toHaveBeenCalledWith(mockEmployees[0]);
    });

    it('handles delete button click', () => {
        render(<VirtualEmployeeTable {...defaultProps} />);
        // Find delete button implementation (it uses material-symbols-outlined 'delete')
        // We can search by role button or display text if aria-label is missing, but title="Hapus Karyawan" is there.
        const deleteButtons = screen.getAllByTitle('Hapus Karyawan');
        fireEvent.click(deleteButtons[0]);
        // Should call onDelete with ID
        expect(defaultProps.onDelete).toHaveBeenCalledWith(1);
        // Should NOT call onRowClick (propagation stopped)
        expect(defaultProps.onRowClick).toHaveBeenCalledTimes(0); // Clear previous calls?
    });

    it('shows loading state when hasNextPage is true', () => {
        render(<VirtualEmployeeTable {...defaultProps} hasNextPage={true} />);
        expect(screen.getByText('Loading more...')).toBeInTheDocument();
    });
});
