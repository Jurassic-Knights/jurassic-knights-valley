/**
 * SystemLoader - Central import file for all game systems
 * 
 * This file imports all game systems to ensure their module-level
 * registration code executes and registers them with the Registry.
 * 
 * This is required because ES modules only execute when imported.
 * Without this file, systems would not be found by Game.getSystem().
 */

// Core Systems
import './core/ResponsiveManager';
import './core/AssetLoader';
import './core/PlatformManager';
import './core/State';
import './core/EntityManager';
import './core/GameRenderer';

// Audio - Import early to register all SFX handlers
import './audio/SFXLoader';

// Entity Loading
import './entities/EntityLoader';

// Input
import './input/InputSystem';
import './input/adapters/KeyboardAdapter'; // Must be after InputSystem to register adapter

// Systems - Time & Environment
import './systems/TimeSystem';
import './systems/WeatherSystem';

// Systems - Economy & Gameplay
import './systems/EconomySystem';
import './gameplay/CraftingManager';
import './gameplay/QuestManager';

// Systems - World (BiomeManager, WorldManager registered as WorldManager)
import './world/BiomeManager';
import './world/WorldManager';
import './world/MapObjectSpawner';
import './world/HomeBase';
import './world/AmbientSystem';
import './systems/DinosaurSystem';
import './systems/EnemySystem';
import './gameplay/EnemyBehavior'; // Attach prototype methods to Enemy after class is loaded
import './gameplay/EnemyRender'; // Attach render methods to Enemy prototype
import './systems/ResourceSystem';

// Systems - Interaction & Rest
import './systems/InteractionSystem';
import './systems/RestSystem';

// Systems - Combat & Progression
import './systems/DamageSystem';
import './systems/CollisionSystem'; // Core Physics
import './gameplay/ProgressionSystem';
import './systems/CombatController';
import './ui/controllers/ForgeController';
import './systems/BossSystem';



// Rendering
import './rendering/WorldRenderer';
import './rendering/RoadRenderer';
import './rendering/EnvironmentRenderer';
import './vfx/LightingSystem';
import './vfx/FogOfWarSystem';
import './vfx/VFXController';
import './vfx/ProgressBarRenderer';
import './rendering/HeroRenderer'; // Required for hero visibility

// UI
import './ui/UIManager';
import './ui/InventoryUI';
import './ui/EquipmentUI';
import './ui/MinimapSystem';
import './ui/DebugUI';

// VFX (VFXSystem registered via ProjectileVFX/MeleeTrailVFX imports)
import './vfx/ProjectileVFX';
import './vfx/MeleeTrailVFX';
import './vfx/FloatingText';

// Systems - Hero (must be late for dependencies)
import './systems/HeroSystem';
import './systems/HeroVisualsSystem';

console.log('[SystemLoader] All systems imported for registration');
