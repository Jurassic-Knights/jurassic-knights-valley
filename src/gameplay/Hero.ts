/**
 * Hero - Player-controlled character
 *
 * Owner: Director (engine), Gameplay Designer (stats)
 */
import { Entity } from '@core/Entity';
import { RenderConfig } from '@config/RenderConfig';
import { EquipmentManager } from '@systems/EquipmentManager';
import { GameConstants, getConfig } from '@data/GameConstants';
import { EntityRegistry } from '@entities/EntityLoader';
import { GameInstance } from '@core/Game';
import { EntityTypes } from '@config/EntityTypes';
import { HealthComponent } from '../components/HealthComponent';
import { InventoryComponent } from '../components/InventoryComponent';
import { CombatComponent } from '../components/CombatComponent';
import { StatsComponent } from '../components/StatsComponent';
import { HeroDefaults } from '@config/HeroDefaults';
import { Registry } from '@core/Registry';

// Unmapped modules - need manual import

class Hero extends Entity {
    // Class properties
    components: Record<string, any>;
    equipment: any;
    isAtHomeOutpost: boolean;
    locked: boolean;
    prevX: number;
    prevY: number;
    footstepTimer: number;
    footstepInterval: number;
    attackTimer: number;
    selectedSkin: string | null = null;

    /** Check if hero is dead */
    isDead(): boolean {
        return this.health <= 0;
    }

    constructor(config: any = {}) {
        // 1. Load Config from EntityRegistry (v2 architecture) or fallback
        const baseConfig = GameInstance?.hero || {};
        // Merge: Config < Constructor Args
        const finalConfig = { ...baseConfig, ...config };

        super({
            id: 'hero',
            entityType: EntityTypes.HERO,
            width: finalConfig.width || RenderConfig.Hero.WIDTH,
            height: finalConfig.height || RenderConfig.Hero.HEIGHT,
            color: finalConfig.color || RenderConfig.Hero.COLOR,
            collision: {
                bounds: { x: 0, y: 0, width: 32, height: 32 },
                layer: 0x0002, // HERO
                mask: 0x0001 | 0x0010 | 0x0004 | 0x0008, // WORLD | TRIGGER | ENEMY | BOSS
                isTrigger: false
            },
            ...config
        });

        // 2. Initialize Components
        this.components = {};

        // Health
        if (HealthComponent) {
            this.components.health = new HealthComponent(this, {
                maxHealth: finalConfig.maxHealth,
                health: finalConfig.health
            });
        }

        // Inventory
        if (InventoryComponent) {
            const resources = getConfig().PlayerResources;
            this.components.inventory = new InventoryComponent(this, {
                capacity: 20,
                items: {
                    gold: finalConfig.gold || resources.INITIAL_GOLD || 0,
                    scraps_t1_01: resources.INITIAL_SCRAPS || 10,
                    minerals_t1_01: resources.INITIAL_MINERALS || 10,
                    minerals_t2_01: resources.INITIAL_MINERALS || 10,
                    wood_t1_01: resources.INITIAL_WOOD || 10,
                    food_t1_01: resources.INITIAL_FOOD || 10
                }
            });
        }

        // Combat
        if (CombatComponent) {
            this.components.combat = new CombatComponent(this, {
                damage: finalConfig.attack ? finalConfig.attack.damage : 10,
                rate: finalConfig.attack ? finalConfig.attack.rate : 2,
                range: finalConfig.attack ? finalConfig.attack.range.default : 125,
                staminaCost:
                    finalConfig.attack && finalConfig.attack.staminaCost !== undefined
                        ? finalConfig.attack.staminaCost
                        : 1
            });
        }

        // Stats (New Phase 17, expanded 03-hero-stats)
        if (StatsComponent) {
            this.components.stats = new StatsComponent(this, {
                speed: finalConfig.speed || getConfig().Hero.SPEED,
                maxStamina: finalConfig.maxStamina || 100,
                stamina: finalConfig.stamina, // Defaults to max
                // Combat Stats (03-hero-stats)
                attack: finalConfig.attack?.damage || 10,
                defense: finalConfig.defense || 0,
                critChance: finalConfig.critChance || 0.05,
                critMultiplier: finalConfig.critMultiplier || 1.5,
                // Leveling (03-hero-stats)
                level: finalConfig.level || 1,
                xp: finalConfig.xp || 0,
                xpToNextLevel: finalConfig.xpToNextLevel || 100,
                xpScaling: finalConfig.xpScaling || 1.5
            });
        }

        // Equipment Manager (Phase 18 - Equipment System)
        if (EquipmentManager) {
            this.equipment = new EquipmentManager(this);

            // Equip default items from HeroDefaults config
            if (HeroDefaults && getConfig().Equipment && EntityRegistry?.equipment) {
                for (const [slot, entityId] of Object.entries(HeroDefaults.equipment)) {
                    if (entityId && EntityRegistry.equipment[entityId as string]) {
                        this.equipment.equip(slot, EntityRegistry.equipment[entityId as string]);
                    }
                }
            }
        }

        // Legacy/Sync Properties (Getters/Setters)
        // This ensures compatibility with HeroSystem/RestSystem without refactoring them yet

        // Legacy/Sync Properties (Getters/Setters)
        // We now rely on getters to fetch truth from components.
        // this.health, this.maxHealth, this.inventory are now virtual.

        // State Flags
        this.isAtHomeOutpost = false;
        this.locked = false;
        this.active = true;

        // Ranges are now read dynamically via getters below

        // Visual State (Used by HeroRenderer/HeroSystem)
        this.prevX = this.x;
        this.prevY = this.y;
        this.footstepTimer = 0;
        this.footstepInterval = 0.15;
        this.attackTimer = 0;
    }

    // --- Accessors for Components ---

    // Health
    get health() {
        return this.components.health ? this.components.health.health : 0;
    }
    set health(val) {
        if (this.components.health) this.components.health.health = val;
    }

    get maxHealth() {
        return this.components.health ? this.components.health.maxHealth : 100;
    }
    set maxHealth(val) {
        if (this.components.health) this.components.health.maxHealth = val;
    }

    // Inventory
    get inventory() {
        return this.components.inventory ? this.components.inventory.items : {};
    }
    set inventory(val) {
        // Warning: Setting inventory directly is discouraged, use component methods
        if (this.components.inventory) this.components.inventory.items = val;
    }

    // Stats - Read directly from global GameConstants for HMR reactivity
    get speed() {
        // Use getConfig() helper for HMR-safe access
        return getConfig().Hero?.SPEED ?? 1400;
    }
    set speed(val) {
        // Speed is now controlled by GameConstants, this setter is for backwards compatibility
        console.warn(
            '[Hero] speed setter called but value is controlled by getConfig().Hero.SPEED'
        );
    }

    get stamina() {
        return this.components.stats ? this.components.stats.stamina : 0;
    }
    set stamina(val) {
        if (this.components.stats) this.components.stats.stamina = val;
    }

    get maxStamina() {
        return this.components.stats ? this.components.stats.maxStamina : 100;
    }
    set maxStamina(val) {
        if (this.components.stats) this.components.stats.maxStamina = val;
    }

    // Level/XP (03-hero-stats)
    get level() {
        return this.components.stats?.level || 1;
    }
    set level(val) {
        if (this.components.stats) this.components.stats.level = val;
    }

    get xp() {
        return this.components.stats?.xp || 0;
    }
    set xp(val) {
        if (this.components.stats) this.components.stats.xp = val;
    }

    // Combat (03-hero-stats) - getters delegate to effective stat methods
    get attack() {
        return this.components.stats?.getAttack() || 10;
    }
    get defense() {
        return this.components.stats?.getDefense() || 0;
    }

    // Stats component accessor (for HeroCombatService etc)
    get stats() {
        return this.components.stats;
    }

    // Combat ranges - read from config for HMR reactivity
    get miningRange() {
        return getConfig().Combat?.DEFAULT_MINING_RANGE ?? 1250;
    }

    get gunRange() {
        return getConfig().Combat?.DEFAULT_GUN_RANGE ?? 800;
    }

    /**
     * Helper to restore stamina (used by RestSystem legacy calls)
     */
    restStamina() {
        if (this.components.stats && Registry) {
            const heroSystem = Registry.get('HeroSystem');
            if (heroSystem) {
                heroSystem.restoreStamina(this, this.maxStamina);
            }
        }
    }
}

// ES6 Module Export
export { Hero };
