import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Custom render function that wraps components with necessary providers
export const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    // Create a new QueryClient for each test to avoid potential state leakage
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false, // Turn off retries for testing
            },
        },
    });

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {children}
            </BrowserRouter>
        </QueryClientProvider>
    );
};
