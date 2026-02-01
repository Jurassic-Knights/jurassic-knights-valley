/**
 * Global TypeScript Declarations
 *
 * This file provides ambient declarations for all global objects
 * that are available at runtime but not imported as ES6 modules.
 */

// Core Systems
declare var Logger: typeof import('../core/Logger').Logger;
declare var EventBus: typeof import('../core/EventBus').EventBus;
declare var Registry: typeof import('../core/Registry').Registry;
declare var GameInstance: import('../core/Game').Game;
declare var Game: typeof import('../core/Game').Game;
declare var GameState: import('../core/GameState').GameState;
declare var GameConstants: typeof import('../data/GameConstants').GameConstants;
declare var Events: typeof import('../data/GameConstants').GameConstants.Events;

// Managers
declare var AssetLoader: typeof import('../core/AssetLoader').AssetLoader;
declare var AudioManager: typeof import('../core/AudioManager').AudioManager;
declare var UIManager: import('../ui/UIManager').UIManagerService;
declare var EntityManager: import('../core/EntityManager').EntityManagerService;
declare var IslandManager: import('../world/IslandManager').IslandManager;
declare var CraftingManager: import('../gameplay/CraftingManager').CraftingManager;
declare var BalanceManager: import('../gameplay/BalanceManager').BalanceManager;
declare var QuestManager: import('../gameplay/QuestManager').QuestManager;
declare var ProgressionSystem: import('../gameplay/ProgressionSystem').ProgressionSystem;
declare var BiomeManager: import('../world/BiomeManager').BiomeManager;
declare var SpawnManager: import('../systems/SpawnManager').SpawnManager;
declare var PathfindingSystem: import('../systems/PathfindingSystem').PathfindingSystem;
declare var EconomySystem: import('../systems/EconomySystem').EconomySystem;
declare var EquipmentSlotManager: import('../ui/EquipmentSlotManager').EquipmentSlotManager;

// Registries
declare var EntityRegistry: typeof import('../entities/EntityLoader').EntityRegistry;
declare var SoundRegistry: typeof import('../audio/SoundRegistry').SoundRegistry;

// Rendering
declare var GameRenderer: typeof import('../core/GameRenderer').GameRenderer;
declare var ShadowRenderer: typeof import('../rendering/ShadowRenderer').ShadowRenderer;
declare var GridRenderer: typeof import('../rendering/GridRenderer').GridRenderer;
declare var DebugOverlays: typeof import('../rendering/DebugOverlays').DebugOverlays;
declare var EntityRenderService: typeof import('../rendering/EntityRenderService').EntityRenderService;
declare var RenderProfiler: typeof import('../rendering/RenderProfiler').RenderProfiler;
declare var EnvironmentRenderer: typeof import('../rendering/EnvironmentRenderer').EnvironmentRenderer;
declare var HeroRenderer: typeof import('../rendering/HeroRenderer').HeroRenderer;
declare var HomeOutpostRenderer: typeof import('../rendering/HomeOutpostRenderer').HomeOutpostRenderer;
declare var EquipmentUIRenderer: typeof import('../ui/EquipmentUIRenderer').EquipmentUIRenderer;
declare var TextureAligner: typeof import('../ui/TextureAligner').TextureAligner;

// VFX
declare var VFXController: import('../vfx/VFXController').VFXSystem;
declare var VFXConfig: typeof import('../data/VFXConfig').VFXConfig;
declare var VFX_Categories: typeof import('../data/VFX_Categories').VFX_Categories;
declare var VFX_Sequences: typeof import('../data/VFX_Sequences').VFX_SEQUENCES;
declare var VFX_Templates: typeof import('../data/VFX_Templates').VFX_TEMPLATES;
declare var ParticleSystem: typeof import('../vfx/ParticleSystem').ParticleSystem;
declare var LightingSystem: import('../vfx/LightingSystem').LightingSystem;

// UI
declare var InventoryUI: import('../ui/InventoryUI').InventoryPanel;
declare var UI_MANIFEST: string[]; // UI Asset Manifest
declare var ThemeManager: import('../ui/ThemeManager').ThemeManagerService;
declare var ForgeController: import('../ui/controllers/ForgeController').ForgeController;
declare var HUDController: import('../ui/controllers/HUDController').HUDController;
declare var UIPanel: typeof import('../ui/core/UIPanel').UIPanel;
declare var LayoutStrategies: typeof import('../ui/responsive/LayoutStrategies').LayoutStrategies;

// Config
declare var PropConfig: typeof import('../config/PropConfig').PropConfig;
declare var WorldData: typeof import('../data/WorldData').WorldData;
declare var BiomeConfig: typeof import('../config/BiomeConfig').BiomeConfig;
declare var RoadsData: typeof import('../data/RoadsData').RoadsData;
declare var EntityConfig: typeof import('../config/EntityConfig').EntityConfig;
declare var ProgressionData: typeof import('../data/ProgressionData').ProgressionData;

// Entities
declare var Enemy: typeof import('../gameplay/EnemyCore').Enemy;
declare var Dinosaur: typeof import('../gameplay/Dinosaur').Dinosaur;
declare var Hero: typeof import('../gameplay/Hero').Hero;
declare var Component: typeof import('../core/Component').Component;
declare var Entity: typeof import('../core/Entity').Entity;
declare var Prop: typeof import('../world/Prop').Prop;
declare var EntityLoader: typeof import('../entities/EntityLoader').EntityLoader;

// External Libraries
declare var gameanalytics: {
    GameAnalytics: {
        setEnabledInfoLog(enabled: boolean): void;
        initialize(gameKey: string, secretKey: string): void;
        addDesignEvent(eventId: string, value?: number): void;
        addErrorEvent(severity: number, message: string): void;
    };
} | undefined;

// Input
declare var InputSystem: import('../input/InputSystem').InputSystem;

// Types
declare var EntityTypes: typeof import('../config/EntityTypes').EntityTypes;

// Environment
declare var ENV: Record<string, string | undefined>;

interface Window {
    EquipmentUIRenderer: typeof import('../ui/EquipmentUIRenderer').EquipmentUIRenderer;
    EquipmentSlotManager: typeof import('../ui/EquipmentSlotManager').EquipmentSlotManager;
    UI_THEME_RUNTIME: Record<string, unknown>;
    UI_MANIFEST: string[];
}

// Browser APIs
interface FileSystemFileHandle {
    kind: 'file' | 'directory';
    name: string;
    getFile(): Promise<File>;
    createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>;
}
declare function showOpenFilePicker(options?: {
    types?: {
        description?: string;
        accept: Record<string, string[]>;
    }[];
    excludeAcceptAllOption?: boolean;
    multiple?: boolean;
}): Promise<FileSystemFileHandle[]>;
