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
    | 'body'
    | 'hands'
    | 'legs'
    | 'feet'
    | 'weapon'
    | 'weapon1'
    | 'weapon2'
    | 'hand1'
    | 'hand2'
    | 'hand1_alt'
    | 'hand2_alt'
    | 'tool'
    | 'tool_mining'
    | 'tool_woodcutting'
    | 'tool_harvesting'
    | 'tool_fishing'
    | 'accessory'
    | 'accessory2';

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
    /** Source registry file (e.g., 'weapon', 'tool', 'chest') */
    sourceFile?: string;
    /** Weapon specific type (e.g., 'melee', 'ranged', 'shield') */
    weaponType?: string;
    /** Weapon subtype (e.g., 'sword', 'pistol') */
    weaponSubtype?: string;
    /** Grip type (e.g., '1-hand', '2-hand') */
    gripType?: string;
    /** Tool subtype (e.g., 'mining', 'woodcutting') */
    toolSubtype?: string;
    /** Equipped slot Identifier if different from base slot */
    equipSlot?: string;
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
 * Configuration options passed to UIPanel constructor
 */
export interface UIPanelOptions {
    id?: string;
    dockable?: boolean;
    defaultDock?: string;
    modalClass?: string;
    dockedClass?: string;
    visible?: boolean;
    isOpen?: boolean;
    [key: string]: unknown;
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

// ============================================
// QUEST TYPES
// ============================================

export interface IQuest {
    id: string;
    title: string;
    description: string;
    current: number;
    target: number;
    completed: boolean;
    reward?: {
        gold?: number;
        xp?: number;
        items?: string[];
    };
}

// ============================================
// UI COMPONENT TYPES
// ============================================

export interface IUIPanel {
    id: string;
    isDocked?: boolean;
    isOpen: boolean;
    // Config object with defaultDock property
    config: UIPanelOptions;
    applyLayout(mode: 'desktop' | 'mobile'): void;
    open(): void;
    close(): void;
}

// ============================================
// SHARED UI TYPES
// ============================================

export interface IFooterBtnConfig {
    label?: string | null;
    iconId?: string;
    onclick?: ((this: GlobalEventHandlers, ev: PointerEvent) => void) | null;
}

export interface IFooterConfig {
    inventory?: IFooterBtnConfig;
    equip?: IFooterBtnConfig;
    map?: IFooterBtnConfig;
    magnet?: IFooterBtnConfig;
}
