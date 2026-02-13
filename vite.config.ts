import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { dashboardApiPlugin } from './tools/dashboard/src/api-server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Copy default map to public/maps for production fallback when API is unavailable. */
function copyDefaultMapPlugin() {
    return {
        name: 'copy-default-map',
        buildStart() {
            const src = path.join(__dirname, 'src/data/maps/default.json');
            const destDir = path.join(__dirname, 'public/maps');
            const dest = path.join(destDir, 'default.json');
            if (fs.existsSync(src)) {
                fs.mkdirSync(destDir, { recursive: true });
                fs.copyFileSync(src, dest);
            }
        }
    };
}

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
        // Copy default map to public/maps for production (MapDataService fallback)
        copyDefaultMapPlugin(),
    ],

    // Dev server config
    server: {
        port: 5173,
        strictPort: true,
        open: false,
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
