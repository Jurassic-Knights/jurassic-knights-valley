/**
 * Phase 5 - Fix Registry, Component, Logger imports
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
let filesModified = 0;

// Files that need Registry import
const REGISTRY_FILES = [
    'core/Entity.ts',
    'core/Profiler.ts',
    'core/Game.ts',
    'gameplay/Hero.ts',
    'gameplay/Resource.ts',
    'gameplay/DroppedItem.ts',
    'gameplay/Merchant.ts',
    'gameplay/Dinosaur.ts',
    'gameplay/EnemyCore.ts',
    'gameplay/CraftingManager.ts',
    'gameplay/ProgressionSystem.ts',
    'ai/behaviors/enemies/EnemyAI.ts',
    'ai/behaviors/bosses/BossAI.ts',
    'ai/AISystem.ts',
    'systems/EconomySystem.ts',
    'systems/DamageSystem.ts',
    'systems/HeroSystem.ts',
    'systems/HeroCombatService.ts',
    'systems/DinosaurSystem.ts',
    'systems/EnemySystem.ts',
    'systems/ResourceSystem.ts',
    'systems/CombatController.ts',
    'systems/spawners/PropSpawner.ts',
    'systems/spawners/ResourceSpawner.ts',
    'systems/spawners/DropSpawner.ts',
    'systems/SpawnManager.ts',
    'rendering/HeroRenderer.ts',
    'rendering/DinosaurRenderer.ts',
    'rendering/ResourceRenderer.ts',
    'vfx/VFXController.ts',
    'vfx/FloatingText.ts',
    'vfx/MaterialLibrary.ts',
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

// Files that need Logger import
const LOGGER_FILES = [
    'gameplay/QuestManager.ts',
    'systems/InteractionSystem.ts',
];

// Component files that need Component import
const COMPONENT_FILES = [
    'components/HealthComponent.ts',
    'components/StatsComponent.ts',
    'components/CombatComponent.ts',
    'components/InventoryComponent.ts',
    'components/AIComponent.ts',
];

function getRelativePath(fromFile, toModule) {
    const fromDir = path.dirname(fromFile);
    let relativePath = path.relative(fromDir, path.join(SRC_DIR, toModule)).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    }
    return relativePath;
}

function addImport(filePath, importName, fromModule) {
    if (!fs.existsSync(filePath)) {
        console.log(`  Skipping ${filePath} - file not found`);
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if already imported
    const importPattern = new RegExp(`import\\s*{[^}]*\\b${importName}\\b[^}]*}\\s*from`);
    if (importPattern.test(content)) {
        console.log(`  Skipping ${path.basename(filePath)} - already has ${importName} import`);
        return false;
    }

    const relativePath = getRelativePath(filePath, fromModule);
    const importLine = `import { ${importName} } from '${relativePath}';\n`;

    // Find the first import statement or the first non-comment line
    const lines = content.split('\n');
    let insertIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('import ')) {
            // Insert after all existing imports
            insertIndex = i + 1;
            while (insertIndex < lines.length && lines[insertIndex].trim().startsWith('import ')) {
                insertIndex++;
            }
            break;
        } else if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*') && !line.startsWith('*/')) {
            // Insert before first code line
            insertIndex = i;
            break;
        }
    }

    lines.splice(insertIndex, 0, importLine);
    content = lines.join('\n');

    fs.writeFileSync(filePath, content, 'utf8');
    return true;
}

console.log('Phase 5 - Adding remaining imports...\n');

// Add Registry imports
console.log('Adding Registry imports:');
for (const file of REGISTRY_FILES) {
    const filePath = path.join(SRC_DIR, file);
    if (addImport(filePath, 'Registry', 'core/Registry')) {
        filesModified++;
        console.log(`  Fixed: ${file}`);
    }
}

// Add Logger imports
console.log('\nAdding Logger imports:');
for (const file of LOGGER_FILES) {
    const filePath = path.join(SRC_DIR, file);
    if (addImport(filePath, 'Logger', 'core/Logger')) {
        filesModified++;
        console.log(`  Fixed: ${file}`);
    }
}

// Add Component imports
console.log('\nAdding Component imports:');
for (const file of COMPONENT_FILES) {
    const filePath = path.join(SRC_DIR, file);
    if (addImport(filePath, 'Component', 'core/Component')) {
        filesModified++;
        console.log(`  Fixed: ${file}`);
    }
}

console.log(`\nComplete! Modified ${filesModified} files.`);
