/**
 * Entity Type Definitions
 *
 * Shared interfaces for entity configurations and assets.
 */

export interface UIEntity {
    id: string;
    name: string;
    category: string;
    status: string;
    sourceDescription?: string;
    files?: Record<string, string>;
}

export interface EnemyEntity {
    id: string;
    name: string;
    type?: 'dinosaur' | 'soldier' | 'boss';
    subtype?: string;
    variant?: string;
    biome?: string | string[];
    stats: {
        health: number | string;
        damage: number | string;
        speed: number | string;
        defense?: number | string;
        exp?: number | string;
    };
    behavior?: {
        aggroRange: number;
        chaseSpeed: number;
        attackRange: number;
        attackSpeed?: number;
    };
    combat?: Record<string, number | string | boolean>;
    lootTable?: string;
    loot?: Array<{ item: string; chance: number; min: number; max: number }>;
    files?: Record<string, string>;
    sourceCategory?: string;
    sourceFile?: string;
    sprite?: string;
    tier?: number;
    xpReward?: number | string;
    species?: string;
    weaponType?: string;
    display?: { sizeScale?: number; width?: number; height?: number };
    sfx?: Record<string, string | { id: string }>;
    spawning?: { biomes?: string[]; weight?: number };
    [key: string]: unknown;
}

export interface EquipmentEntity {
    id: string;
    name: string;
    description?: string;
    type?: 'weapon' | 'armor' | 'tool' | 'accessory';
    subtype?: string;
    category?: string;
    equipSlot?: string;
    weaponType?: string;
    weaponSubtype?: string;
    tier: number;
    rarity?: string;
    slot?: string; // For armor/tools
    stats?: Record<string, number | string>;
    files?: Record<string, string>;
    sourceDescription?: string;
    status?: string;
    sourceCategory?: string;
    sourceFile?: string;
    sprite?: string;
    display?: { sizeScale?: number; width?: number; height?: number };
    [key: string]: unknown;
}

export interface NodeEntity {
    id: string;
    name: string;
    sourceCategory?: string;
    sourceFile?: string;
    sprite?: string;
    status?: string;
    files?: Record<string, string>;
    type?: string;
    biome?: string;
    nodeSubtype?: string;
    tier?: number;
    display?: { sizeScale?: number; width?: number; height?: number };
    [key: string]: unknown;
}

export interface NPCEntity {
    id: string;
    name: string;
    sourceCategory?: string;
    sourceFile?: string;
    sprite?: string;
    status?: string;
    files?: Record<string, string>;
    type?: string;
    biome?: string;
    display?: { sizeScale?: number; width?: number; height?: number };
    [key: string]: unknown;
}
