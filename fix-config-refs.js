/**
 * Fix Script: Revert non-tunable getConfig() calls back to GameConstants
 * 
 * The migration incorrectly replaced GameConstants.X with getConfig().X
 * for non-tunable values like Events, World, Grid, UI, Core.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, 'src');

// Non-tunable sections that should use GameConstants, not getConfig()
const NON_TUNABLE = ['Events', 'World', 'Grid', 'UI', 'Core', 'Biome', 'Weather'];

function walkDir(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath, callback);
        } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            callback(filePath);
        }
    }
}

let totalReplacements = 0;
let filesModified = 0;

walkDir(srcDir, (filePath) => {
    // Skip GameConstants.ts and GameConfig.ts
    if (filePath.includes('GameConstants.ts') || filePath.includes('GameConfig.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Replace getConfig().X with GameConstants.X for non-tunable sections
    for (const section of NON_TUNABLE) {
        const regex = new RegExp(`getConfig\\(\\)\\.${section}`, 'g');
        const matches = content.match(regex);
        if (matches) {
            totalReplacements += matches.length;
            content = content.replace(regex, `GameConstants.${section}`);
        }
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        const relPath = path.relative(srcDir, filePath);
        console.log(`[FIXED] ${relPath}`);
        filesModified++;
    }
});

console.log(`\nFix complete: ${filesModified} files modified, ${totalReplacements} replacements made`);
