/**
 * Dashboard Build Script
 * Bundles TypeScript modules into a single JS file for the dashboard
 */

import * as esbuild from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dashboardDir = join(__dirname, '..');

async function build() {
    try {
        await esbuild.build({
            entryPoints: [join(dashboardDir, 'src/main.ts')],
            bundle: true,
            outfile: join(dashboardDir, 'dist/dashboard.js'),
            format: 'iife',
            target: ['es2020'],
            minify: false,
            sourcemap: true,
            logLevel: 'info',
        });

        console.log('✅ Dashboard bundle created: tools/dashboard/dist/dashboard.js');
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

// Watch mode if --watch flag is passed
const isWatch = process.argv.includes('--watch');

if (isWatch) {
    const ctx = await esbuild.context({
        entryPoints: [join(dashboardDir, 'src/main.ts')],
        bundle: true,
        outfile: join(dashboardDir, 'dist/dashboard.js'),
        format: 'iife',
        target: ['es2020'],
        minify: false,
        sourcemap: true,
        logLevel: 'info',
    });

    await ctx.watch();
    console.log('👀 Watching for changes...');
} else {
    build();
}
