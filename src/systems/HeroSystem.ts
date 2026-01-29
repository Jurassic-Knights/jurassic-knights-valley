/**
 * HeroSystem
 * Handles Input, Physics, and logic for the Hero entity.
 * Decoupled from the Hero class data container.
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants, getConfig } from '@data/GameConstants';
import { VFXController } from '@vfx/VFXController';
import { VFXConfig } from '@data/VFXConfig';
import { BiomeManager } from '../world/BiomeManager';
import { Registry } from '@core/Registry';
import { HeroCombatService } from './HeroCombatService';
import { MathUtils } from '@core/MathUtils';
import type { IGame, IEntity } from '../types/core.d';
import type { ParticleOptions } from '../types/vfx';

class HeroSystem {
    // Property declarations
    game: IGame | null = null;
    hero: IEntity | null = null;
    inputMove: { x: number; y: number } = { x: 0, y: 0 };
    isAttacking: boolean = false;
    lastHomeState: boolean = false;
    _dustConfig: ParticleOptions;
    _islandManager: any; // Uses specific methods like isBlocked, getHomeIsland
    _homeBase: any; // Uses isBlockedByTrees
    _gameRenderer: any; // Uses worldWidth, worldHeight
    _vfxController: any; // Uses playBackground
    _lastStaminaEmit: number = 0;

    constructor() {
        // GC Optimization: Reusable config object for heavy VFX loops
        this._dustConfig = {
            type: 'circle',
            color: '#FFFFFF',
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

    init(game: IGame) {
        this.game = game;
        // Assume single hero for now, but design allows for multiple
        this.hero = game.hero;

        // GC Optimization: Cache system references via Registry (Service Locator)
        this._islandManager = Registry.get('IslandManager');
        this._homeBase = Registry.get('HomeBase');
        this._gameRenderer = Registry.get('GameRenderer');
        this._vfxController = Registry.get('VFXController');
    }

    initListeners() {
        if (EventBus) {
            EventBus.on(GameConstants.Events.INPUT_MOVE, (vec: { x: number; y: number }) => {
                this.inputMove = vec;
            });
            // Attack events could be handled here too

            // Death handler (06-damage-system)
            EventBus.on(GameConstants.Events.HERO_DIED, (data: { hero: IEntity }) =>
                this.onHeroDied(data)
            );
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
            if (EventBus)
                EventBus.emit(GameConstants.Events.HERO_HOME_STATE_CHANGE, {
                    isHome: hero.isAtHomeOutpost
                });
        }

        // Stats Emission - Throttle to every 100ms (6 events/sec instead of 60)
        if (EventBus) {
            const now = performance.now();
            if (!this._lastStaminaEmit || now - this._lastStaminaEmit > 100) {
                this._lastStaminaEmit = now;
                EventBus.emit(GameConstants.Events.HERO_STAMINA_CHANGE, {
                    current: hero.stamina,
                    max: hero.maxStamina
                });
            }
        }
    }

    // --- Stamina Management (Moved from StatsComponent) ---
    consumeStamina(hero, amount) {
        if (!hero.components.stats) return false;

        const stats = hero.components.stats;
        if (stats.stamina >= amount) {
            stats.stamina -= amount;
            if (EventBus) {
                EventBus.emit(GameConstants.Events.HERO_STAMINA_CHANGE, {
                    current: stats.stamina,
                    max: stats.maxStamina
                });
            }
            return true;
        }
        return false;
    }

    restoreStamina(hero, amount) {
        if (!hero.components.stats) return;

        const stats = hero.components.stats;
        stats.stamina = Math.min(stats.stamina + amount, stats.maxStamina);

        if (EventBus) {
            EventBus.emit(GameConstants.Events.HERO_STAMINA_CHANGE, {
                current: stats.stamina,
                max: stats.maxStamina
            });
        }
    }

    // Death/Respawn Handler (06-damage-system)
    onHeroDied(data) {
        const hero = data.hero;
        if (!hero) return;

        // Lock movement
        hero.locked = true;

        // Death VFX
        if (VFXController && VFXConfig) {
            VFXController.playForeground(
                hero.x,
                hero.y,
                VFXConfig.TEMPLATES?.HERO_DEATH_FX || {
                    type: 'burst',
                    color: '#FF0000',
                    count: 15
                }
            );
        }

        // Respawn after delay
        setTimeout(() => {
            // Get spawn position
            const spawnPos = this._islandManager?.getHeroSpawnPosition?.() || {
                x: hero.x,
                y: hero.y
            };
            hero.x = spawnPos.x;
            hero.y = spawnPos.y;

            // Restore health
            if (hero.components.health) {
                hero.components.health.respawn();
            }

            hero.locked = false;

            if (EventBus && GameConstants) {
                EventBus.emit(GameConstants.Events.HERO_RESPAWNED, { hero });
            }

            Logger.info('[HeroSystem] Hero respawned at', spawnPos);
        }, 2000);
    }

    updateMovement(dt, hero) {
        // if (!InputManager) return;
        const move = this.inputMove;
        hero.inputMove = move; // Sync for Renderer
        const dtSec = dt / 1000;

        // Save previous position for collision/VFX interpolated rendering
        // PrevX/Y must be updated once per logic tick
        hero.prevX = hero.x;
        hero.prevY = hero.y;

        // Calculate velocity
        const speedMultiplier = BiomeManager?.getSpeedMultiplier?.(hero.x, hero.y) || 1.0;
        const effectiveSpeed = hero.speed * speedMultiplier;
        let dx = move.x * effectiveSpeed * dtSec;
        let dy = move.y * effectiveSpeed * dtSec;

        // Collision System
        const collisionSystem = this.game?.getSystem('CollisionSystem');

        // HomeBase Special Check (Legacy tree collision until fully migrated)
        const homeBase = this._homeBase;
        if (homeBase) {
            if (dx !== 0 && homeBase.isBlockedByTrees(hero.x + dx, hero.y)) dx = 0;
            if (dy !== 0 && homeBase.isBlockedByTrees(hero.x, hero.y + dy)) dy = 0;
        }

        if (collisionSystem) {
            // Delegate to physics engine
            (collisionSystem as any).move(hero, dx, dy);
        } else {
            // Fallback
            hero.x += dx;
            hero.y += dy;

            // Simple fallback terrain check
            if (this._islandManager?.isBlocked(hero.x, hero.y)) {
                hero.x = hero.prevX;
                hero.y = hero.prevY;
            }
        }

        // World Bounds Check
        const gameRenderer = this._gameRenderer;
        if (gameRenderer) {
            const halfW = hero.width / 2;
            const halfH = hero.height / 2;
            hero.x = MathUtils.clamp(hero.x, halfW, gameRenderer.worldWidth - halfW);
            hero.y = MathUtils.clamp(hero.y, halfH, gameRenderer.worldHeight - halfH);
        }
    }

    updateCombat(dt, hero) {
        // Delegate to HeroCombatService for auto-targeting and attack execution
        if (HeroCombatService) {
            HeroCombatService.update(dt, hero);
        }
    }

    updateVFX(dt, hero) {
        const dtSec = dt / 1000;
        const isMoving = hero.x !== hero.prevX || hero.y !== hero.prevY;

        // Use cached VFXController ref
        const vfxController = this._vfxController;

        if (isMoving && vfxController) {
            hero.footstepTimer -= dtSec;
            if (hero.footstepTimer <= 0) {
                hero.footstepTimer = hero.footstepInterval || 0.15;

                // Dust Logic
                if (VFXConfig) {
                    const cfg = VFXConfig.HERO.DUST;
                    const cloudDensity = cfg.DENSITY;
                    for (let i = 0; i < cloudDensity; i++) {
                        const offsetX = (Math.random() - 0.5) * cfg.OFFSET_X;
                        const offsetY = (Math.random() - 0.5) * cfg.OFFSET_Y;

                        // GC Config Reuse
                        this._dustConfig.color = cfg.COLOR;
                        this._dustConfig.speed = 1.5 + Math.random();
                        this._dustConfig.lifetime =
                            cfg.LIFETIME_BASE + Math.random() * cfg.LIFETIME_RND;
                        this._dustConfig.size = 20 + Math.random() * 8;

                        vfxController.playBackground(
                            hero.x + offsetX,
                            hero.y + hero.height / 2 - 35 + offsetY,
                            this._dustConfig
                        );
                    }
                }
            }
        } else {
            hero.footstepTimer = 0;
        }
    }

    // --- Public Actions (Callable by Game/Input) ---

    /**
     * Attack a target - delegated to HeroCombatService
     * Kept for backward compatibility with external callers
     */
    tryAttack(hero, target) {
        if (HeroCombatService) {
            return HeroCombatService.tryAttack(hero, target);
        }
        return false;
    }
}

// Create singleton and export
const heroSystem = new HeroSystem();
if (Registry) Registry.register('HeroSystem', heroSystem);

export { HeroSystem, heroSystem };
