/**
 * Complete Module Import Fix - Phase 2
 * Fixes the remaining declare const statements that were not mapped in Phase 1
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
let filesModified = 0;
let replacementsMade = 0;

// Extended module mapping: name -> source file (relative to src/)
const MODULE_MAP = {
    // UI Components
    'UIPanel': 'ui/core/UIPanel',
    'UICapture': 'ui/UICapture',
    'LayoutStrategies': 'ui/responsive/LayoutStrategies',
    'ForgeController': 'ui/controllers/ForgeController',

    // Spawners
    'PropSpawner': 'systems/spawners/PropSpawner',
    'ResourceSpawner': 'systems/spawners/ResourceSpawner',
    'EnemySpawner': 'systems/spawners/EnemySpawner',
    'DropSpawner': 'systems/spawners/DropSpawner',

    // Gameplay entities
    'DroppedItem': 'gameplay/DroppedItem',
    'Resource': 'gameplay/Resource',
    'Merchant': 'gameplay/Merchant',
    'BaseCreature': 'gameplay/BaseCreature',

    // Config
    'PropConfig': 'config/PropConfig',
    'BiomeConfig': 'config/BiomeConfig',
    'EntityConfig': 'config/EntityConfig',
    'EquipmentSlotsConfig': 'config/EquipmentSlotsConfig',
    'ColorPalette': 'config/ColorPalette',

    // Rendering
    'EnvironmentRenderer': 'rendering/EnvironmentRenderer',
    'DinosaurRenderer': 'rendering/DinosaurRenderer',

    // VFX Weather
    'RainVFX': 'vfx/weather/RainVFX',
    'SnowVFX': 'vfx/weather/SnowVFX',

    // Systems
    'HeroCombatService': 'systems/HeroCombatService',
    'InputSystem': 'input/InputSystem',
    'DamageSystem': 'systems/DamageSystem',
    'PathfindingSystem': 'systems/PathfindingSystem',

    // Core (already imported usually, but just in case)
    'GameInstance': 'core/Game',

    // Data
    'EntityTypes': 'data/EntityTypes',
    'EntityRegistry': 'entities/EntityLoader', // EntityRegistry is exported from EntityLoader
};

// These modules don't exist or are external libraries - keep as declare const
const EXTERNAL_OR_MISSING = [
    'html2canvas', // External library
    'UI_THEME',    // May be dynamically loaded CSS
    'CropsData',   // Data file that may not exist
    'Enemy',       // Class may not be exported
    'CraftingUI',  // UI that doesn't exist
    'TileMap',     // Data structure
    'RocksData',   // Data file
    'SFX',         // Audio pattern
];

function getRelativePath(fromFile, toModule) {
    const fromDir = path.dirname(fromFile);
    let relativePath = path.relative(fromDir, path.join(SRC_DIR, toModule)).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    }
    return relativePath;
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Find all declare const statements with TODO comments
    const declareRegex = /declare const (\w+): any;.*(?:\/\/ TODO.*)?/g;
    const declares = [];
    let match;

    while ((match = declareRegex.exec(content)) !== null) {
        const name = match[1];
        if (!EXTERNAL_OR_MISSING.includes(name)) {
            declares.push({ name, fullMatch: match[0] });
        }
    }

    if (declares.length === 0) return false;

    // Group by source module
    const importsByModule = {};

    for (const { name, fullMatch } of declares) {
        const modulePath = MODULE_MAP[name];
        if (modulePath) {
            // Check if file exists
            const fullModulePath = path.join(SRC_DIR, modulePath + '.ts');
            if (fs.existsSync(fullModulePath)) {
                if (!importsByModule[modulePath]) {
                    importsByModule[modulePath] = { names: [], matches: [] };
                }
                if (!importsByModule[modulePath].names.includes(name)) {
                    importsByModule[modulePath].names.push(name);
                    importsByModule[modulePath].matches.push(fullMatch);
                }
            } else {
                console.log(`  Warning: Module ${modulePath} not found for ${name}`);
            }
        }
    }

    // Replace declare statements with imports
    for (const [modulePath, data] of Object.entries(importsByModule)) {
        const relativePath = getRelativePath(filePath, modulePath);
        const importStatement = `import { ${data.names.join(', ')} } from '${relativePath}';`;

        // Remove each declare statement
        for (const matchStr of data.matches) {
            content = content.replace(matchStr + '\n', '');
            content = content.replace(matchStr, '');
            replacementsMade++;
        }

        // Add import after existing imports
        const lastImportMatch = content.match(/import .+;\r?\n(?!import)/);
        if (lastImportMatch) {
            const insertPos = content.indexOf(lastImportMatch[0]) + lastImportMatch[0].length;
            content = content.slice(0, insertPos) + importStatement + '\n' + content.slice(insertPos);
        }
    }

    // Clean up empty comment blocks
    content = content.replace(/\/\/ Unmapped modules - need manual import\r?\n(\r?\n)+/g, '\n');
    content = content.replace(/\n\n\n+/g, '\n\n');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    return false;
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            if (processFile(filePath)) {
                filesModified++;
                console.log(`Fixed: ${path.relative(SRC_DIR, filePath)}`);
            }
        }
    }
}

console.log('Completing ES Module Migration (Phase 2)...');
console.log('Source directory:', SRC_DIR);
walkDir(SRC_DIR);
console.log(`\nComplete! Modified ${filesModified} files, made ${replacementsMade} replacements.`);
