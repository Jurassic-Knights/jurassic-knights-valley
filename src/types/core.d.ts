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
    /** Render hook - called each frame for rendering systems */
    render?(ctx: CanvasRenderingContext2D): void;
    /** Cleanup resources */
    destroy?(): void;
}

// ============================================
// ENTITY INTERFACE
// ============================================

/**
 * Base interface for all game entities
 */
export interface IEntity {
    /** Unique identifier */
    id: string;
    /** Entity type (e.g., 'Enemy', 'Hero', 'Resource') */
    type: string;
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
    /** Sprite image for rendering */
    sprite?: HTMLImageElement | null;
    /** Visual scale multiplier */
    scale?: number;
    /** Update the entity each frame */
    update?(dt: number): void;
    /** Render the entity */
    render?(ctx: CanvasRenderingContext2D): void;
    /** Get Y position for depth sorting */
    getFootY?(): number;
    /** Cleanup resources when entity is removed */
    destroy?(): void;
}

/**
 * Entity with health (enemies, hero, dinosaurs)
 */
export interface ICombatEntity extends IEntity {
    health: number;
    maxHealth: number;
    damage?(amount: number, source?: IEntity): void;
    isDead?(): boolean;
}

/**
 * Entity tied to island grid (resources, nodes, trees)
 */
export interface IResourceEntity extends IEntity {
    islandGridX?: number;
    islandGridY?: number;
    resourceType?: string;
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
    type: string;
    entity?: IEntity;
}
