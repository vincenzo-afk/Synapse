import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        tailwindcss(),
        react(),
        VitePWA({
            registerType: 'prompt', // 'prompt' not 'autoUpdate' — avoid interrupting in-progress timers/entries (failure mode mitigation)
            injectRegister: 'auto',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                // Cache all routes including code-split module chunks so the app boots
                // fully offline from any route after install — not just the initial route.
                runtimeCaching: [],
            },
            includeAssets: ['fonts/**', 'icons/**'],
            manifest: {
                name: 'Synapse',
                short_name: 'Synapse',
                description: 'Your personal operating system. Habits, tasks, workouts, journaling, finance and more. Fully offline, fully private.',
                theme_color: '#7c6af7',
                background_color: '#0d0d0f',
                display: 'standalone',
                start_url: '/',
                orientation: 'any',
                icons: [
                    {
                        src: '/icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-512-maskable.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-charts': ['recharts'],
                    'vendor-ui': ['framer-motion', 'lucide-react', '@radix-ui/react-tabs', '@radix-ui/react-dialog', '@radix-ui/react-switch', '@radix-ui/react-checkbox'],
                    'vendor-db': ['dexie', 'dexie-react-hooks', 'uuid', 'papaparse'],
                },
            },
        },
    },
});
