/**
 * Global type declarations for Jurassic Knights: Valley
 * These declare the global window properties used throughout the codebase
 */

interface Window {
    // Core Systems
    Registry: any;
    EventBus: any;
    Logger: any;
    GameConstants: any;

    // Asset Management
    AssetLoader: any;
    MaterialLibrary: any;

    // Game Systems
    GameRenderer: any;
    GameState: any;
    HeroSystem: any;
    IslandManager: any;
    CombatController: any;
    SpawnManager: any;
    PathfindingSystem: any;
    DinosaurSystem: any;
    EnemySystem: any;
    ResourceSystem: any;
    EconomySystem: any;
    InteractionSystem: any;
    RestSystem: any;
    TimeSystem: any;
    WeatherSystem: any;
    BossSystem: any;
    EquipmentManager: any;

    // VFX Systems
    VFXController: any;
    VFXConfig: any;
    ParticleSystem: any;
    ParticleRenderer: any;
    FloatingText: any;
    FloatingTextManager: any;
    ProjectileVFX: any;
    MeleeTrailVFX: any;
    LightingSystem: any;
    FogOfWarSystem: any;

    // Rendering
    WorldRenderer: any;
    HeroRenderer: any;
    EnvironmentRenderer: any;
    RoadRenderer: any;
    WeaponRenderer: any;
    DinosaurRenderer: any;
    ResourceRenderer: any;

    // UI
    UIManager: any;
    InventoryUI: any;
    MerchantUI: any;
    EquipmentUI: any;
    ForgeController: any;
    ThemeManager: any;

    // Audio
    AudioManager: any;
    ProceduralSFX: any;

    // Configuration
    ColorPalette: any;
    RenderConfig: any;
    EntityConfig: any;
    EntityLoader: any;

    // Input
    InputSystem: any;

    // World
    HomeBase: any;
    BiomeManager: any;

    // Entities
    Hero: any;
    Entity: any;
    Dinosaur: any;
    Resource: any;
    Merchant: any;
    Boss: any;
}
