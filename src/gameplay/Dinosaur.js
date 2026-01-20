/**
 * Dinosaur - AI-controlled entity that wanders and drops loot
 *
 * Spawns on dinosaur islands, moves randomly, freezes when attacked.
 *
 * Owner: Director (engine), Gameplay Designer (stats)
 */

class Dinosaur extends Entity {
    constructor(config = {}) {
        // 1. Load Config from EntityRegistry (modern: use dinoType to look up herbivore entities)
        const defaults = window.BaseCreature || {};

        // Look up entity config from EntityRegistry using dinoType (e.g., 'enemy_herbivore_t1_01')
        const entityConfig = config.dinoType
            ? window.EntityRegistry?.enemies?.[config.dinoType] || {}
            : {};

        // Merge: Defaults < Entity JSON < Constructor
        const finalConfig = { ...defaults, ...entityConfig, ...config };

        // Get size from SpeciesScaleConfig (runtime lookup by species)
        const sizeInfo = window.SpeciesScaleConfig?.getSize(entityConfig, false) || { width: 150, height: 150 };

        // Debug
        if (sizeInfo.scale !== 1.0) {
            Logger.info(`[Dinosaur] ${config.dinoType}: species=${entityConfig.species}, scale=${sizeInfo.scale}, size=${sizeInfo.width}x${sizeInfo.height}`);
        }

        // IMPORTANT: Apply ...config first, then override with species sizing
        super({
            ...config,
            entityType: EntityTypes.DINOSAUR,
            color: '#2ECC71',
            width: sizeInfo.width,
            height: sizeInfo.height
        });

        // Modern: Store entity type for sprite loading
        this.dinoType = config.dinoType || 'enemy_herbivore_t1_01';

        // Loot: prioritize config.lootTable (from ResourceSpawner) > entityConfig.lootTable (from EntityLoader)
        this.lootTable = config.lootTable || entityConfig.lootTable || null;
        this.xpReward = entityConfig.xpReward || 10;

        // Gameplay Props
        this.resourceType = config.resourceType || 'food_t1_01';
        this.amount = finalConfig.amount || 1;

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
        this.walkFrames = [];

        // Sprite Setup - Use dinoType directly as asset key (matches AssetLoader keys)
        this.spriteId = this.dinoType; // e.g., 'enemy_herbivore_t1_01'

        // Single sprite loading (modern approach)
        this._sprite = null;
        this._spriteLoaded = false;
        this._loadSprite();
    }

    /**
     * Load sprite using dinoType as asset key (matches Enemy class pattern)
     */
    _loadSprite() {
        if (!window.AssetLoader) {
            Logger.warn(`[Dinosaur] AssetLoader not available for: ${this.dinoType}`);
            return;
        }

        // Use dinoType directly as asset key (e.g., 'enemy_herbivore_t1_01')
        const path = AssetLoader.getImagePath(this.dinoType);

        if (!path || path.includes('PH.png')) {
            Logger.warn(`[Dinosaur] No sprite found for: ${this.dinoType}, path: ${path}`);
            return;
        }

        Logger.info(`[Dinosaur] Loading sprite: ${this.dinoType} -> ${path}`);

        this._sprite = new Image();
        this._sprite.onload = () => {
            this._spriteLoaded = true;
            Logger.info(`[Dinosaur] Sprite loaded: ${this.dinoType}`);
        };
        this._sprite.onerror = (e) => {
            Logger.error(`[Dinosaur] Failed to load sprite: ${this.dinoType}, path: ${path}`, e);
            this._spriteLoaded = false;
        };
        this._sprite.src = path;
    }

    /**
     * Update max respawn time based on island upgrades
     */
    recalculateRespawnTimer() {
        if (window.IslandUpgrades && this.islandGridX !== undefined) {
            // Base 20s for Dinos (faster than resources?)
            this.maxRespawnTime = IslandUpgrades.getRespawnTime(
                this.islandGridX,
                this.islandGridY,
                20
            );
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
        const range = window.BaseCreature?.interactionRange || 120;
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
        return this.components.stats ? this.components.stats.speed / 60 : 0.5;
    }

    // --- Accessors for AIComponent ---
    get wanderDirection() {
        return this.components.ai ? this.components.ai.wanderDirection : { x: 0, y: 0 };
    }
    set wanderDirection(val) {
        if (this.components.ai) this.components.ai.wanderDirection = val;
    }

    get wanderTimer() {
        return this.components.ai ? this.components.ai.wanderTimer : 0;
    }
    set wanderTimer(val) {
        if (this.components.ai) this.components.ai.wanderTimer = val;
    }
}

window.Dinosaur = Dinosaur;

