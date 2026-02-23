/**
 * Global TypeScript Declarations
 *
 * This file provides ambient declarations for all global objects
 * that are available at runtime but not imported as ES6 modules.
 */

// Core Systems
declare let Logger: typeof import('../core/Logger').Logger;
declare let EventBus: typeof import('../core/EventBus').EventBus;
declare let Registry: typeof import('../core/Registry').Registry;
declare let GameInstance: import('../core/Game').Game;
declare let Game: typeof import('../core/Game').Game;
declare let GameState: import('../core/GameState').GameState;
declare let GameConstants: typeof import('../data/GameConstants').GameConstants;
declare let Events: typeof import('../data/GameConstants').GameConstants.Events;

// Managers
declare let AssetLoader: typeof import('../core/AssetLoader').AssetLoader;
declare let AudioManager: typeof import('../core/AudioManager').AudioManager;
declare let UIManager: import('../ui/UIManager').UIManagerService;
declare let EntityManager: import('../core/EntityManager').EntityManagerService;
declare let WorldManager: import('../world/WorldManager').WorldManager;
declare let CraftingManager: import('../gameplay/CraftingManager').CraftingManager;
declare let BalanceManager: import('../gameplay/BalanceManager').BalanceManager;
declare let QuestManager: import('../gameplay/QuestManager').QuestManager;
declare let ProgressionSystem: import('../gameplay/ProgressionSystem').ProgressionSystem;
declare let BiomeManager: import('../world/BiomeManager').BiomeManager;
declare let PathfindingSystem: import('../systems/PathfindingSystem').PathfindingSystem;
declare let EconomySystem: import('../systems/EconomySystem').EconomySystem;
declare let EquipmentSlotManager: import('../ui/EquipmentSlotManager').EquipmentSlotManager;

// Registries
declare let EntityRegistry: typeof import('../entities/EntityLoader').EntityRegistry;
declare let SoundRegistry: typeof import('../audio/SoundRegistry').SoundRegistry;

// Rendering
declare let GameRenderer: typeof import('../core/GameRenderer').GameRenderer;
declare let ShadowRenderer: typeof import('../rendering/ShadowRenderer').ShadowRenderer;
declare let GridRenderer: typeof import('../rendering/GridRenderer').GridRenderer;
declare let DebugOverlays: typeof import('../rendering/DebugOverlays').DebugOverlays;
declare let EntityRenderService: typeof import('../rendering/EntityRenderService').EntityRenderService;
declare let RenderProfiler: typeof import('../rendering/RenderProfiler').RenderProfiler;
declare let EnvironmentRenderer: typeof import('../rendering/EnvironmentRenderer').EnvironmentRenderer;
declare let HeroRenderer: typeof import('../rendering/HeroRenderer').HeroRenderer;
declare let HomeOutpostRenderer: typeof import('../rendering/HomeOutpostRenderer').HomeOutpostRenderer;
declare let EquipmentUIRenderer: typeof import('../ui/EquipmentUIRenderer').EquipmentUIRenderer;
declare let TextureAligner: typeof import('../ui/TextureAligner').TextureAligner;

// VFX
declare let VFXController: import('../vfx/VFXController').VFXSystem;
declare let VFXConfig: typeof import('../data/VFXConfig').VFXConfig;
declare let VFX_Categories: typeof import('../data/VFX_Categories/index').VFX_Categories;
declare let VFX_Sequences: typeof import('../data/VFX_Sequences').VFX_SEQUENCES;
declare let VFX_Templates: typeof import('../data/VFX_Templates').VFX_TEMPLATES;
declare let ParticleSystem: typeof import('../vfx/ParticleSystem').ParticleSystem;
declare let LightingSystem: import('../vfx/LightingSystem').LightingSystem;

// UI
declare let InventoryUI: import('../ui/InventoryUI').InventoryPanel;
declare let UI_MANIFEST: string[]; // UI Asset Manifest
declare let ThemeManager: import('../ui/ThemeManager').ThemeManagerService;
declare let ForgeController: import('../ui/controllers/ForgeController').ForgeController;
declare let HUDController: import('../ui/controllers/HUDController').HUDController;
declare let UIPanel: typeof import('../ui/core/UIPanel').UIPanel;
declare let LayoutStrategies: typeof import('../ui/responsive/LayoutStrategies').LayoutStrategies;

// Config
declare let PropConfig: typeof import('../config/PropConfig').PropConfig;
declare let WorldData: typeof import('../data/WorldData').WorldData;
declare let BiomeConfig: typeof import('../config/BiomeConfig').BiomeConfig;
declare let RoadsData: typeof import('../data/RoadsData').RoadsData;
declare let EntityConfig: typeof import('../config/EntityConfig').EntityConfig;
declare let ProgressionData: typeof import('../data/ProgressionData').ProgressionData;

// Entities
declare let Enemy: typeof import('../gameplay/EnemyCore').Enemy;
declare let Dinosaur: typeof import('../gameplay/Dinosaur').Dinosaur;
declare let Hero: typeof import('../gameplay/Hero').Hero;
declare let Component: typeof import('../core/Component').Component;
declare let Entity: typeof import('../core/Entity').Entity;
declare let Prop: typeof import('../world/Prop').Prop;
declare let EntityLoader: typeof import('../entities/EntityLoader').EntityLoader;

// External Libraries
declare let gameanalytics: {
    GameAnalytics: {
        setEnabledInfoLog(enabled: boolean): void;
        configureBuild(build: string): void;
        initialize(gameKey: string, secretKey: string): void;
        addDesignEvent(eventId: string, value?: number): void;
        addErrorEvent(severity: number, message: string): void;
        addProgressionEvent(status: number, area: string, step?: string): void;
        addResourceEvent(flowType: number, currency: string, amount: number, itemType: string, itemId: string): void;
    };
    EGAProgressionStatus: Record<string, number>;
    EGAResourceFlowType: Record<string, number>;
    EGAErrorSeverity: Record<string, number>;
} | undefined;

// Input
declare let InputSystem: import('../input/InputSystem').InputSystem;

// Types
declare let EntityTypes: typeof import('../config/EntityTypes').EntityTypes;

// Environment
declare let ENV: Record<string, string | undefined>;

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
