/**
 * HeroSystem
 * Handles Input, Physics, and logic for the Hero entity.
 * Decoupled from the Hero class data container.
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants, getConfig } from '@data/GameConstants';
// import { VFXController } from '@vfx/VFXController';
// import { VFXConfig } from '@data/VFXConfig';
import { IslandManager } from '../world/IslandManager';
import { GameRenderer } from '@core/GameRenderer';
import { HomeBase } from '../world/HomeBase';
import { BiomeManager } from '../world/BiomeManager';
import { Registry } from '@core/Registry';
import { HeroCombatService } from './HeroCombatService';
import { MathUtils } from '@core/MathUtils';
import type { IGame, IEntity } from '../types/core.d';
import type { ParticleOptions } from '../types/vfx';
import type { Hero } from '../gameplay/Hero';

class HeroSystem {
    // Property declarations
    game: IGame | null = null;
    hero: Hero | null = null;
    inputMove: { x: number; y: number } = { x: 0, y: 0 };
    isAttacking: boolean = false;
    lastHomeState: boolean = false;
    _dustConfig: ParticleOptions;
    _islandManager: typeof IslandManager | null = null;
    _homeBase: typeof HomeBase | null = null;
    _gameRenderer: typeof GameRenderer | null = null;
    // _vfxController: any; // Moved to HeroVisualsSystem
    _lastStaminaEmit: number = 0;

    constructor() {
        // GC Optimization: Reusable config object for heavy VFX loops
        // _dustConfig moved to HeroVisualsSystem

        this.initListeners();
        Logger.info('[HeroSystem] Initialized');
    }

    init(game: IGame) {
        this.game = game;
        // Assume single hero for now, but design allows for multiple
        this.hero = game.hero as Hero;

        // GC Optimization: Cache system references via Registry (Service Locator)
        this._islandManager = Registry.get<typeof IslandManager>('IslandManager');
        this._homeBase = Registry.get<typeof HomeBase>('HomeBase');
        this._gameRenderer = Registry.get<typeof GameRenderer>('GameRenderer');
        // this._vfxController = Registry.get('VFXController');
    }

    initListeners() {
        if (EventBus) {
            EventBus.on(GameConstants.Events.INPUT_MOVE, (vec: { x: number; y: number }) => {
                this.inputMove = vec;
            });
            // Attack events could be handled here too

            // Death handler (06-damage-system)
            EventBus.on(GameConstants.Events.HERO_DIED, (data: { hero: IEntity }) =>
                this.onHeroDied({ hero: data.hero as Hero })
            );
            EventBus.on(GameConstants.Events.REQUEST_STAMINA_RESTORE, (data: { hero: Hero; amount: number }) => {
                if (data?.hero && typeof data.amount === 'number') this.restoreStamina(data.hero, data.amount);
            });
        }
    }

    update(dt: number) {
        if (!this.hero) {
            // Try to find hero if not yet linked
            if (this.game && this.game.hero) {
                this.hero = this.game.hero as Hero;
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

        // 3. VFX (Dust) - Moved to HeroVisualsSystem
        // this.updateVFX(dt, hero);

        // 4. Events (State & Stats)
        this.handleEvents(hero);
    }

    handleEvents(hero: Hero) {
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
            if (!this._lastStaminaEmit || now - this._lastStaminaEmit > GameConstants.Hero.STAMINA_EMIT_THROTTLE) {
                this._lastStaminaEmit = now;
                EventBus.emit(GameConstants.Events.HERO_STAMINA_CHANGE, {
                    current: hero.stamina,
                    max: hero.maxStamina
                });
            }
        }
    }

    // --- Stamina Management (Moved from StatsComponent) ---
    consumeStamina(hero: Hero, amount: number) {
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

    restoreStamina(hero: Hero, amount: number) {
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
    onHeroDied(data: { hero: Hero }) {
        const hero = data.hero;
        if (!hero) return;

        // Lock movement
        hero.locked = true;

        // Death VFX - Moved to HeroVisualsSystem

        // Respawn after delay
        setTimeout(() => {
            // Get spawn position
            const spawnPos = this._islandManager?.getHeroSpawnPosition?.() || {
                x: hero.x,
                y: hero.y
            };
            hero.x = spawnPos.x;
            hero.y = spawnPos.y;

            if (hero.components.health) {
                hero.components.health.respawn();
                if (EventBus) {
                    const h = hero.components.health;
                    EventBus.emit(GameConstants.Events.HERO_HEALTH_CHANGE, { current: h.health, max: h.maxHealth });
                }
            }
            hero.locked = false;

            if (EventBus && GameConstants) {
                EventBus.emit(GameConstants.Events.HERO_RESPAWNED, { hero });
            }

            Logger.info('[HeroSystem] Hero respawned at', spawnPos);
        }, GameConstants.Hero.RESPAWN_DELAY_MS);
    }

    updateMovement(dt: number, hero: Hero) {
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

        // HomeBase Special Check (Legacy tree collision until fully migrated)
        const homeBase = this._homeBase;
        if (homeBase) {
            if (dx !== 0 && homeBase.isBlockedByTrees(hero.x + dx, hero.y)) dx = 0;
            if (dy !== 0 && homeBase.isBlockedByTrees(hero.x, hero.y + dy)) dy = 0;
        }

        if (EventBus) {
            EventBus.emit(GameConstants.Events.ENTITY_MOVE_REQUEST, { entity: hero, dx, dy });
        } else {
            hero.x += dx;
            hero.y += dy;
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

    updateCombat(dt: number, hero: Hero) {
        // Delegate to HeroCombatService for auto-targeting and attack execution
        if (HeroCombatService) {
            HeroCombatService.update(dt, hero);
        }
    }

    // updateVFX moved to HeroVisualsSystem

    // --- Public Actions (Callable by Game/Input) ---

    /**
     * Attack a target - delegated to HeroCombatService
     * Kept for backward compatibility with external callers
     */
    tryAttack(hero: Hero, target: IEntity) {
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
