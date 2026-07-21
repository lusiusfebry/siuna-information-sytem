import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        // INV-N06: installable PWA + offline read support for field use.
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'icons/apple-touch-icon.png'],
            manifest: {
                name: 'Bebang Sistem Informasi',
                short_name: 'Bebang SI',
                description: 'Sistem informasi HR, Inventory, dan Facility Management',
                lang: 'id',
                theme_color: '#135bec',
                background_color: '#f6f6f8',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                icons: [
                    { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
                    { src: 'icons/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },
            workbox: {
                // Precache the built app shell so the app opens offline.
                globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
                // SPA client-side routing: serve index.html for navigations,
                // but never shadow the API — those must hit the network/cache rule.
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/api/],
                cleanupOutdatedCaches: true,
                runtimeCaching: [
                    {
                        // QR / asset-tag / product lookups (INV-N06 read-only offline):
                        // serve fresh when online, fall back to the last cached
                        // response when the network is unavailable or slow.
                        urlPattern: ({ url }) =>
                            url.pathname.startsWith('/api/inventory/label/lookup') ||
                            /^\/api\/inventory\/label\/.+\/qr$/.test(url.pathname),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'inventory-lookup',
                            networkTimeoutSeconds: 3,
                            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                ],
            },
            devOptions: {
                // Keep the SW off in `vite dev` to avoid stale-cache surprises
                // during development; it activates in preview/production builds.
                enabled: false,
            },
        }),
    ],
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
        host: true,
        allowedHosts: true,
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
