/**
 * UI TypeScript Interfaces
 * 
 * Types for UI components, equipment, and inventory.
 */

// ============================================
// EQUIPMENT TYPES
// ============================================

/**
 * Equipment slot identifiers
 */
export type EquipmentSlot =
    | 'head'
    | 'chest'
    | 'hands'
    | 'legs'
    | 'feet'
    | 'weapon1'
    | 'weapon2'
    | 'tool';

/**
 * Equipment item
 */
export interface EquipmentItem {
    /** Unique item ID */
    id: string;
    /** Display name */
    name: string;
    /** Item description */
    description?: string;
    /** Equipment slot */
    slot: EquipmentSlot;
    /** Item tier (1-5) */
    tier: number;
    /** Item type category */
    type: 'armor' | 'weapon' | 'tool' | 'accessory';
    /** Subtype (e.g., 'sword', 'pistol', 'helmet') */
    subtype?: string;
    /** Stats provided by item */
    stats?: ItemStats;
    /** Sprite ID for rendering */
    spriteId?: string;
    /** Whether item is equipped */
    equipped?: boolean;
    /** Quantity (for stackables) */
    quantity?: number;
}

/**
 * Item stats
 */
export interface ItemStats {
    damage?: number;
    defense?: number;
    armor?: number;
    speed?: number;
    health?: number;
    stamina?: number;
    critChance?: number;
    critDamage?: number;
    range?: number;
    attackSpeed?: number;
}

// ============================================
// INVENTORY TYPES
// ============================================

/**
 * Resource item in inventory
 */
export interface ResourceItem {
    id: string;
    name: string;
    quantity: number;
    icon?: string;
    category?: 'material' | 'food' | 'currency' | 'quest';
}

/**
 * Player inventory
 */
export interface Inventory {
    gold: number;
    equipment: EquipmentItem[];
    resources: ResourceItem[];
    capacity: number;
}

// ============================================
// UI PANEL TYPES
// ============================================

/**
 * UI panel configuration
 */
export interface UIPanelConfig {
    id: string;
    visible: boolean;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    isDocked?: boolean;
    isOpen?: boolean;
    config?: Record<string, unknown>;
    close?: () => void;
}

/**
 * Merchant item for sale
 */
export interface MerchantItem {
    id: string;
    name: string;
    price: number;
    stock: number;
    item: EquipmentItem | ResourceItem;
}

/**
 * Merchant NPC
 */
export interface Merchant {
    id: string;
    name: string;
    items: MerchantItem[];
    position: { x: number; y: number };
}
