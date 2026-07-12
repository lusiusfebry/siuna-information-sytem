/* eslint-disable react-refresh/only-export-components */
import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import { useAuthStore } from './stores/authStore'
import ErrorBoundary from './components/common/ErrorBoundary'

import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Don't retry client errors (4xx like 401/403/404) — only transient
            // 5xx/network, and at most twice. Avoids hammering a denied endpoint.
            retry: (failureCount, error) => {
                const status = (error as { response?: { status?: number } })?.response?.status;
                if (status && status >= 400 && status < 500) return false;
                return failureCount < 2;
            },
            staleTime: 60_000,
            refetchOnWindowFocus: false,
        },
    },
})

const Root = () => {
    const { checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <React.StrictMode>
            <ErrorBoundary>
                <QueryClientProvider client={queryClient}>
                    <BrowserRouter>
                        <Toaster position="top-right" />
                        <App />
                    </BrowserRouter>
                </QueryClientProvider>
            </ErrorBoundary>
        </React.StrictMode>
    );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Root />);
