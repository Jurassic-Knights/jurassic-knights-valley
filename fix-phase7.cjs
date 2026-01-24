/**
 * Phase 7 - Fix EntityManager casing issues
 * Replace uppercase EntityManager with lowercase entityManager import
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
let filesModified = 0;

// Files that use EntityManager (uppercase) but need entityManager (lowercase)
const FILES_TO_FIX = [
    'ui/MinimapSystem.ts',
    'systems/InteractionSystem.ts',
    'systems/spawners/PropSpawner.ts',
    'systems/spawners/ResourceSpawner.ts',
    'systems/spawners/DropSpawner.ts',
    'systems/spawners/EnemySpawner.ts',
    'core/Profiler.ts',
    'rendering/EntityRenderService.ts',
];

function getRelativeImportPath(fromFile, toModule) {
    const fromDir = path.dirname(fromFile);
    let relativePath = path.relative(fromDir, path.join(SRC_DIR, toModule)).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    }
    relativePath = relativePath.replace(/\.ts$/, '');
    return relativePath;
}

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`  SKIP ${path.basename(filePath)} - file not found`);
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if file uses EntityManager (uppercase)
    if (!/\bEntityManager\b/.test(content)) {
        console.log(`  SKIP ${path.basename(filePath)} - no EntityManager usage`);
        return false;
    }

    // Check if already has correct import
    if (/import\s*{\s*entityManager\s*}\s*from/.test(content)) {
        // Just need to fix usage
        content = content.replace(/\bEntityManager\b(?!Service)/g, 'entityManager');
        modified = true;
    } else if (/import\s*{\s*EntityManager\s*}\s*from/.test(content)) {
        // Fix import AND usage
        content = content.replace(/import\s*{\s*EntityManager\s*}\s*from/, 'import { entityManager } from');
        content = content.replace(/\bEntityManager\b(?!Service)/g, 'entityManager');
        modified = true;
    } else {
        // Need to add import
        const importPath = getRelativeImportPath(filePath, 'core/EntityManager.ts');
        const importLine = `import { entityManager } from '${importPath}';`;

        // Find where to insert
        const lines = content.split('\n');
        let insertIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ')) {
                insertIndex = i + 1;
            }
        }

        // Insert import and fix usages
        lines.splice(insertIndex, 0, importLine);
        content = lines.join('\n');
        content = content.replace(/\bEntityManager\b(?!Service)/g, 'entityManager');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  FIX  ${path.basename(filePath)}`);
        return true;
    }

    return false;
}

console.log('Phase 7 - Fixing EntityManager casing...\n');

for (const file of FILES_TO_FIX) {
    const filePath = path.join(SRC_DIR, file);
    if (fixFile(filePath)) {
        filesModified++;
    }
}

console.log(`\nComplete! Modified ${filesModified} files.`);
