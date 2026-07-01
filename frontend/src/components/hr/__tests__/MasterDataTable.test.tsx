import { render, screen } from '../../../test/utils';
import MasterDataTable, { Column } from '../MasterDataTable';
import { describe, it, expect, vi } from 'vitest';

// Mock dependencies
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useSearchParams: () => [new URLSearchParams(), vi.fn()],
    };
});

interface TestData {
    id: number;
    nama: string;
}

describe('MasterDataTable', () => {
    const mockColumns: Column<TestData>[] = [
        { accessor: 'nama', header: 'Nama' }
    ];

    const mockData: TestData[] = [
        { id: 1, nama: 'Item 1' },
        { id: 2, nama: 'Item 2' }
    ];

    const defaultProps = {
        title: 'Test Table',
        columns: mockColumns,
        data: mockData,
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onCreate: vi.fn()
    };

    it('renders table with data', () => {
        render(<MasterDataTable {...defaultProps} />);
        expect(screen.getByText('Test Table')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    // Add more interaction tests as needed
});
