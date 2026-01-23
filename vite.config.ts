import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import { fileURLToPath } from 'url';

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
        },
    },

    // Dev server config
    server: {
        port: 5173,
        strictPort: true, // Fail if 5173 is in use (don't pick another)
        open: true, // Auto-open browser
        cors: true, // Enable CORS for JSON fetching
    },

    // Build config for production
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        minify: true, // Enable minification for production
        sourcemap: true, // Keep sourcemaps for debugging
        rollupOptions: {
            plugins: [
                // Bundle size analyzer - generates stats.html after build
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
