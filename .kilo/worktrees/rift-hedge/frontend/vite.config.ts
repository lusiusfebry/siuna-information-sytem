import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@components': path.resolve(__dirname, './src/components'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@services': path.resolve(__dirname, './src/services'),
            '@hooks': path.resolve(__dirname, './src/hooks'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@types': path.resolve(__dirname, './src/types'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'ui-vendor': ['@headlessui/react', '@heroicons/react'],
                    'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
                    'chart-vendor': ['recharts'],
                    'hr-module': [
                        './src/pages/hr/EmployeeListPage',
                        './src/pages/hr/EmployeeDetailPage',
                        './src/components/hr/EmployeeTable',
                    ],
                },
            },
        },
        chunkSizeWarningLimit: 1000,
        // minify: 'terser', // Removed to use default esbuild
        // terserOptions: {
        //     compress: {
        //         drop_console: true,
        //         drop_debugger: true,
        //     },
        // },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom'],
    },
});
