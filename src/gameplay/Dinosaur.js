/**
 * Dinosaur - AI-controlled entity that wanders and drops loot
 * 
 * Spawns on dinosaur islands, moves randomly, freezes when attacked.
 * 
 * Owner: Director (engine), Gameplay Designer (stats)
 */

class Dinosaur extends Entity {
    constructor(config = {}) {
        // 1. Load Config
        const defaults = window.EntityConfig ? EntityConfig.dinosaur.defaults : {};
        const variantConfig = (window.EntityConfig && config.species) ?
            EntityConfig.dinosaur.variants[config.species] : {};

        // Merge: Defaults < Variant < Constructor
        const finalConfig = { ...defaults, ...variantConfig, ...config };

        super({
            entityType: EntityTypes.DINOSAUR,
            width: finalConfig.width || 100,
            height: finalConfig.height || 100,
            color: '#2ECC71',
            ...config
        });

        // Gameplay Props
        this.resourceType = config.resourceType || 'fossil_fuel';
        this.amount = finalConfig.amount || 1; // Cascades from EntityConfig.dinosaur.defaults

        // Components
        this.components = {};
        if (window.HealthComponent) {
            this.components.health = new HealthComponent(this, {
                maxHealth: finalConfig.maxHealth || 60,
                health: finalConfig.maxHealth || 60
            });
        }

        // Legacy Props (Sync)
        this.maxHealth = this.components.health ? this.components.health.maxHealth : 60;
        this.health = this.maxHealth;

        this.state = 'alive'; // alive, dead
        this.respawnTimer = 0;
        this.maxRespawnTime = finalConfig.respawnTime || 30;

        // Island context for updates
        this.islandGridX = config.islandGridX;
        this.islandGridY = config.islandGridY;
        this.islandBounds = config.islandBounds; // {x, y, width, height}

        // Initialize Respawn Time from Upgrades
        this.recalculateRespawnTimer();

        // Components (Game Logic)
        if (window.StatsComponent) {
            // Convert legacy moveSpeed (px/frame @ 60fps) to px/sec
            // Logic was: moveSpeed * 60 (essentially). 
            // Default speed config is typically 30 (px/sec).
            // finalConfig.speed is usually 30.
            const speed = finalConfig.speed || 30;

            this.components.stats = new StatsComponent(this, {
                speed: speed,
                maxStamina: 100 // Dinos don't use stamina primarily yet, but good for future sprinting
            });
        }

        // AI (New Phase 17)
        if (window.AIComponent) {
            this.components.ai = new AIComponent(this, {
                state: 'WANDER',
                wanderIntervalMin: 2000,
                wanderIntervalMax: 5000
            });
            // Init random direction
            this.components.ai.randomizeWander();
        }

        // Legacy / Sync Properties (for now, mainly used by System until refactor catch-up)
        this.isBeingAttacked = false; // Set by Game.js / Combat Logic

        // Animation Props

        // Animation Props
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.frameInterval = finalConfig.frameInterval || 200;
        this.walkFrames = []; // Disabled walk animation, using static base sprite

        // Species Setup
        this.species = this.getSpeciesFromResource(this.resourceType);
        this.spriteId = `dino_${this.species}_base`;

        this._sprites = {};
        this._spritesLoaded = false;
        this._loadSprites();
    }

    getSpeciesFromResource(type) {
        if (window.EntityConfig && EntityConfig.dinosaur.speciesMap) {
            return EntityConfig.dinosaur.speciesMap[type] || EntityConfig.dinosaur.speciesMap.default;
        }
        return 'velociraptor';
    }

    /**
     * Preload all dinosaur sprites
     */
    _loadSprites() {
        if (!window.AssetLoader) return;

        const keys = (window.EntityConfig && EntityConfig.dinosaur.spriteKeys) ?
            EntityConfig.dinosaur.spriteKeys : [];

        let loaded = 0;

        for (const key of keys) {
            const path = AssetLoader.getImagePath(key);
            if (path) {
                this._sprites[key] = new Image();
                this._sprites[key].onload = () => {
                    loaded++;
                    if (loaded === keys.length) {
                        this._spritesLoaded = true;
                    }
                };
                this._sprites[key].src = path;
            }
        }
    }

    /**
     * Update max respawn time based on island upgrades
     */
    recalculateRespawnTimer() {
        if (window.IslandUpgrades && this.islandGridX !== undefined) {
            // Base 20s for Dinos (faster than resources?)
            this.maxRespawnTime = IslandUpgrades.getRespawnTime(this.islandGridX, this.islandGridY, 20);
        }
    }

    /**
     * Update entity state
     * Logic moved to DinosaurSystem.js (ECS)
     * @param {number} dt - Delta time in ms
     */
    update(dt) {
        // Handled by DinosaurSystem
    }

    /**
     * Pick a new random direction
     * Logic moved to DinosaurSystem.js
     */
    changeDirection() {
        // Handled by DinosaurSystem
    }



    /**
     * Check if in range for interaction (e.g. gun range checked by Hero/Game)
     * For Entity base compat
     */
    isInRange(hero) {
        if (!this.active || !hero) return false;
        if (this.state === 'dead') return false;
        // Use config value for interaction range
        const range = (window.EntityConfig && EntityConfig.dinosaur.defaults.interactionRange) || 120;
        return this.distanceTo(hero) < range;
    }

    render(ctx) {
        // Handled by DinosaurRenderer
    }

    renderUI(ctx) {
        // Delegated to System
        if (window.DinosaurRenderer) {
            DinosaurRenderer.renderUI(ctx, this);
        }
    }

    /**
     * Legacy Accessor for moveSpeed (used by DinosaurSystem currently)
     * Returns speed in px/frame (approx) to match old logic until System is updated
     */
    get moveSpeed() {
        // Old: speed / 60
        // New: stats.speed (px/sec) / 60
        return this.components.stats ? (this.components.stats.speed / 60) : 0.5;
    }

    // --- Accessors for AIComponent ---
    get wanderDirection() { return this.components.ai ? this.components.ai.wanderDirection : { x: 0, y: 0 }; }
    set wanderDirection(val) { if (this.components.ai) this.components.ai.wanderDirection = val; }

    get wanderTimer() { return this.components.ai ? this.components.ai.wanderTimer : 0; }
    set wanderTimer(val) { if (this.components.ai) this.components.ai.wanderTimer = val; }
}

window.Dinosaur = Dinosaur;
