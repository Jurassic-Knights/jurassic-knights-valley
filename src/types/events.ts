import type { IEntity } from './core';

/**
 * Global application event map for the EventBus.
 * Keys are event string names, values are the strictly typed payload expected.
 */
export interface AppEventMap {
    // ---- Input & Player Action Events ----
    'INPUT_MOVE': { x: number; y: number };
    'INPUT_INTENT': { action: string; active: boolean };
    'INPUT_ACTION': { action: string };

    'HERO_MOVE': { x: number; y: number };
    'HERO_ATTACK': { targetId?: string; weaponId?: string };
    'HERO_HEALTH_CHANGE': { hero: IEntity; health: number; maxHealth: number };
    'HERO_STAMINA_CHANGE': { hero: IEntity; stamina: number; maxStamina: number };
    'HERO_HOME_STATE_CHANGE': { isAtHome: boolean };
    'HERO_LEVEL_UP': { hero: IEntity; newLevel: number };
    'XP_GAINED': { amount: number };
    'HERO_DIED': { hero: IEntity; killer?: IEntity };
    'HERO_RESPAWNED': { hero: IEntity };

    // ---- Entity Events ----
    'ENTITY_ADDED': { entity: IEntity };
    'ENTITY_REMOVED': { entity: IEntity };
    'ENTITY_MOVE_REQUEST': { entity: IEntity; dx: number; dy: number; force?: boolean };
    'ENTITY_DAMAGED': { entity: IEntity; amount: number; source?: IEntity; isCrit?: boolean };
    'ENTITY_DIED': { entity: IEntity; killer?: IEntity };
    'ENTITY_HEALTH_CHANGE': { entity: IEntity; health: number; maxHealth: number };
    'DAMAGE_DEALT': { source: IEntity; target: IEntity; amount: number };

    // ---- Enemy Events ----
    'ENEMY_ATTACK': { attacker: IEntity; target: IEntity };
    'ENEMY_DAMAGED': { enemy: IEntity; amount: number; source?: IEntity };
    'ENEMY_DIED': { enemy: IEntity; killer?: IEntity };
    'ENEMY_KILLED': { enemy: IEntity; killer?: IEntity };
    'ENEMY_AGGRO': { enemy: IEntity; target: IEntity };
    'ENEMY_LEASH': { enemy: IEntity };
    'ENEMY_RESPAWNED': { enemy: IEntity };
    'BOSS_SPAWNED': { boss: IEntity };
    'BOSS_KILLED': { boss: IEntity };

    // ---- Inventory & Economy ----
    'INVENTORY_UPDATED': Record<string, number> | undefined;
    'ITEM_COLLECTED': { itemId: string; amount: number };
    'REQUEST_MAGNET': { entity: IEntity; target: IEntity };
    'ADD_GOLD': { amount: number };
    'TRANSACTION_FAILED': { reason: string };
    'LOOT_DROPPED': { items: { itemId: string; amount: number }[]; x: number; y: number };

    // ---- Progression & Unlocks ----
    'ISLAND_UNLOCKED': { islandId: string };
    'REQUEST_UNLOCK': { id: string; type: string };
    'REQUEST_UPGRADE': { id: string; type: string };
    'UPGRADE_PURCHASED': { id: string; type: string };
    'QUEST_UPDATED': { quest: unknown; animate?: boolean };

    // ---- World & Environment ----
    'BIOME_ENTERED': { biomeId: string };
    'TIME_TICK': { totalTime: number; dayTime: number; phase: string; season: string; dayCount: number };
    'DAY_PHASE_CHANGE': { phase: string; prevPhase: string };
    'SEASON_CHANGE': { season: string; prevSeason: string };
    'WEATHER_CHANGE': { type: string; intensity: number };
    'COLLISION_START': { entityA: IEntity; entityB: IEntity };
    'COLLISION_END': { entityA: IEntity; entityB: IEntity };
    'MOVEMENT_UPDATE_RESULT': { entity: IEntity; x: number; y: number; moved: boolean };

    // ---- UI & Presentation ----
    'UI_UNLOCK_PROMPT': { title: string; cost: number; id: string };
    'UI_HIDE_UNLOCK_PROMPT': undefined;
    'INTERACTION_OPPORTUNITY': { target: IEntity | null; actionText?: string; type?: string; visible?: boolean };
    'UI_FADE_SCREEN': { duration: number; color?: string; fadeIn?: boolean };
    'OPEN_FORGE': { view?: string };
    'OPEN_MERCHANT': undefined;
    'UI_FULLSCREEN_OPENED': { source?: unknown };
    'UI_LAYOUT_CHANGED': { format: 'mobile' | 'desktop' };
    'DAMAGE_NUMBER_REQUESTED': { value: number; x: number; y: number; isCrit?: boolean; isHeal?: boolean };
    'FLOATING_TEXT_REQUESTED': { text: string; x: number; y: number; color?: string };
    'VFX_PLAY_FOREGROUND': { x: number; y: number; options: unknown };

    // ---- Home Base & Interaction ----
    'REQUEST_REST': undefined;
    'REQUEST_STAMINA_RESTORE': undefined;
    'HOME_BASE_ENTERED': undefined;
    'HOME_BASE_EXITED': undefined;
    'FORGE_ENTERED': undefined;
    'FORGE_EXITED': undefined;
    'RESPAWN_REFRESH_REQUESTED': undefined;

    // ---- AI specific events not found in GameConstants but used globally ----
    'BOSS_PHASE_CHANGE': { phase: number };
    'BOSS_ABILITY': { abilityId: string };
    'NPC_PLAYER_NEARBY': { npc: IEntity, hero: IEntity };
    'NPC_PLAYER_LEFT': { npc: IEntity };
    'NPC_DIALOGUE_START': { npc: IEntity };
    'NPC_DIALOGUE_END': { npc: IEntity };
    'WEAPON_SET_CHANGED': { activeSet: number };
    'EQUIPMENT_CHANGED': { slotId: string; itemId: string | null };
    'HERO_SKIN_CHANGED': { skinId: string };

    // ---- Core App State Events ----
    'LANGUAGE_CHANGED': { locale: string };
    'STATE_CHANGED': { key: string; value: unknown };
    'GOLD_CHANGED': number;
}
