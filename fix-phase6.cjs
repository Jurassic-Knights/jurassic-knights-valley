/**
 * Phase 6 - Fix remaining Registry imports
 * These files still report "Registry is not defined" despite running Phase 5
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
let filesModified = 0;

// Files that STILL need Registry import based on debug output
const REGISTRY_FILES = [
    'core/Profiler.ts',
    'core/Game.ts',
    'components/HealthComponent.ts',
    'components/CombatComponent.ts',
    'components/InventoryComponent.ts',
    'gameplay/Hero.ts',
    'gameplay/Dinosaur.ts',
    'gameplay/EnemyCore.ts',
    'gameplay/Boss.ts',
    'gameplay/CraftingManager.ts',
    'gameplay/QuestManager.ts',
    'ai/behaviors/enemies/EnemyAI.ts',
    'ai/behaviors/bosses/BossAI.ts',
    'ai/AISystem.ts',
    'systems/BossSystem.ts',
    'systems/InteractionSystem.ts',
    'systems/spawners/ResourceSpawner.ts',
    'systems/SpawnManager.ts',
    'vfx/FogOfWarSystem.ts',
    'ui/core/UIPanel.ts',
    'ui/UIManager.ts',
    'ui/InventoryUI.ts',
    'ui/EquipmentUI.ts',
    'ui/EquipmentUIRenderer.ts',
    'ui/MerchantUI.ts',
    'ui/ContextActionUI.ts',
    'ui/DebugUI.ts',
    'ui/responsive/LayoutStrategies.ts',
    'ui/controllers/ForgeController.ts',
];

function getRelativePath(fromFile, toModule) {
    const fromDir = path.dirname(fromFile);
    let relativePath = path.relative(fromDir, path.join(SRC_DIR, toModule)).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    }
    // Remove .ts extension if present
    relativePath = relativePath.replace(/\.ts$/, '');
    return relativePath;
}

function addImportIfMissing(filePath, importName, fromModule) {
    if (!fs.existsSync(filePath)) {
        console.log(`  SKIP ${path.basename(filePath)} - file not found`);
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if already imported (either named or renamed import)
    const importPatterns = [
        new RegExp(`import\\s*{[^}]*\\b${importName}\\b[^}]*}\\s*from\\s*['"][^'"]+['"]`),
        new RegExp(`import\\s+${importName}\\s+from`),
    ];

    for (const pattern of importPatterns) {
        if (pattern.test(content)) {
            // Already has import, check if it's from the right module
            console.log(`  HAS  ${path.basename(filePath)} - has ${importName} import`);
            return false;
        }
    }

    const relativePath = getRelativePath(filePath, fromModule);
    const importLine = `import { ${importName} } from '${relativePath}';`;

    // Find where to insert - after existing imports or at the top
    const lines = content.split('\n');
    let insertIndex = 0;
    let lastImportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('import ') || line.startsWith('import{')) {
            lastImportIndex = i;
        }
    }

    if (lastImportIndex >= 0) {
        // Insert after last import
        insertIndex = lastImportIndex + 1;
    } else {
        // Find first non-comment line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*') && !line.startsWith('*/')) {
                insertIndex = i;
                break;
            }
        }
    }

    lines.splice(insertIndex, 0, importLine);
    content = lines.join('\n');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ADD  ${path.basename(filePath)} - added ${importName} import`);
    return true;
}

console.log('Phase 6 - Adding remaining Registry imports...\n');

for (const file of REGISTRY_FILES) {
    const filePath = path.join(SRC_DIR, file);
    if (addImportIfMissing(filePath, 'Registry', 'core/Registry.ts')) {
        filesModified++;
    }
}

console.log(`\nComplete! Modified ${filesModified} files.`);
