/**
 * Global TypeScript Declarations
 *
 * This file provides ambient declarations for all global objects
 * that are available at runtime but not imported as ES6 modules.
 */

// Core Systems
// declare var Logger: any;
// declare var EventBus: any;
// declare var Registry: any;
// declare var GameInstance: any;
// declare var Game: any;
declare var GameState: any;
declare var GameConstants: any;
declare var Events: any;

// Managers
declare var AssetLoader: any;
declare var AudioManager: any;
declare var UIManager: any;
declare var EntityManager: any;
declare var IslandManager: any;
declare var CraftingManager: any;
declare var BalanceManager: any;
declare var QuestManager: any;
declare var ProgressionSystem: any;
declare var BiomeManager: any;
declare var SpawnManager: any;
declare var PathfindingSystem: any;
declare var EconomySystem: any;
declare var EquipmentSlotManager: any;

// Registries
declare var EntityRegistry: any;
declare var SoundRegistry: any;

// Rendering
declare var GameRenderer: any;
declare var ShadowRenderer: any;
declare var GridRenderer: any;
declare var DebugOverlays: any;
declare var EntityRenderService: any;
declare var RenderProfiler: any;
declare var EnvironmentRenderer: any;
declare var HeroRenderer: any;
declare var HomeOutpostRenderer: any;
declare var EquipmentUIRenderer: any;
declare var TextureAligner: any;

// VFX
declare var VFXController: any;
declare var VFXConfig: any;
declare var VFX_Categories: any;
declare var VFX_Sequences: any;
declare var VFX_Templates: any;
declare var ParticleSystem: any;
declare var LightingSystem: any;

// UI
declare var InventoryUI: any;
declare var UI_THEME_RUNTIME: any;
declare var UI_MANIFEST: any;
declare var ThemeManager: any;
declare var ForgeController: any;
declare var HUDController: any;
declare var UIPanel: any;
declare var LayoutStrategies: any;

// Config
declare var PropConfig: any;
declare var WorldData: any;
declare var BiomeConfig: any;
declare var RoadsData: any;
declare var EntityConfig: any;
declare var ProgressionData: any;

// Entities
declare var Enemy: any;
declare var Dinosaur: any;
declare var Hero: any;
declare var Component: any;
declare var Entity: any;
declare var Prop: any;
declare var EntityLoader: any;

// External Libraries
declare var gameanalytics: any;

// Input
declare var InputSystem: any;

// Types
declare var EntityTypes: any;

// Environment
declare var ENV: any;

// Browser APIs
declare function showOpenFilePicker(options?: any): Promise<any>;
