import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dashboardApiPlugin } from './tools/dashboard/src/api-server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    // Serve from project root
    root: '.',

    // Path aliases for cleaner imports
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

    // Plugins
    plugins: [
        // Dashboard API - handles /api/* and /images/* routes
        dashboardApiPlugin(),
    ],

    // Dev server config
    server: {
        port: 5173,
        strictPort: true,
        open: true,
        cors: true,
    },

    // Build config for production
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        minify: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html'),
                dashboard: path.resolve(__dirname, 'tools/dashboard/index.html'),
            },
            plugins: [
                visualizer({
                    filename: 'dist/stats.html',
                    open: false,
                    gzipSize: true,
                    brotliSize: true,
                }),
            ],
        },
    },

    // Treat .json files as assets that can be fetched
    assetsInclude: ['**/*.json'],
});
