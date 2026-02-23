/**
 * Core TypeScript Interfaces
 *
 * Proper type definitions for core game systems, replacing `any` types.
 */

// ============================================
// SYSTEM INTERFACE
// ============================================

/**
 * Base interface for all game systems
 * Systems are registered with the Registry and managed by the Game
 */
export interface ISystem {
    /** Initialize the system with game reference */
    init?(game: IGame): void | boolean | Promise<boolean>;
    /** Start lifecycle hook - called after all systems are initialized */
    start?(): void;
    /** Update loop - called each frame with delta time in ms */
    update?(dt: number): void;
    /** Cleanup resources */
    destroy?(): void;
}

// ============================================
// ENTITY INTERFACE
// ============================================

// --- Supporting Configuration Interfaces ---

export interface LootTableEntry {
    item: string;
    chance: number;
    min: number;
    max: number;
}

export interface EntityDisplayConfig {
    sizeScale?: number;
    width?: number;
    height?: number;
    shadow?: {
        offsetX: number;
        offsetY: number;
        radius: number;
        color?: string;
    };
    [key: string]: unknown;
}

export interface IEquipmentManager {
    getStatBonus(stat: string): number;
    getSlot(slot: string): unknown;
    equip(slot: string, item: unknown): boolean;
    unequip(slot: string): unknown | null;
}

export interface EntitySpawnConfig {
    biomes?: string[];
    weight?: number;
    groupSize?: number[];
    respawnTime?: number;
    variance?: number;
    minDist?: number;
}

export interface EntitySFXConfig {
    [key: string]: string | { id: string; volume?: number; pitch?: number; loop?: boolean };
}

export interface EntityVFXConfig {
    [key: string]: string | { id: string; offset?: { x: number; y: number }; scale?: number };
}

export interface EntityConfig {
    id?: string;
    entityType?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    color?: string;
    sprite?: string;
    collision?: {
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
            offsetX?: number;
            offsetY?: number;
        };
        layer?: number;
        mask?: number;
        isTrigger?: boolean;
    };
    // Shared optional properties across entities
    name?: string;
    tier?: number;
    category?: string;
    biome?: string;
    biomeId?: string;
    scale?: number;
    threatLevel?: number;
    respawnTime?: number;
    lootTableId?: string;
    glowColor?: string;
    enemyType?: string;
    isBoss?: boolean;
    isElite?: boolean;
    forceNormal?: boolean;
    abilities?: Array<{ id: string; name: string; cooldown?: number;[key: string]: unknown }>;
    // Enhanced properties for loader
    assets?: {
        sprite?: string;
        sfx?: EntitySFXConfig;
        vfx?: EntityVFXConfig;
    };
    spawning?: EntitySpawnConfig;
    stats?: Record<string, number>;
    combat?: Record<string, number | string | boolean>;
    loot?: LootTableEntry[];
    display?: EntityDisplayConfig;
    sourceFile?: string; // For tracing origin (e.g. tracking items vs resources)
    registryId?: string; // Registry key for entity lookup
    [key: string]: unknown; // Changed from any to unknown for safer type narrowing
}

/**
 * Base interface for all game entities
 */
export interface IEntity {
    /** Unique identifier */
    id: string;
    /** Entity type (e.g., 'Enemy', 'Hero', 'Resource') */
    type: string;
    /** Entity type (alternative property name) */
    entityType?: string;
    /** AI behavior strategy mapping ID */
    aiType?: string;
    /** Original Registry ID for hot-reloading */
    registryId?: string;
    /** World X position */
    x: number;
    /** World Y position */
    y: number;
    /** Width for collision/rendering */
    width: number;
    /** Height for collision/rendering */
    height: number;
    /** Whether entity is active */
    active: boolean;
    lootTableId?: string;

    /** Sprite image ID for rendering */
    sprite?: string | null;
    /** Visual scale multiplier */
    scale?: number;

    // Combat Properties (Optional)
    health?: number;
    maxHealth?: number;
    defense?: number;
    xpReward?: number;

    // Common optional properties used by various systems
    /** Entity state (e.g., 'idle', 'attacking', 'dead') */
    state?: string;
    /** Component container */

    /** Biome the entity belongs to */
    biomeId?: string;
    /** Group ID for pack behavior */
    groupId?: string | null;
    /** Whether entity uses pack aggro */
    packAggro?: boolean;
    /** Distance to another entity */
    distanceTo?(other: IEntity): number;

    // Common methods
    /** Update the entity each frame */
    update?(dt: number): void;
    /** Render the entity */
    render?(ctx: CanvasRenderingContext2D): void;
    /** Render UI overlays (health bars, etc.) */
    renderUI?(ctx: CanvasRenderingContext2D): void;
    /** Render health bar directly */
    renderHealthBar?(ctx: CanvasRenderingContext2D): void;
    /** Get Y position for depth sorting */
    getFootY?(): number;
    /** Cleanup resources when entity is removed */
    destroy?(): void;
    /** Check if entity is dead - can be boolean property or method */
    isDead?: boolean | (() => boolean);
    /** Check if entity can be picked up by another */
    canBePickedUpBy?(entity: IEntity): boolean;
    /** Magnetize the entity toward a target */
    magnetize?(target: IEntity): void;
    /** Check if entity should auto-magnetize - can be method with optional parameter */
    shouldAutoMagnetize?(hero?: IEntity): boolean;
    /** Check if entity is magnetized - can be boolean property or method */
    isMagnetized?: boolean | (() => boolean);
    /** Recalculate respawn timer (for resources) */
    recalculateRespawnTimer?(): void;
    /** Resource type for resources/items */
    resourceType?: string;
    /** Whether entity is currently being attacked */
    isBeingAttacked?: boolean;
    /** Spawn X position (for leash calculations) */
    spawnX?: number;
    /** Spawn Y position (for leash calculations) */
    spawnY?: number;
    /** Current chase/attack target */
    target?: IEntity | null;
    /** Current stamina */
    stamina?: number;
    /** Maximum stamina */
    maxStamina?: number;
    /** Equipment system reference (has getStatBonus, getSlot methods) */
    equipment?: IEquipmentManager;
    /** Inventory properties */
    inventory?: Record<string, number>;
    /** Whether entity is at home outpost */
    isAtHomeOutpost?: boolean;
    /** Whether entity is locked (cannot move) */
    locked?: boolean;
    /** Previous X position for movement delta */
    prevX?: number;
    /** Previous Y position for movement delta */
    prevY?: number;
    /** Movement speed */
    speed?: number;
    /** Input move vector (for hero) */
    inputMove?: { x: number; y: number };
    /** Footstep timer for VFX */
    footstepTimer?: number;
    /** Footstep interval for VFX */
    footstepInterval?: number;
    /** Component container for health, etc. */
    /** Component container for health, etc. */
    components?: IComponents;

    /** Specific entity subtypes for identification */
    enemyType?: string;
    dinoType?: string;
    bossType?: string;
    itemType?: string;
    spriteId?: string;

    /** Refresh configuration from registry (optional) */
    refreshConfig?(): void;
}

/**
 * Entity with health (enemies, hero, dinosaurs)
 */
export interface ICombatEntity extends IEntity {
    health: number;
    maxHealth: number;
    takeDamage?(amount: number, source?: IEntity): void;
    isDead?: boolean;
}

/**
 * AI Specific Entity Extensions for Strict Type Checking
 */
export interface INpcEntity extends IEntity {
    interactRadius?: number;
    playerNearby?: boolean;
    facingRight?: boolean;
    patrolPoints?: { x: number; y: number }[];
    patrolIndex?: number;
    patrolWait?: number;
    patrolWaitTime?: number;
}

export interface IEnemyEntity extends ICombatEntity {
    enemyName?: string;
    attackRate?: number;
    attackRange?: number;
    attackCooldown?: number;
    damage?: number;
    attackType?: string;
    aggroRange?: number;
    leashDistance?: number;
    wanderTimer?: number;
    wanderTarget?: { x: number; y: number } | null;
    wanderInterval?: number;
    patrolRadius?: number;
    moveAlongPath?(targetX: number, targetY: number, speed: number, dt: number): boolean;
}

export interface IBossEntity extends IEnemyEntity {
    phase?: number;
    abilityCooldown?: number;
    abilityTimer?: number;
    currentAbility?: string;
    isEnraged?: boolean;
    abilities?: string[];
}

/**
 * Entity tied to island grid (resources, nodes, trees)
 */
export interface IResourceEntity extends IEntity {
    resourceType?: string;
    respawnTimer?: number;
    recalculateRespawnTimer?(): void;
}

// ============================================
// GAME INTERFACE
// ============================================

/**
 * Main game controller interface
 */
export interface IGame {
    /** Get a registered system by name */
    getSystem<T extends ISystem>(name: string): T | null;
    /** The player hero entity */
    hero: IEntity | null;
    /** Whether the game loop is running */
    isRunning?: boolean;
    /** Initialize the game */
    init(): Promise<boolean>;
    /** Start the game loop */
    start(): void;
    /** Stop the game loop */
    stop(): void;
}

// ============================================
// EVENT BUS TYPES
// ============================================

export type EventCallback<T = unknown> = (data: T) => void;

export interface IEventBus {
    on<T = unknown>(eventName: string, callback: EventCallback<T>): void;
    off<T = unknown>(eventName: string, callback: EventCallback<T>): void;
    emit<T = unknown>(eventName: string, data?: T): void;
}

// ============================================
// REGISTRY TYPES
// ============================================

export interface IRegistry {
    register(name: string, instance: ISystem): void;
    get<T extends ISystem>(name: string): T | null;
    getAll(): Map<string, ISystem>;
}

// ============================================
// STATE TYPES
// ============================================

export type StateCallback<T = unknown> = (newValue: T, oldValue?: T) => void;
export type GlobalStateCallback<T = unknown> = (key: string, newValue: T, oldValue?: T) => void;

export interface IState {
    get<T = unknown>(key: string): T | undefined;
    set<T = unknown>(key: string, value: T): void;
    subscribe<T = unknown>(key: string, callback: StateCallback<T>): void;
    unsubscribe<T = unknown>(key: string, callback: StateCallback<T>): void;
}

// ============================================
// RENDERING TYPES
// ============================================

export interface IViewport {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface IRenderer {
    init(game: IGame): boolean;
    render(): void;
    resize(): void;
}

// ============================================
// COMPONENT TYPES
// ============================================

export interface IComponent {
    parent: IEntity | null;
    active: boolean;
    init?(): void;
    update?(dt: number): void;
    destroy?(): void;
}

export interface HealthComponent extends IComponent {
    health: number;
    maxHealth: number;
    getMaxHealth?(): number;
    damage?(amount: number): void;
    heal?(amount: number): void;
    isDead: boolean;
}

export interface StatsComponent extends IComponent {
    level?: number;
    xp?: number;
    nextLevelXp?: number;
    strength?: number;
    dexterity?: number;
    constitution?: number;
    intelligence?: number;
    speed?: number;
    attack?: number;
    defense?: number;
    maxStamina?: number;
    stamina?: number;
    getXPForLevel?(level: number): number;
    getStat?(name: string): number;
    getDefense?(): number;
    getAttack?(): number;
    getCritChance?(): number;
    getWeaponRange?(slotId: string): number;
}

export interface InventoryComponent extends IComponent {
    items: Record<string, number>;
    gold?: number;
    capacity?: number;
    add?(itemId: string, amount?: number): boolean | void;
    remove?(itemId: string, amount?: number): boolean | void;
    has?(itemId: string, amount?: number): boolean;
}

export interface CombatComponent extends IComponent {
    attackDamage?: number;
    attackRange?: number;
    attackSpeed?: number;
    rate?: number;
    range?: number;
    staminaCost?: number;
    cooldownTimer?: number;
    startAttack?(target: IEntity): void;
    stopAttack?(): void;
    canAttack?: boolean;
    attack?(): boolean;
    damage?: number;
    update?(dt: number): void;
}

export interface AIComponent extends IComponent {
    state: string;
    target: IEntity | null;
    update(dt: number): void;
    canAggro(target: IEntity): boolean;
    setState(state: string): void;
    wanderTimer?: number;
    randomizeWander?(): void;
    wanderDirection?: { x: number; y: number };
    shouldLeash?(): boolean;
    inAttackRange?(target: IEntity): boolean;
}

export interface IComponents {
    health?: HealthComponent;
    stats?: StatsComponent;
    inventory?: InventoryComponent;
    combat?: CombatComponent;
    ai?: AIComponent;
    [key: string]: IComponent | undefined; // Allow loose components for now, but strictly typed where known
}
