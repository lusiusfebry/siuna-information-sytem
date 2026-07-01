import { render, screen, fireEvent } from '../../../test/utils';
import Button from '../Button';
import { describe, it, expect, vi } from 'vitest';

describe('Button Component', () => {
    it('renders button with text', () => {
        render(<Button>Click Me</Button>);
        expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('handles onClick event', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click Me</Button>);

        fireEvent.click(screen.getByText('Click Me'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders disabled state', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('renders loading state', () => {
        render(<Button isLoading>Loading</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
        // Check for spinner or loading text depending on implementation
        // Usually Button.tsx has strict implementation for isLoading
    });
});
