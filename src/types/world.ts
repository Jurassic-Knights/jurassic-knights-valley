/**
 * World TypeScript Interfaces
 * 
 * Types for islands, bridges, bounds, and world geometry.
 */

// ============================================
// GEOMETRY PRIMITIVES
// ============================================

/**
 * Rectangular bounds
 */
export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * 2D point
 */
export interface Point {
    x: number;
    y: number;
}

// ============================================
// ISLAND TYPES
// ============================================

/**
 * Island type string literals
 */
export type IslandType = 'home' | 'normal' | 'dinosaur' | 'resource' | 'boss' | 'locked' | 'special';

/**
 * Island category
 */
export type IslandCategory = 'home' | 'resource' | 'dinosaur' | 'boss' | 'quest';

/**
 * Island definition (matches IslandManagerCore data structure)
 */
export interface Island {
    /** Grid X coordinate (0-based) */
    gridX: number;
    /** Grid Y coordinate (0-based) */
    gridY: number;
    /** Island type */
    type: IslandType;
    /** Island category (from WorldData, can be dynamic) */
    category?: string;
    /** Display name */
    name?: string;
    /** Whether island is unlocked */
    unlocked: boolean;
    /** World X position */
    worldX: number;
    /** World Y position */
    worldY: number;
    /** Island width */
    width: number;
    /** Island height */
    height: number;
    /** Cost to unlock (in gold) */
    unlockCost?: number;
    /** Connected biome ID */
    biomeId?: string;
    /** Resource type for resource islands */
    resourceType?: string;
}

/**
 * Walkable zone for collision detection
 */
export interface WalkableZone {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'island' | 'bridge';
    sourceIsland?: Island;
}

/**
 * Collision block for walls/obstacles
 */
export interface CollisionBlock {
    x: number;
    y: number;
    width: number;
    height: number;
}

// ============================================
// BRIDGE TYPES
// ============================================

/**
 * Bridge direction
 */
export type BridgeDirection = 'horizontal' | 'vertical';

/**
 * Bridge connecting two islands (matches IslandManagerCore structure)
 */
export interface Bridge {
    /** World X position */
    x: number;
    /** World Y position */
    y: number;
    /** Bridge width */
    width: number;
    /** Bridge height */
    height: number;
    /** Bridge type (orientation) */
    type: 'horizontal' | 'vertical';
    /** Source island grid coordinates */
    from: { col: number; row: number };
    /** Destination island grid coordinates */
    to: { col: number; row: number };
}

/**
 * Walkable zone with ID (extended from collision check)
 */
export interface WalkableZoneWithId extends WalkableZone {
    id: string;
}

/**
 * Collision block with metadata
 */
export interface CollisionBlockWithMeta extends CollisionBlock {
    type?: string;
    edge?: 'top' | 'bottom' | 'left' | 'right';
    zoneId?: string;
}

/**
 * Playable bounds (inside walls)
 */
export interface PlayableBounds extends Bounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

// ============================================
// UNLOCK TRIGGER
// ============================================

/**
 * Trigger zone for unlocking islands
 */
export interface UnlockTrigger {
    /** Target island grid X */
    gridX: number;
    /** Target island grid Y */
    gridY: number;
    /** Trigger zone bounds */
    bounds: Bounds;
    /** Cost to unlock */
    cost: number;
    /** Island reference */
    island: Island;
}
