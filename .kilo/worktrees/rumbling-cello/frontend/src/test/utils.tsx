/* eslint-disable react-refresh/only-export-components */
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AllTheProviders } from './ProviderWrapper';

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };
