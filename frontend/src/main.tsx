/* eslint-disable react-refresh/only-export-components */
import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import { useAuthStore } from './stores/authStore'

import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient()

const Root = () => {
    const { checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Toaster position="top-right" />
                    <App />
                </BrowserRouter>
            </QueryClientProvider>
        </React.StrictMode>
    );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Root />);
