import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { dashboardApiPlugin } from './tools/dashboard/src/api-server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    // Keep root at project level so imports resolve correctly
    root: '.',

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@core': path.resolve(__dirname, './src/core'),
            '@systems': path.resolve(__dirname, './src/systems'),
            '@vfx': path.resolve(__dirname, './src/vfx'),
            '@ui': path.resolve(__dirname, './src/ui'),
            '@config': path.resolve(__dirname, './src/config'),
            '@data': path.resolve(__dirname, './src/data'),
            '@audio': path.resolve(__dirname, './src/audio'),
            '@entities': path.resolve(__dirname, './src/entities'),
            '@dashboard': path.resolve(__dirname, './tools/dashboard/src'),
        },
    },

    plugins: [
        dashboardApiPlugin(),
    ],

    server: {
        port: 5174, // Dedicated port for Dashboard
        strictPort: true,
        open: '/tools/dashboard/index.html',
        cors: true,
    },

    build: {
        outDir: 'dist-dashboard',
        minify: true,
        rollupOptions: {
            input: {
                dashboard: path.resolve(__dirname, 'tools/dashboard/index.html'),
            },
        },
    },
});
