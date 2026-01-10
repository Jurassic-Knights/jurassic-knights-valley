/**
 * Hero - Player-controlled character
 * 
 * Owner: Director (engine), Gameplay Designer (stats)
 */

class Hero extends Entity {
    constructor(config = {}) {
        // 1. Load Config (Cascading)
        const baseConfig = window.EntityConfig ? EntityConfig.hero.base : {};
        // Merge: Config < Constructor Args
        const finalConfig = { ...baseConfig, ...config };

        super({
            id: 'hero',
            entityType: EntityTypes.HERO,
            width: finalConfig.width || RenderConfig.Hero.WIDTH,
            height: finalConfig.height || RenderConfig.Hero.HEIGHT,
            color: finalConfig.color || RenderConfig.Hero.COLOR,
            ...config
        });

        // 2. Initialize Components
        this.components = {};

        // Health
        if (window.HealthComponent) {
            this.components.health = new HealthComponent(this, {
                maxHealth: finalConfig.maxHealth,
                health: finalConfig.health
            });
        }

        // Inventory
        if (window.InventoryComponent) {
            this.components.inventory = new InventoryComponent(this, {
                capacity: 20,
                items: {
                    gold: finalConfig.gold || 0,
                    scrap_metal: 10,
                    iron_ore: 10,
                    fossil_fuel: 10,
                    wood: 10,
                    primal_meat: 10
                }
            });
        }

        // Combat
        if (window.CombatComponent) {
            this.components.combat = new CombatComponent(this, {
                damage: finalConfig.attack ? finalConfig.attack.damage : 10,
                rate: finalConfig.attack ? finalConfig.attack.rate : 2,
                range: finalConfig.attack ? finalConfig.attack.range.default : 125,
                staminaCost: finalConfig.attack && finalConfig.attack.staminaCost !== undefined ? finalConfig.attack.staminaCost : 1
            });
        }

        // Stats (New Phase 17)
        if (window.StatsComponent) {
            this.components.stats = new StatsComponent(this, {
                speed: finalConfig.speed || 700,
                maxStamina: finalConfig.maxStamina || 100,
                stamina: finalConfig.stamina // Defaults to max
            });
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

        // Ranges
        this.miningRange = finalConfig.attack && finalConfig.attack.range ? finalConfig.attack.range.default : 125;
        this.gunRange = finalConfig.attack && finalConfig.attack.range ? finalConfig.attack.range.gun : 450;

        // Visual State (Used by HeroRenderer/HeroSystem)
        this.prevX = this.x;
        this.prevY = this.y;
        this.footstepTimer = 0;
        this.footstepInterval = 0.15;
        this.attackTimer = 0;
    }

    // --- Accessors for Components ---

    // Health
    get health() { return this.components.health ? this.components.health.health : 0; }
    set health(val) { if (this.components.health) this.components.health.health = val; }

    get maxHealth() { return this.components.health ? this.components.health.maxHealth : 100; }
    set maxHealth(val) { if (this.components.health) this.components.health.maxHealth = val; }

    // Inventory
    get inventory() { return this.components.inventory ? this.components.inventory.items : {}; }
    set inventory(val) {
        // Warning: Setting inventory directly is discouraged, use component methods
        if (this.components.inventory) this.components.inventory.items = val;
    }

    // Stats
    get speed() { return this.components.stats ? this.components.stats.speed : 700; }
    set speed(val) { if (this.components.stats) this.components.stats.speed = val; }

    get stamina() { return this.components.stats ? this.components.stats.stamina : 0; }
    set stamina(val) { if (this.components.stats) this.components.stats.stamina = val; }

    get maxStamina() { return this.components.stats ? this.components.stats.maxStamina : 100; }
    set maxStamina(val) { if (this.components.stats) this.components.stats.maxStamina = val; }

    /**
     * Helper to restore stamina (used by RestSystem legacy calls)
     */
    restStamina() {
        if (this.components.stats) {
            this.components.stats.restoreStamina(this.maxStamina);
        }
    }


}

window.Hero = Hero;
