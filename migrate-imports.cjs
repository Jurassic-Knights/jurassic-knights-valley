/**
 * ES Module Migration Script
 * Replaces `declare const X: any;` with proper ES imports
 */

const fs = require('fs');
const path = require('path');

// Module mapping: name -> source file (relative to src/)
const MODULE_MAP = {
    // Core
    'Logger': 'core/Logger',
    'Registry': 'core/Registry',
    'EventBus': 'core/EventBus',
    'AssetLoader': 'core/AssetLoader',
    'SpriteLoader': 'core/SpriteLoader',
    'Entity': 'core/Entity',
    'entityManager': 'core/EntityManager',
    'EntityManager': 'core/EntityManager',
    'GameState': 'core/State',
    'State': 'core/State',
    'GameRenderer': 'core/GameRenderer',
    'Quadtree': 'core/Quadtree',
    'ResponsiveManager': 'core/ResponsiveManager',
    'PlatformManager': 'core/PlatformManager',
    'Profiler': 'core/Profiler',
    'Component': 'core/Component',
    'InputManager': 'core/InputManager',

    // Data
    'GameConstants': 'data/GameConstants',
    'Events': 'data/GameConstants',
    'VFXConfig': 'data/VFXConfig',
    'RenderConfig': 'data/RenderConfig',
    'SystemConfig': 'data/SystemConfig',
    'WorldData': 'data/WorldData',
    'RoadsData': 'data/RoadsData',

    // Gameplay
    'Hero': 'gameplay/Hero',
    'Dinosaur': 'gameplay/Dinosaur',
    'DinosaurCore': 'gameplay/DinosaurCore',
    'EnemyCore': 'gameplay/EnemyCore',
    'CraftingManager': 'gameplay/CraftingManager',
    'ProgressionSystem': 'gameplay/ProgressionSystem',
    'QuestManager': 'gameplay/QuestManager',
    'Loot': 'gameplay/Loot',
    'LootTable': 'gameplay/LootTable',
    'MountManager': 'gameplay/MountManager',

    // Systems
    'WeatherSystem': 'systems/WeatherSystem',
    'weatherSystem': 'systems/WeatherSystem',
    'TimeSystem': 'systems/TimeSystem',
    'timeSystem': 'systems/TimeSystem',
    'SpawnManager': 'systems/SpawnManager',
    'spawnManager': 'systems/SpawnManager',
    'CombatSystem': 'systems/CombatSystem',
    'CollisionSystem': 'systems/CollisionSystem',
    'EquipmentManager': 'systems/EquipmentManager',
    'ResourceSystem': 'systems/ResourceSystem',
    'resourceSystem': 'systems/ResourceSystem',
    'RestSystem': 'systems/RestSystem',
    'restSystem': 'systems/RestSystem',
    'VFXTriggerService': 'systems/VFXTriggerService',
    'StatusEffectManager': 'systems/StatusEffectManager',

    // Rendering
    'CameraService': 'rendering/Camera',
    'Camera': 'rendering/Camera',
    'WorldRenderer': 'rendering/WorldRenderer',
    'worldRenderer': 'rendering/WorldRenderer',
    'HeroRenderer': 'rendering/HeroRenderer',
    'GridRenderer': 'rendering/GridRenderer',
    'ShadowRenderer': 'rendering/ShadowRenderer',
    'WeaponRenderer': 'rendering/WeaponRenderer',
    'ResourceRenderer': 'rendering/ResourceRenderer',
    'RoadRenderer': 'rendering/RoadRenderer',
    'roadRenderer': 'rendering/RoadRenderer',
    'HomeOutpostRenderer': 'rendering/HomeOutpostRenderer',

    // VFX
    'VFXController': 'vfx/VFXController',
    'VFXSystem': 'vfx/VFXController',
    'ParticleSystem': 'vfx/ParticleSystem',
    'ParticleRenderer': 'vfx/ParticleRenderer',
    'ProjectileVFX': 'vfx/ProjectileVFX',
    'MeleeTrailVFX': 'vfx/MeleeTrailVFX',
    'FloatingText': 'vfx/FloatingText',
    'FloatingTextManager': 'vfx/FloatingText',
    'LightingSystem': 'vfx/LightingSystem',
    'HealthBarRenderer': 'vfx/HealthBarRenderer',
    'ProgressBarRenderer': 'vfx/ProgressBarRenderer',
    'MaterialLibrary': 'vfx/MaterialLibrary',
    'FogOfWarSystem': 'vfx/FogOfWarSystem',
    'Animations': 'vfx/Animations',
    'Tween': 'vfx/Tween',

    // Audio
    'AudioManager': 'audio/AudioManager',
    'ProceduralSFX': 'audio/ProceduralSFX',

    // World
    'IslandManager': 'world/IslandManager',
    'IslandManagerService': 'world/IslandManagerCore',
    'BiomeManager': 'world/BiomeManager',
    'HomeBase': 'world/HomeBase',
    'AmbientSystem': 'world/AmbientSystem',
    'Prop': 'world/Prop',
    'worldZoneManager': 'world/WorldZoneManager',
    'WorldZoneManager': 'world/WorldZoneManager',

    // UI
    'UIManager': 'ui/UIManager',
    'UIManagerService': 'ui/UIManager',
    'ThemeManager': 'ui/ThemeManager',
    'MerchantUI': 'ui/MerchantUI',
    'MerchantPanel': 'ui/MerchantUI',
    'InventoryUI': 'ui/InventoryUI',
    'InventoryPanel': 'ui/InventoryUI',
    'EquipmentUI': 'ui/EquipmentUI',
    'equipmentUIInstance': 'ui/EquipmentUI',
    'EquipmentUIRenderer': 'ui/EquipmentUIRenderer',
    'EquipmentSlotManager': 'ui/EquipmentSlotManager',
    'MinimapSystem': 'ui/MinimapSystem',
    'minimapSystemInstance': 'ui/MinimapSystem',
    'CraftingUI': 'ui/CraftingUI',
    'ForgeUI': 'ui/ForgeUI',
    'DebugUI': 'ui/DebugUI',
    'DialogueUI': 'ui/DialogueUI',
    'HUDController': 'ui/controllers/HUDController',
    'Components': 'ui/Components',
    'ContextActionUI': 'ui/ContextActionUI',
    'ContextActionService': 'ui/ContextActionUI',

    // Entities
    'EntityLoader': 'entities/EntityLoader',

    // Config
    'EnemyConfig': 'config/EnemyConfig',
    'EquipmentStatsConfig': 'config/EquipmentStatsConfig',
    'SetBonusesConfig': 'config/SetBonusesConfig',
    'ItemConfig': 'config/ItemConfig',

    // Persistence
    'persistenceManager': 'persistence/PersistenceManager',
    'PersistenceManager': 'persistence/PersistenceManager',

    // Upgrades
    'IslandUpgrades': 'upgrades/IslandUpgrades',
};

const SRC_DIR = path.join(__dirname, 'src');
let filesModified = 0;
let declaresRemoved = 0;

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

    // Find all declare const statements
    const declareRegex = /declare const (\w+): any;?\r?\n?/g;
    const declares = [];
    let match;

    while ((match = declareRegex.exec(content)) !== null) {
        declares.push(match[1]);
    }

    if (declares.length === 0) return false;

    // Group declares by their source module
    const importsByModule = {};
    const unmapped = [];

    for (const name of declares) {
        const modulePath = MODULE_MAP[name];
        if (modulePath) {
            if (!importsByModule[modulePath]) {
                importsByModule[modulePath] = [];
            }
            if (!importsByModule[modulePath].includes(name)) {
                importsByModule[modulePath].push(name);
            }
        } else {
            unmapped.push(name);
        }
    }

    // Remove declare statements
    content = content.replace(/declare const \w+: any;?\r?\n?/g, '');

    // Remove empty "// Ambient declarations..." comment block if it becomes empty
    content = content.replace(/\/\/ Ambient declarations[^\n]*\r?\n(\r?\n)+/g, '\n');

    // Build import statements
    const imports = [];
    for (const [modulePath, names] of Object.entries(importsByModule)) {
        const relativePath = getRelativePath(filePath, modulePath);
        imports.push(`import { ${names.join(', ')} } from '${relativePath}';`);
    }

    // Add imports after existing imports or at the top after the JSDoc
    if (imports.length > 0) {
        // Find where to insert imports
        const existingImportMatch = content.match(/^import .+;?\r?\n/m);
        const jsdocEndMatch = content.match(/\*\/\r?\n/);

        if (existingImportMatch) {
            // Add after last existing import
            const lastImportMatch = content.match(/^import .+;?\r?\n(?!import)/m);
            if (lastImportMatch) {
                const insertPos = content.lastIndexOf('\nimport ');
                const nextNewline = content.indexOf('\n', insertPos + 1);
                content = content.slice(0, nextNewline + 1) + imports.join('\n') + '\n' + content.slice(nextNewline + 1);
            }
        } else if (jsdocEndMatch) {
            // Add after JSDoc
            const insertPos = content.indexOf('*/') + 2;
            content = content.slice(0, insertPos) + '\n\n' + imports.join('\n') + content.slice(insertPos);
        } else {
            // Add at top
            content = imports.join('\n') + '\n\n' + content;
        }
    }

    // Add unmapped declares back with a TODO comment
    if (unmapped.length > 0) {
        const unmappedDeclares = unmapped.map(n => `declare const ${n}: any; // TODO: Add proper import`).join('\n');
        const insertMatch = content.match(/^import .+;\r?\n(?!import)/m);
        if (insertMatch) {
            const pos = content.lastIndexOf('\nimport ');
            const nextNewline = content.indexOf('\n', pos + 1);
            content = content.slice(0, nextNewline + 1) + '\n// Unmapped modules - need manual import\n' + unmappedDeclares + '\n' + content.slice(nextNewline + 1);
        }
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        declaresRemoved += declares.length;
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
                console.log(`Modified: ${path.relative(SRC_DIR, filePath)}`);
            }
        }
    }
}

console.log('Starting ES Module Migration...');
console.log('Source directory:', SRC_DIR);
walkDir(SRC_DIR);
console.log(`\nComplete! Modified ${filesModified} files, replaced ${declaresRemoved} declare statements.`);
