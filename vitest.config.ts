import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
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
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['src/**/*.test.{js,ts}', 'tests/**/*.test.{js,ts}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'dist/', 'tools/'],
        },
    },
});
