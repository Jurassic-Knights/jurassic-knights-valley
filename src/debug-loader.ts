/**
 * Debug Entry Point - Loads all modules and reports ALL errors
 */

const errors: string[] = [];

async function loadModule(path: string) {
    try {
        await import(path);
        console.log(`✅ ${path}`);
    } catch (e: any) {
        const msg = `❌ ${path}: ${e.message}`;
        console.error(msg);
        errors.push(msg);
    }
}

async function loadAllModules() {
    console.log('=== Debug Module Loader ===');
    console.log('Loading all modules and capturing errors...\n');

    // Core modules
    await loadModule('./core/Logger');
    await loadModule('./core/Registry');
    await loadModule('./core/EventBus');
    await loadModule('./core/State');
    await loadModule('./core/Entity');
    await loadModule('./core/EntityManager');
    await loadModule('./core/AssetLoader');
    await loadModule('./core/GameRenderer');
    await loadModule('./core/Profiler');
    await loadModule('./core/PlatformManager');
    await loadModule('./core/ResponsiveManager');
    await loadModule('./core/Game');

    // Data
    await loadModule('./data/GameConstants');
    await loadModule('./data/BiomeConfig');
    await loadModule('./data/PropConfig');
    await loadModule('./data/VFXConfig');

    // Config
    await loadModule('./config/EntityTypes');
    await loadModule('./config/EnemyConfig');
    await loadModule('./config/EquipmentStatsConfig');
    await loadModule('./config/EquipmentSlotsConfig');
    await loadModule('./config/HeroDefaults');
    await loadModule('./config/SetBonusesConfig');
    await loadModule('./config/SystemConfig');

    // Components
    await loadModule('./components/HealthComponent');
    await loadModule('./components/StatsComponent');
    await loadModule('./components/CombatComponent');
    await loadModule('./components/InventoryComponent');
    await loadModule('./components/AIComponent');

    // Entities
    await loadModule('./entities/EntityLoader');

    // Gameplay
    await loadModule('./gameplay/Hero');
    await loadModule('./gameplay/Resource');
    await loadModule('./gameplay/DroppedItem');
    await loadModule('./gameplay/Merchant');
    await loadModule('./gameplay/Dinosaur');
    await loadModule('./gameplay/EnemyCore');
    await loadModule('./gameplay/Boss');
    await loadModule('./gameplay/CraftingManager');
    await loadModule('./gameplay/IslandUpgrades');
    await loadModule('./gameplay/ProgressionSystem');
    await loadModule('./gameplay/QuestManager');

    // AI
    await loadModule('./ai/behaviors/BaseAI');
    await loadModule('./ai/behaviors/enemies/EnemyAI');
    await loadModule('./ai/behaviors/bosses/BossAI');
    await loadModule('./ai/behaviors/npcs/NPCAI');
    await loadModule('./ai/AISystem');

    // Audio
    await loadModule('./audio/SFX_Core');
    await loadModule('./audio/ProceduralSFX');
    await loadModule('./audio/AudioManager');

    // Systems
    await loadModule('./systems/TimeSystem');
    await loadModule('./systems/WeatherSystem');
    await loadModule('./systems/EconomySystem');
    await loadModule('./systems/EquipmentManager');
    await loadModule('./systems/DamageSystem');
    await loadModule('./systems/HeroSystem');
    await loadModule('./systems/HeroCombatService');
    await loadModule('./systems/DinosaurSystem');
    await loadModule('./systems/EnemySystem');
    await loadModule('./systems/BossSystem');
    await loadModule('./systems/ResourceSystem');
    await loadModule('./systems/PathfindingSystem');
    await loadModule('./systems/InteractionSystem');
    await loadModule('./systems/CombatController');
    await loadModule('./systems/Farming');
    await loadModule('./systems/Mining');

    // Spawners
    await loadModule('./systems/spawners/PropSpawner');
    await loadModule('./systems/spawners/ResourceSpawner');
    await loadModule('./systems/spawners/EnemySpawner');
    await loadModule('./systems/spawners/DropSpawner');
    await loadModule('./systems/SpawnManager');

    // Rendering
    await loadModule('./rendering/WorldRenderer');
    await loadModule('./rendering/RoadRenderer');
    await loadModule('./rendering/HeroRenderer');
    await loadModule('./rendering/DinosaurRenderer');
    await loadModule('./rendering/ResourceRenderer');
    await loadModule('./rendering/EnvironmentRenderer');
    await loadModule('./rendering/ShadowRenderer');
    await loadModule('./rendering/EntityRenderService');
    await loadModule('./rendering/GridRenderer');
    await loadModule('./rendering/DebugOverlays');
    await loadModule('./rendering/RenderProfiler');
    await loadModule('./rendering/HomeOutpostRenderer');

    // Animation
    await loadModule('./animation/Tween');

    // VFX
    await loadModule('./vfx/VFXController');
    await loadModule('./vfx/FloatingText');
    await loadModule('./vfx/LightingSystem');
    await loadModule('./vfx/ParticleRenderer');
    await loadModule('./vfx/MaterialLibrary');
    await loadModule('./vfx/weather/RainVFX');
    await loadModule('./vfx/weather/SnowVFX');

    // World
    await loadModule('./world/IslandManagerCore');
    await loadModule('./world/HomeBase');
    await loadModule('./world/AmbientSystem');
    await loadModule('./vfx/FogOfWarSystem');

    // Input
    await loadModule('./input/InputSystem');

    // UI Core
    await loadModule('./ui/core/UIPanel');
    await loadModule('./ui/Components');

    // UI
    await loadModule('./ui/UIManager');
    await loadModule('./ui/InventoryUI');
    await loadModule('./ui/EquipmentUI');
    await loadModule('./ui/EquipmentUIRenderer');
    await loadModule('./ui/MerchantUI');
    await loadModule('./ui/ContextActionUI');
    await loadModule('./ui/DebugUI');
    await loadModule('./ui/ThemeManager');
    await loadModule('./ui/TextureAligner');
    await loadModule('./ui/UICapture');
    await loadModule('./ui/responsive/LayoutStrategies');

    // UI Controllers
    await loadModule('./ui/controllers/ForgeController');
    await loadModule('./ui/controllers/HUDController');

    // Print summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total errors: ${errors.length}`);
    if (errors.length > 0) {
        console.log('\nAll errors:');
        errors.forEach(e => console.log(e));
    }
}

loadAllModules();
