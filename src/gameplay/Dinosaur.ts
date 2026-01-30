/**
 * Dinosaur - AI-controlled entity that wanders and drops loot
 *
 * Spawns on dinosaur islands, moves randomly, freezes when attacked.
 *
 * Owner: Director (engine), Gameplay Designer (stats)
 */
import { Entity } from '@core/Entity';
import { Logger } from '@core/Logger';
import { AssetLoader } from '@core/AssetLoader';
import { IslandUpgrades } from '../gameplay/IslandUpgrades';
import { EntityRegistry } from '@entities/EntityLoader';
import { DinosaurRenderer } from '../rendering/DinosaurRenderer';
import { EntityTypes } from '@config/EntityTypes';
import { SpeciesScaleConfig } from '@config/SpeciesScaleConfig';
import { HealthComponent } from '../components/HealthComponent';
import { StatsComponent } from '../components/StatsComponent';
import { AIComponent } from '../components/AIComponent';
import { Registry } from '@core/Registry';

class Dinosaur extends Entity {
    // Entity type and identity
    dinoType: string = 'enemy_herbivore_t1_01';
    lootTable: any = null;
    xpReward: number = 10;
    resourceType: string = 'food_t1_01';
    amount: number = 1;

    // Component system
    components: Record<string, any> = {};

    // Health and state
    maxHealth: number = 60;
    health: number = 60;
    state: string = 'alive';
    respawnTimer: number = 0;
    maxRespawnTime: number = 30;

    // Island context (inherited from Entity - use declare to avoid overwrite error)
    declare islandGridX: number | undefined;
    declare islandGridY: number | undefined;
    islandBounds: any = null;

    // Combat flags
    isBeingAttacked: boolean = false;

    // Animation
    frameIndex: number = 0;
    frameTimer: number = 0;
    frameInterval: number = 200;
    walkFrames: HTMLImageElement[] = [];
    spriteId: string = '';
    _sprite: any = null;
    _spriteLoaded: boolean = false;

    constructor(config: any = {}) {
        // 1. Load Config from EntityRegistry (modern: use dinoType to look up herbivore entities)

        // Look up entity config from EntityRegistry using dinoType (e.g., 'enemy_herbivore_t1_01')
        const entityConfig = config.dinoType ? EntityRegistry.enemies?.[config.dinoType] || {} : {};

        // Merge: Entity JSON < Constructor
        const finalConfig = { ...entityConfig, ...config };

        // Get size from SpeciesScaleConfig (runtime lookup by species)
        const sizeInfo = SpeciesScaleConfig.getSize(entityConfig, false) || {
            width: 150,
            height: 150
        };

        // Debug
        const scaleValue = (sizeInfo as any).scale;
        if (scaleValue !== 1.0) {
            Logger.info(
                `[Dinosaur] ${config.dinoType}: species=${entityConfig.species}, scale=${scaleValue}, size=${sizeInfo.width}x${sizeInfo.height}`
            );
        }

        // IMPORTANT: Apply ...config first, then override with species sizing
        super({
            ...config,
            entityType: EntityTypes.DINOSAUR,
            color: '#2ECC71',
            width: sizeInfo.width,
            height: sizeInfo.height,
            collision: finalConfig.collision // Pass merged collision config
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
        if (HealthComponent) {
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
        if (StatsComponent) {
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
        if (AIComponent) {
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
        if (!AssetLoader) {
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

        this._sprite = AssetLoader.createImage(path, () => {
            this._spriteLoaded = true;
            Logger.info(`[Dinosaur] Sprite loaded: ${this.dinoType}`);
        });
        this._sprite.onerror = (e: any) => {
            Logger.error(`[Dinosaur] Failed to load sprite: ${this.dinoType}, path: ${path}`, e);
            this._spriteLoaded = false;
        };
    }

    /**
     * Update max respawn time based on island upgrades
     */
    recalculateRespawnTimer() {
        if (IslandUpgrades && this.islandGridX !== undefined) {
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
     * Logic moved to HerbivoreSystem.ts (ECS)
     * @param {number} dt - Delta time in ms
     */
    update(_dt: number) {
        // Handled by HerbivoreSystem
    }

    /**
     * Pick a new random direction
     * Logic moved to HerbivoreSystem.ts
     */
    changeDirection() {
        // Handled by HerbivoreSystem
    }

    /**
     * Check if in range for interaction (e.g. gun range checked by Hero/Game)
     * For Entity base compat
     */
    isInRange(hero: any) {
        if (!this.active || !hero) return false;
        if (this.state === 'dead') return false;
        // Use config value for interaction range
        const range = 120;
        return this.distanceTo(hero) < range;
    }

    render(_ctx: CanvasRenderingContext2D) {
        // Handled by DinosaurRenderer
    }

    renderUI(ctx: CanvasRenderingContext2D) {
        // Delegated to System
        if (DinosaurRenderer) {
            DinosaurRenderer.renderUI(ctx, this);
        }
    }

    /**
     * Legacy Accessor for moveSpeed (used by HerbivoreSystem currently)
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

    /**
     * Refresh configuration from EntityRegistry
     * Called by EntityLoader on live update
     */
    refreshConfig() {
        // Look up fresh config from registry
        const registryConfig = this.dinoType ? EntityRegistry.enemies?.[this.dinoType] || {} : {};

        // Re-calculate size using SpeciesScaleConfig
        // This will pick up new width/height/sizeScale from registryConfig
        const isBoss = registryConfig.isBoss || registryConfig.entityType === 'Boss';
        const sizeInfo = SpeciesScaleConfig.getSize(registryConfig, isBoss);

        if (sizeInfo) {
            this.width = sizeInfo.width;
            this.height = sizeInfo.height;
            // Note: Dinosaur doesn't use this.scale for rendering key, but we can set it if needed
            // this.scale = sizeInfo.scale; 
        }

        // Sync Collision
        if (this.collision && this.collision.bounds) {
            this.collision.bounds.width = this.width;
            this.collision.bounds.height = this.height;
        }
    }
}

// ES6 Module Export
export { Dinosaur };
