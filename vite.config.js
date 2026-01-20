import { defineConfig } from 'vite';

export default defineConfig({
    // Serve from project root
    root: '.',

    // Dev server config
    server: {
        port: 5173,
        open: true,  // Auto-open browser
        cors: true   // Enable CORS for JSON fetching
    },

    // Build config for production
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        // Don't minify for easier debugging
        minify: false
    },

    // Treat .json files as assets that can be fetched
    assetsInclude: ['**/*.json']
});
