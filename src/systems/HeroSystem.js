/**
 * HeroSystem
 * Handles Input, Physics, and logic for the Hero entity.
 * Decoupled from the Hero class data container.
 */
class HeroSystem {
    constructor() {
        this.game = null;
        this.hero = null;

        // Input State (Internal to system or fetched from InputSystem)
        this.inputMove = { x: 0, y: 0 };
        this.isAttacking = false;
        this.lastHomeState = false; // Track home state change

        // GC Optimization: Reusable config object for heavy VFX loops
        this._dustConfig = {
            type: 'circle',
            color: '#FFFFFF', // Placeholder, updated in loop
            alpha: 0.25,
            count: 1,
            speed: 0,
            drag: 0.85,
            lifetime: 0,
            size: 0,
            sizeOverLifetime: [24, 0],
            gravity: -0.15
        };

        this.initListeners();
        Logger.info('[HeroSystem] Initialized');
    }

    init(game) {
        this.game = game;
        // Assume single hero for now, but design allows for multiple
        this.hero = game.hero;

        // GC Optimization: Cache system references
        this._islandManager = game.getSystem('IslandManager');
        this._homeBase = game.getSystem('HomeBase');
        this._gameRenderer = game.getSystem('GameRenderer');
        this._vfxController = game.getSystem('VFXController');
    }

    initListeners() {
        if (window.EventBus) {
            EventBus.on(GameConstants.Events.INPUT_MOVE, (vec) => {
                this.inputMove = vec;
            });
            // Attack events could be handled here too

            // Death handler (06-damage-system)
            EventBus.on(GameConstants.Events.HERO_DIED, (data) => this.onHeroDied(data));
        }
    }

    update(dt) {
        if (!this.hero) {
            // Try to find hero if not yet linked
            if (this.game && this.game.hero) {
                this.hero = this.game.hero;
            } else {
                return;
            }
        }

        const hero = this.hero;
        if (hero.locked) return;

        // 1. Movement Logic
        this.updateMovement(dt, hero);

        // 2. Combat/Interaction Logic
        this.updateCombat(dt, hero);

        // 3. VFX (Dust)
        this.updateVFX(dt, hero);

        // 4. Events (State & Stats)
        this.handleEvents(hero);
    }

    handleEvents(hero) {
        // Home State Change
        if (hero.isAtHomeOutpost !== this.lastHomeState) {
            this.lastHomeState = hero.isAtHomeOutpost;
            if (window.EventBus) EventBus.emit(GameConstants.Events.HERO_HOME_STATE_CHANGE, { isHome: hero.isAtHomeOutpost });
        }

        // Stats Emission - Throttle to every 100ms (6 events/sec instead of 60)
        if (window.EventBus) {
            const now = performance.now();
            if (!this._lastStaminaEmit || now - this._lastStaminaEmit > 100) {
                this._lastStaminaEmit = now;
                EventBus.emit(GameConstants.Events.HERO_STAMINA_CHANGE, { current: hero.stamina, max: hero.maxStamina });
            }
        }

    }

    // Death/Respawn Handler (06-damage-system)
    onHeroDied(data) {
        const hero = data.hero;
        if (!hero) return;

        // Lock movement
        hero.locked = true;

        // Death VFX
        if (window.VFXController && window.VFXConfig) {
            VFXController.playForeground(hero.x, hero.y, VFXConfig.TEMPLATES?.HERO_DEATH_FX || {
                type: 'burst',
                color: '#FF0000',
                count: 15
            });
        }

        // Respawn after delay
        setTimeout(() => {
            // Get spawn position
            const spawnPos = this._islandManager?.getHeroSpawnPosition?.() ||
                window.IslandManager?.getHeroSpawnPosition?.() ||
                { x: hero.x, y: hero.y };
            hero.x = spawnPos.x;
            hero.y = spawnPos.y;

            // Restore health
            if (hero.components.health) {
                hero.components.health.respawn();
            }

            hero.locked = false;

            if (window.EventBus && window.GameConstants) {
                EventBus.emit(GameConstants.Events.HERO_RESPAWNED, { hero });
            }

            Logger.info('[HeroSystem] Hero respawned at', spawnPos);
        }, 2000);
    }

    updateMovement(dt, hero) {
        // if (!window.InputManager) return; 
        const move = this.inputMove;
        hero.inputMove = move; // Sync for Renderer
        const dtSec = dt / 1000;

        // Save previous position for collision/VFX
        hero.prevX = hero.x;
        hero.prevY = hero.y;

        // Calculate new position
        // Apply road speed bonus from BiomeManager
        const speedMultiplier = window.BiomeManager?.getSpeedMultiplier?.(hero.x, hero.y) || 1.0;
        const effectiveSpeed = hero.speed * speedMultiplier;
        const newX = hero.x + move.x * effectiveSpeed * dtSec;
        const newY = hero.y + move.y * effectiveSpeed * dtSec;

        // Check collision blocks
        let canMoveX = true;
        let canMoveY = true;

        // Use cached system refs
        const islandManager = this._islandManager;
        const homeBase = this._homeBase;
        const gameRenderer = this._gameRenderer;

        if (islandManager) {
            // Offset check to feet (approx 40% down from center)
            const feetOffset = hero.height * 0.4;

            // Check collision blocks (new system)
            if (islandManager.isBlocked(newX, hero.y + feetOffset)) {
                canMoveX = false;
            }
            if (islandManager.isBlocked(hero.x, newY + feetOffset)) {
                canMoveY = false;
            }
            // Check diagonal
            if (canMoveX && canMoveY && islandManager.isBlocked(newX, newY + feetOffset)) {
                canMoveY = false;
            }
        }

        // Check HomeBase tree collision
        if (homeBase) {
            if (canMoveX && homeBase.isBlockedByTrees(newX, hero.y)) canMoveX = false;
            if (canMoveY && homeBase.isBlockedByTrees(hero.x, newY)) canMoveY = false;
        }

        // Apply movement
        if (canMoveX) hero.x = newX;
        if (canMoveY) hero.y = newY;

        // Clamp to world bounds
        if (gameRenderer) {
            const halfW = hero.width / 2;
            const halfH = hero.height / 2;
            hero.x = Math.max(halfW, Math.min(gameRenderer.worldWidth - halfW, hero.x));
            hero.y = Math.max(halfH, Math.min(gameRenderer.worldHeight - halfH, hero.y));
        }

        // Update interaction flags (Home Outpost)
        if (islandManager) {
            const home = islandManager.getHomeIsland();
            if (home) {
                const centerX = home.worldX + home.width / 2;
                const centerY = home.worldY + home.height / 2;
                const dist = Math.sqrt((hero.x - centerX) ** 2 + (hero.y - centerY) ** 2);
                hero.isAtHomeOutpost = dist < 200;
            }
        }
    }

    updateCombat(dt, hero) {
        // Update attack timer
        if (hero.attackTimer > 0) {
            hero.attackTimer -= (dt / 1000);
        }

        // Components update
        if (hero.components.combat) hero.components.combat.update(dt);

        // --- Auto-Targeting Logic ---
        // Find nearest valid target within range
        let target = null;
        let minDistSq = Infinity; // Use squared distance to avoid Math.sqrt
        const scanRange = hero.gunRange || GameConstants.Combat.DEFAULT_GUN_RANGE;

        // Check Enemies (HIGHEST Priority - hostile entities)
        // Note: EntityManager.getByType uses constructor.name ('Enemy'), not entityType
        if (window.EntityManager) {
            // Check both Enemy and Boss types (Boss extends Enemy but has different constructor name)
            const enemyTypes = ['Enemy', 'Boss'];
            for (const enemyType of enemyTypes) {
                const candidates = EntityManager.getByType(enemyType);
                for (const candidate of candidates) {
                    if (!candidate.active || candidate.isDead) continue;

                    const dx = candidate.x - hero.x;
                    const dy = candidate.y - hero.y;
                    const distSq = dx * dx + dy * dy;
                    const rangeSq = scanRange * scanRange;

                    if (distSq <= rangeSq && distSq < minDistSq) {
                        minDistSq = distSq;
                        target = candidate;
                    }
                }
            }
        }

        // Check Dinosaurs (Second Priority)
        if (!target && window.EntityManager) {
            const candidates = EntityManager.getInRadius(hero.x, hero.y, scanRange, 'Dinosaur');

            for (const candidate of candidates) {
                if (!candidate.active || candidate.state === 'dead') continue;

                // Use squared distance (avoid Math.sqrt)
                const dx = candidate.x - hero.x;
                const dy = candidate.y - hero.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < minDistSq) {
                    minDistSq = distSq;
                    target = candidate;
                }
            }
        }

        // Check Resources (Lowest Priority, mining)
        if (!target && window.EntityManager) {
            const miningRange = hero.miningRange || GameConstants.Combat.DEFAULT_MINING_RANGE;
            const candidates = EntityManager.getInRadius(hero.x, hero.y, miningRange, 'Resource');
            for (const candidate of candidates) {
                if (!candidate.active || candidate.state === 'depleted') continue;

                // Use squared distance (avoid Math.sqrt)
                const dx = candidate.x - hero.x;
                const dy = candidate.y - hero.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < minDistSq) {
                    minDistSq = distSq;
                    target = candidate;
                }
            }
        }

        // Auto-Attack
        if (target) {
            this.tryAttack(hero, target);
        } else {
            hero.isAttacking = false;
        }

        // --- Manual Interaction (Shops, Npcs) ---
        // 'E' Key
        if (window.InputSystem && typeof InputSystem.hasIntent === 'function' && InputSystem.hasIntent('INTERACT')) {
            // Interaction logic (usually handled by Game.js triggers currently)
            // We can emit an event or check triggers here.
            // For now, let's just ensure we capture the intent if needed for future.
        }
    }

    updateVFX(dt, hero) {
        const dtSec = dt / 1000;
        const isMoving = (hero.x !== hero.prevX || hero.y !== hero.prevY);

        // Use cached VFXController ref
        const vfxController = this._vfxController;

        if (isMoving && vfxController) {
            hero.footstepTimer -= dtSec;
            if (hero.footstepTimer <= 0) {
                hero.footstepTimer = hero.footstepInterval || 0.15;

                // Dust Logic
                if (window.VFXConfig) {
                    const cfg = VFXConfig.HERO.DUST;
                    const cloudDensity = cfg.DENSITY;
                    for (let i = 0; i < cloudDensity; i++) {
                        const offsetX = (Math.random() - 0.5) * cfg.OFFSET_X;
                        const offsetY = (Math.random() - 0.5) * cfg.OFFSET_Y;

                        // GC Config Reuse
                        this._dustConfig.color = cfg.COLOR;
                        this._dustConfig.speed = 1.5 + Math.random();
                        this._dustConfig.lifetime = cfg.LIFETIME_BASE + Math.random() * cfg.LIFETIME_RND;
                        this._dustConfig.size = 20 + Math.random() * 8;

                        vfxController.playBackground(hero.x + offsetX, hero.y + hero.height / 2 - 35 + offsetY, this._dustConfig);
                    }
                }
            }
        } else {
            hero.footstepTimer = 0;
        }
    }

    // --- Public Actions (Callable by Game/Input) ---

    tryAttack(hero, resource) {
        // Migrated from Hero.js
        if (!resource || !resource.active) return false;

        // Check entity type - enemies and dinos use ranged combat
        // Use constructor.name as primary check (more reliable than entityType)
        const isEnemy = resource.constructor.name === 'Enemy' ||
            resource.constructor.name === 'Boss' ||
            resource.isBoss === true;
        const isDino = resource.constructor.name === 'Dinosaur' ||
            resource.entityType === EntityTypes?.DINOSAUR;
        const isRangedTarget = isDino || isEnemy;

        // Skip if resource is depleted (but not for enemies/dinos)
        if (!isRangedTarget && resource.state === 'depleted') return false;
        // Skip if enemy is dead
        if (isEnemy && resource.isDead) return false;

        // Use squared distance comparison (avoid Math.sqrt)
        const dx = hero.x - resource.x;
        const dy = hero.y - resource.y;
        const distSq = dx * dx + dy * dy;

        const combat = hero.components.combat;
        const effectiveRange = isRangedTarget ? (hero.gunRange || GameConstants.Combat.DEFAULT_GUN_RANGE) : (hero.miningRange || GameConstants.Combat.DEFAULT_MINING_RANGE);
        const rangeSq = effectiveRange * effectiveRange;

        if (distSq > rangeSq) return false;

        // Update Hero State for Renderer
        hero.targetResource = resource;
        hero.isAttacking = true;

        // Combat Component Cooldown Check
        if (combat) {
            if (!combat.attack()) return false;
            hero.attackTimer = 1 / combat.rate;
        } else {
            if (hero.attackTimer > 0) return false;
            hero.attackTimer = 0.5;
        }

        // SFX
        if (window.AudioManager) {
            AudioManager.playSFX(isRangedTarget ? 'sfx_hero_shoot' : 'sfx_hero_swing');
        }

        // VFX: Muzzle Flash
        const vfxController = this.game.getSystem('VFXController');
        if (isRangedTarget && vfxController && window.VFXConfig) {
            const cfg = VFXConfig.HERO.MUZZLE_FLASH;
            const dx = resource.x - hero.x;
            const dy = resource.y - hero.y;
            const angle = Math.atan2(dy, dx);
            const tipX = hero.x + Math.cos(angle) * cfg.DISTANCE;
            const tipY = hero.y + Math.sin(angle) * cfg.DISTANCE;



            // New Pixelated Flash
            if (VFXConfig.TEMPLATES.MUZZLE_FLASH_FX) {
                // Pass Angle for directional burst if we wanted, but for now 360 burst is fine.
                // We'll use playForeground directly to mix template with local overrides if needed.
                const fx = { ...VFXConfig.TEMPLATES.MUZZLE_FLASH_FX, angle: angle, spread: 1.0 }; // Slight directional bias?
                vfxController.playForeground(tipX, tipY, fx);
            }
        }

        // Damage Logic
        let justKilled = false;
        const dmg = combat ? combat.damage : GameConstants.Combat.DEFAULT_DAMAGE;

        Logger.info(`[HeroSystem] Attacking ${resource.constructor.name}, damage: ${dmg}`);

        // For Enemy entities, prefer their own takeDamage method (it handles aggro/death)
        if (isEnemy && resource.takeDamage) {
            justKilled = resource.takeDamage(dmg, hero);
        } else if (resource.components && resource.components.health) {
            justKilled = resource.components.health.takeDamage(dmg);
        } else if (resource.takeDamage) {
            justKilled = resource.takeDamage(dmg);
        }

        return justKilled;
    }
}

window.HeroSystem = new HeroSystem();
if (window.Registry) Registry.register('HeroSystem', window.HeroSystem);
